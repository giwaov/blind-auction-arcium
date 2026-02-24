"""
DeFi Sentinel — A real-time DeFi sentiment oracle powered by OpenGradient's
TEE-verified LLM inference and MemSync persistent memory.

Every analysis is cryptographically attested on-chain via OpenGradient's x402 protocol.
Historical analyses are stored in MemSync for trend tracking and context enrichment.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# OpenGradient client setup
# ---------------------------------------------------------------------------

def get_og_client():
    """Initialize OpenGradient client with private key."""
    try:
        import opengradient as og
    except ImportError:
        print("Error: opengradient not installed. Run: pip install opengradient")
        sys.exit(1)

    pk = os.getenv("OG_PRIVATE_KEY")
    if not pk:
        print("Error: OG_PRIVATE_KEY not set in .env")
        sys.exit(1)

    return og.Client(private_key=pk)


# ---------------------------------------------------------------------------
# MemSync memory layer
# ---------------------------------------------------------------------------

MEMSYNC_BASE = "https://api.memchat.io/v1"


def memsync_headers():
    key = os.getenv("MEMSYNC_API_KEY")
    if not key:
        return None
    return {"X-API-Key": key, "Content-Type": "application/json"}


def store_memory(token: str, analysis: dict):
    """Store a sentiment analysis in MemSync for long-term recall."""
    headers = memsync_headers()
    if not headers:
        return None

    summary = (
        f"DeFi Sentinel analysis for {token}: "
        f"sentiment={analysis['sentiment']} score={analysis['score']}/100, "
        f"signal={analysis['signal']}. "
        f"Reasoning: {analysis['reasoning']}"
    )

    payload = {
        "messages": [
            {"role": "user", "content": f"Analyze {token} market sentiment"},
            {"role": "assistant", "content": summary},
        ],
        "agent_id": "defi-sentinel",
        "thread_id": f"sentinel-{token.lower()}",
        "source": "chat",
    }

    try:
        resp = requests.post(f"{MEMSYNC_BASE}/memories", json=payload, headers=headers, timeout=15)
        return resp.json() if resp.ok else None
    except Exception:
        return None


def recall_memories(token: str, limit: int = 5):
    """Search MemSync for previous analyses of this token."""
    headers = memsync_headers()
    if not headers:
        return []

    payload = {
        "query": f"DeFi sentiment analysis for {token} market outlook signal",
        "limit": limit,
        "rerank": True,
    }

    try:
        resp = requests.post(f"{MEMSYNC_BASE}/memories/search", json=payload, headers=headers, timeout=15)
        if resp.ok:
            data = resp.json()
            return data.get("memories", [])
    except Exception:
        pass
    return []


# ---------------------------------------------------------------------------
# Sentiment analysis via OpenGradient TEE-verified LLM
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """DeFi analyst. Reply ONLY with JSON:
{"token":"SYM","sentiment":"BULLISH|BEARISH|NEUTRAL","score":0-100,"signal":"STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL","confidence":"HIGH|MEDIUM|LOW","key_factors":["f1","f2","f3"],"reasoning":"1 sentence","risk_level":"LOW|MEDIUM|HIGH|EXTREME"}
Score: 0-20=STRONG_SELL,21-40=SELL,41-60=HOLD,61-80=BUY,81-100=STRONG_BUY."""

# ---------------------------------------------------------------------------
# Local result cache — avoids redundant API calls for recent analyses
# ---------------------------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
CACHE_TTL = 300  # 5 minutes


def _cache_path(token: str, model: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{token.lower()}_{model}.json")


def _read_cache(token: str, model: str):
    """Return cached analysis if it exists and is fresh."""
    path = _cache_path(token, model)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            data = json.load(f)
        age = time.time() - data.get("_cached_at", 0)
        if age < CACHE_TTL:
            data["_from_cache"] = True
            return data
    except Exception:
        pass
    return None


def _write_cache(token: str, model: str, analysis: dict):
    """Cache an analysis result locally."""
    path = _cache_path(token, model)
    analysis["_cached_at"] = time.time()
    try:
        with open(path, "w") as f:
            json.dump(analysis, f)
    except Exception:
        pass


def analyze_sentiment(client, token: str, context: str = "", model=None, no_cache: bool = False):
    """Run TEE-verified sentiment analysis via OpenGradient LLM."""
    import opengradient as og

    if model is None:
        model = og.TEE_LLM.CLAUDE_3_5_HAIKU  # cheapest model by default

    # Check local cache first (saves OPG tokens)
    if not no_cache:
        cached = _read_cache(token, str(model))
        if cached:
            return cached

    # Build a minimal prompt to reduce token usage
    user_prompt = f"Sentiment for {token}."
    if context:
        user_prompt += f" Context: {context}"

    # Only recall memory if MemSync is configured (avoids wasted context tokens)
    if os.getenv("MEMSYNC_API_KEY"):
        memories = recall_memories(token, limit=2)
        if memories:
            user_prompt += " History: " + "; ".join(
                m.get("memory", "")[:80] for m in memories[:2]
            )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    result = client.llm.chat(
        model=model,
        messages=messages,
        max_tokens=250,  # reduced from 500 — JSON response is ~150 tokens
        temperature=0.1,  # lower temp = more deterministic = fewer retries
        x402_settlement_mode=og.x402SettlementMode.SETTLE_BATCH,
    )

    raw = result.chat_output["content"]
    # Strip markdown code fences if present
    if raw.strip().startswith("```"):
        lines = raw.strip().split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    analysis = json.loads(raw)

    # Attach on-chain proof metadata
    analysis["proof"] = {
        "payment_hash": getattr(result, "payment_hash", None),
        "transaction_hash": getattr(result, "transaction_hash", None),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": str(model),
        "verified": True,
    }

    # Store in MemSync
    mem_result = store_memory(token, analysis)
    if mem_result:
        analysis["memory_stored"] = True

    # Cache locally to avoid paying for identical queries
    _write_cache(token, str(model), analysis)

    return analysis


def multi_analyze(client, tokens: list, context: str = "", no_cache: bool = False):
    """Analyze multiple tokens and return a portfolio-level view."""
    results = []
    for token in tokens:
        try:
            result = analyze_sentiment(client, token, context, no_cache=no_cache)
            results.append(result)
        except Exception as e:
            results.append({"token": token, "error": str(e)})

    # Portfolio-level summary
    valid = [r for r in results if "score" in r]
    avg_score = sum(r["score"] for r in valid) / len(valid) if valid else 0
    bullish = sum(1 for r in valid if r["sentiment"] == "BULLISH")
    bearish = sum(1 for r in valid if r["sentiment"] == "BEARISH")

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tokens_analyzed": len(results),
        "average_score": round(avg_score, 1),
        "market_bias": "BULLISH" if bullish > bearish else ("BEARISH" if bearish > bullish else "NEUTRAL"),
        "analyses": results,
    }


# ---------------------------------------------------------------------------
# CLI interface
# ---------------------------------------------------------------------------

def print_analysis(analysis: dict):
    """Pretty-print a sentiment analysis."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        from rich.table import Table
        console = Console()
    except ImportError:
        # Fallback to plain printing
        print(json.dumps(analysis, indent=2))
        return

    if "error" in analysis:
        console.print(f"[red]Error analyzing {analysis.get('token', '?')}: {analysis['error']}[/red]")
        return

    token = analysis["token"]
    sentiment = analysis["sentiment"]
    score = analysis["score"]
    signal = analysis["signal"]
    confidence = analysis["confidence"]
    risk = analysis["risk_level"]

    # Color coding
    sent_color = {"BULLISH": "green", "BEARISH": "red", "NEUTRAL": "yellow"}.get(sentiment, "white")
    sig_color = {"STRONG_BUY": "bold green", "BUY": "green", "HOLD": "yellow", "SELL": "red", "STRONG_SELL": "bold red"}.get(signal, "white")

    # Score bar
    filled = score // 5
    bar = f"[green]{'█' * filled}[/green][dim]{'░' * (20 - filled)}[/dim]"

    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column(style="bold cyan", width=16)
    table.add_column()
    table.add_row("Token", f"[bold]{token}[/bold]")
    table.add_row("Sentiment", f"[{sent_color}]{sentiment}[/{sent_color}]")
    table.add_row("Score", f"{bar} {score}/100")
    table.add_row("Signal", f"[{sig_color}]{signal}[/{sig_color}]")
    table.add_row("Confidence", confidence)
    table.add_row("Risk Level", risk)
    table.add_row("", "")
    table.add_row("Key Factors", "")
    for f in analysis.get("key_factors", []):
        table.add_row("", f"  • {f}")
    table.add_row("", "")
    table.add_row("Reasoning", analysis.get("reasoning", ""))

    proof = analysis.get("proof", {})
    if proof.get("payment_hash"):
        table.add_row("", "")
        table.add_row("On-Chain Proof", f"[dim]{proof['payment_hash']}[/dim]")

    if analysis.get("memory_stored"):
        table.add_row("Memory", "[dim]Stored in MemSync[/dim]")

    if analysis.get("_from_cache"):
        table.add_row("Cache", "[dim yellow]Served from local cache (0 OPG)[/dim yellow]")

    console.print(Panel(table, title=f"[bold]DeFi Sentinel — {token}[/bold]", border_style="cyan"))


def main():
    parser = argparse.ArgumentParser(
        description="DeFi Sentinel — AI-powered sentiment oracle on OpenGradient"
    )
    parser.add_argument(
        "tokens",
        nargs="+",
        help="Token symbols to analyze (e.g., ETH BTC SOL)",
    )
    parser.add_argument(
        "--context", "-c",
        default="",
        help="Additional market context to include in the analysis",
    )
    parser.add_argument(
        "--model", "-m",
        default="claude-3.5-haiku",
        choices=["gpt-4o", "claude-3.5-haiku", "claude-4.0-sonnet", "grok-3-beta", "gemini-2.5-flash"],
        help="LLM model to use (default: claude-3.5-haiku, cheapest)",
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="Output raw JSON instead of formatted display",
    )
    parser.add_argument(
        "--history",
        action="store_true",
        help="Show previous analyses from MemSync memory",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Skip local cache and force a fresh API call",
    )
    parser.add_argument(
        "--cache-ttl",
        type=int,
        default=300,
        help="Cache lifetime in seconds (default: 300 = 5min)",
    )
    args = parser.parse_args()

    import opengradient as og

    model_map = {
        "gpt-4o": og.TEE_LLM.GPT_4O,
        "claude-3.5-haiku": og.TEE_LLM.CLAUDE_3_5_HAIKU,
        "claude-4.0-sonnet": og.TEE_LLM.CLAUDE_4_0_SONNET,
        "grok-3-beta": og.TEE_LLM.GROK_3_BETA,
        "gemini-2.5-flash": og.TEE_LLM.GEMINI_2_5_FLASH,
    }
    model = model_map.get(args.model, og.TEE_LLM.CLAUDE_3_5_HAIKU)

    # Apply custom cache TTL
    global CACHE_TTL
    CACHE_TTL = args.cache_ttl

    # Show history mode
    if args.history:
        for token in args.tokens:
            memories = recall_memories(token, limit=10)
            if memories:
                print(f"\n--- Memory history for {token.upper()} ---")
                for m in memories:
                    print(f"  [{m.get('created_at', 'unknown')}] {m.get('memory', '')}")
            else:
                print(f"No memory history found for {token.upper()}")
        return

    client = get_og_client()

    if len(args.tokens) == 1:
        analysis = analyze_sentiment(client, args.tokens[0].upper(), args.context, model, no_cache=args.no_cache)
        if args.json:
            print(json.dumps(analysis, indent=2))
        else:
            print_analysis(analysis)
    else:
        tokens = [t.upper() for t in args.tokens]
        portfolio = multi_analyze(client, tokens, args.context, no_cache=args.no_cache)
        if args.json:
            print(json.dumps(portfolio, indent=2))
        else:
            try:
                from rich.console import Console
                console = Console()
                console.print(f"\n[bold cyan]DeFi Sentinel — Portfolio Analysis[/bold cyan]")
                console.print(f"  Market Bias: [bold]{portfolio['market_bias']}[/bold]")
                console.print(f"  Average Score: {portfolio['average_score']}/100")
                console.print()
            except ImportError:
                print(f"\nPortfolio: bias={portfolio['market_bias']} avg_score={portfolio['average_score']}")

            for analysis in portfolio["analyses"]:
                print_analysis(analysis)


if __name__ == "__main__":
    main()
