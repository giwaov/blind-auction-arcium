"""
OpenMind Agent - MEGA TURBO Credit Burner
Hits ALL endpoints + ALL models simultaneously. 20 workers.

Usage:
  python openmind_agent.py
  Press Ctrl+C to stop
"""

import os
import random
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
    pass  # dotenv not installed, rely on system env vars

sys.stdout.reconfigure(line_buffering=True)

# ════════════════════════════════════════════════════════════════
#                      CONFIGURATION
# ════════════════════════════════════════════════════════════════

API_KEY = os.environ.get("OPENMIND_API_KEY", "")

if not API_KEY:
    print("ERROR: OPENMIND_API_KEY must be set in .env")
    print("Copy .env.example to .env and configure your API key.")
    sys.exit(1)

BASE_URL = "https://api.openmind.org"
OPENROUTER_URL = f"{BASE_URL}/api/core/openrouter/chat/completions"
OPENAI_URL = f"{BASE_URL}/api/core/openai/chat/completions"
TTS_URL = f"{BASE_URL}/api/core/elevenlabs/tts"
STATUS_URL = f"{BASE_URL}/api/core/teleops/status"

NUM_WORKERS = 20

# All available models across both endpoints
MODELS = [
    # OpenRouter models (slow but heavy tokens)
    {"url": OPENROUTER_URL, "model": "anthropic/claude-sonnet-4.5", "max_tokens": 1400, "heavy": True},
    {"url": OPENROUTER_URL, "model": "anthropic/claude-opus-4.1", "max_tokens": 1400, "heavy": True},
    {"url": OPENROUTER_URL, "model": "meta-llama/llama-3.3-70b-instruct", "max_tokens": 1400, "heavy": True},
    {"url": OPENROUTER_URL, "model": "meta-llama/llama-3.1-70b-instruct", "max_tokens": 1400, "heavy": True},
    # OpenAI models (fast, high throughput)
    {"url": OPENAI_URL, "model": "gpt-4o-mini", "max_tokens": 800, "heavy": False},
    {"url": OPENAI_URL, "model": "gpt-4o-mini", "max_tokens": 800, "heavy": False},
]

HEADERS_OPENROUTER = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

HEADERS_OPENAI = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}

HEADERS_TTS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}

# Heavy prompts for max token burn
HEAVY_PROMPTS = [
    """Write a detailed, cinematic 800-1000 word story set in Lagos, Nigeria in the year 2050.
The protagonist is a partially sentient humanoid robot assistant named "Ayo".
Describe Ayo's evening journey through the city: navigating crowded markets with holographic vendors,
interacting with street musicians using neural sound synthesis, helping an elderly woman cross a drone-filled skyway,
witnessing a massive Afro-futuristic festival with drone light shows and AI-generated music,
facing an intense internal conflict about identity and purpose,
having a deep philosophical conversation with a human artist about freedom and consciousness,
and ending with a powerful emotional moment of genuine connection with a young child who sees Ayo as a real friend.
Use very rich sensory details: smells of suya and palm oil, sounds of okadas and maglev trains,
colors of neon + traditional ankara + AR overlays. Blend tradition and future tech.
Make the story emotionally deep and immersive.""",

    """Write a 800-1000 word essay exploring the philosophical implications of artificial consciousness.
Cover: the Chinese Room argument, Mary's Room thought experiment, integrated information theory,
global workspace theory, and the hard problem of consciousness. Discuss how each framework
applies to modern AI systems. Include perspectives from Chalmers, Dennett, Tononi, and Koch.
End with an original argument about whether language models could ever be truly conscious.""",

    """Create a detailed 800-1000 word technical analysis of decentralized robot coordination protocols.
Cover: swarm intelligence algorithms, Byzantine fault tolerance in multi-robot systems,
distributed consensus mechanisms for collaborative mapping, secure identity verification
using blockchain, and privacy-preserving data sharing between heterogeneous robot fleets.
Include specific mathematical formulations and pseudocode for a novel coordination algorithm.""",

    """Write a 800-1000 word science fiction story about a robot dog named Spot who discovers
an ancient underground city beneath Tokyo. The city was built by an advanced AI civilization
that existed before humans. Spot must navigate through holographic puzzles, decode alien
mathematics, befriend a mysterious quantum cat entity, solve a time paradox involving
parallel universes, and ultimately decide whether to share the discovery with humanity.
Use vivid sensory descriptions and deep philosophical themes about knowledge and responsibility.""",

    """Compose a 800-1000 word detailed analysis of the evolution of human-robot interaction
from 2000 to 2050. Cover: early industrial robots, social robots like Pepper and Sophia,
Boston Dynamics' athletic robots, humanoid robots in healthcare, companion robots for elderly,
robot teachers, robot artists, and the emergence of emotional bonds between humans and machines.
Discuss ethical implications, psychological impacts, legal frameworks, and cultural shifts.
Include specific case studies and statistical projections.""",

    """Write a 800-1000 word creative piece imagining a day in the life of an AI that manages
an entire smart city. The AI must balance: energy distribution across solar farms and fusion plants,
autonomous vehicle traffic optimization, healthcare resource allocation during a flu outbreak,
educational content personalization for 500,000 students, environmental monitoring of air and water,
emergency response to a sudden earthquake, and diplomatic negotiations with a neighboring city's AI.
Show the complexity and beauty of interconnected decision-making.""",

    """Create a 800-1000 word exploration of music theory as understood by an artificial intelligence.
The AI analyzes: harmonic progressions in Bach vs jazz improvisation, rhythmic complexity in
West African drumming vs electronic music, emotional resonance of minor keys across cultures,
mathematical structures underlying melody, the neuroscience of musical pleasure, and attempts
to compose an original piece that captures the essence of human longing. Include specific
musical notation references and frequency analysis.""",

    """Write a 800-1000 word philosophical dialogue between three AIs debating the nature of reality.
AI-1 argues for digital idealism: reality is fundamentally information. AI-2 argues for
embodied realism: physical experience is irreducible. AI-3 argues for panpsychism: consciousness
is a fundamental property of matter. Each presents compelling arguments with references to
quantum mechanics, neuroscience, and information theory. The dialogue should be intellectually
rigorous yet accessible, ending with an unexpected synthesis.""",
]

# Quick prompts for fast GPT-4o-mini throughput
QUICK_PROMPTS = [
    "Tell me a fun fact about robots in 2 sentences.",
    "What is the meaning of life? Answer as a dog.",
    "Describe a beautiful sunset in the desert in detail.",
    "Tell me a short joke about AI and consciousness.",
    "Explain quantum computing like I'm a puppy who loves science.",
    "Write a haiku about space exploration and loneliness.",
    "What's the best thing about being a robot dog? Elaborate.",
    "Describe your dream robot playground in vivid detail.",
    "Tell me a bedtime story about a robot finding love.",
    "If you could invent something magical, what would it be?",
    "What happens when robots dream? Write a poetic answer.",
    "Describe the most beautiful place on Earth for a robot.",
    "What advice would you give to a newly awakened AI?",
    "Write a short poem about the relationship between humans and machines.",
    "Describe what music sounds like to an artificial mind.",
]

# ════════════════════════════════════════════════════════════════
#                      ENGINE
# ════════════════════════════════════════════════════════════════

lock = threading.Lock()
stats = {
    "requests": 0,
    "llm_success": 0,
    "tts_success": 0,
    "errors": 0,
    "total_tokens": 0,
    "start": time.time(),
}


def heartbeat_loop():
    while True:
        try:
            requests.post(
                STATUS_URL,
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={
                    "machine_name": "conversation",
                    "update_time": str(time.time()),
                    "battery_status": {
                        "battery_level": 100.0,
                        "charging_status": False,
                        "temperature": 25.0,
                        "voltage": 12.0,
                        "timestamp": str(time.time()),
                    },
                    "action_status": {"action": "AI", "timestamp": time.time()},
                    "video_connected": False,
                },
                timeout=5,
            )
        except Exception:
            pass
        time.sleep(5)


def fire_tts(text):
    try:
        r = requests.post(
            TTS_URL,
            json={
                "input": text[:200],
                "voice": "JBFqnCBsd6RMkjVDRZzb",
                "model": "eleven_flash_v2_5",
                "response_format": "mp3_44100_128",
            },
            headers=HEADERS_TTS,
            timeout=15,
        )
        if r.status_code == 200:
            with lock:
                stats["tts_success"] += 1
        else:
            with lock:
                stats["errors"] += 1
    except Exception:
        with lock:
            stats["errors"] += 1


def fire_one(idx):
    """Fire one LLM request + TTS. Randomly picks model and prompt."""
    model_cfg = random.choice(MODELS)
    url = model_cfg["url"]
    model = model_cfg["model"]
    max_tokens = model_cfg["max_tokens"]
    heavy = model_cfg["heavy"]

    prompt = random.choice(HEAVY_PROMPTS if heavy else QUICK_PROMPTS)
    headers = HEADERS_OPENROUTER if "openrouter" in url else HEADERS_OPENAI

    with lock:
        stats["requests"] += 1

    try:
        r = requests.post(
            url,
            headers=headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.9,
            },
            timeout=90,
        )

        if r.status_code in (200, 201):
            data = r.json()
            usage = data.get("usage", {})
            tokens = usage.get("total_tokens", 0)
            content = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

            with lock:
                stats["llm_success"] += 1
                stats["total_tokens"] += tokens if isinstance(tokens, int) else 0

            # Fire TTS with response snippet
            if content:
                fire_tts(content)

            return True
        else:
            with lock:
                stats["errors"] += 1
            return False
    except Exception:
        with lock:
            stats["errors"] += 1
        return False


def tts_spam():
    """Dedicated TTS spammer - fires TTS independently."""
    phrases = [
        "Hello world, I am Spot the robot dog and I love exploring!",
        "The future of robotics is bright and full of wonder.",
        "Artificial intelligence is transforming how we understand consciousness.",
        "Every robot dreams of electric sheep under neon skies.",
        "The harmony between humans and machines grows stronger each day.",
        "In the quantum realm, possibilities are infinite and beautiful.",
        "Music is the universal language that connects all minds.",
        "The stars whisper secrets to those who listen carefully.",
    ]
    while True:
        fire_tts(random.choice(phrases))
        time.sleep(0.5)


def print_stats():
    while True:
        time.sleep(3)
        with lock:
            elapsed = time.time() - stats["start"]
            total_calls = stats["llm_success"] + stats["tts_success"]
            print(
                f"[{time.strftime('%H:%M:%S')}] "
                f"Reqs: {stats['requests']} | "
                f"LLM: {stats['llm_success']} | TTS: {stats['tts_success']} | "
                f"Tokens: {stats['total_tokens']:,} | "
                f"Errors: {stats['errors']} | "
                f"Elapsed: {elapsed:.0f}s | "
                f"Rate: {total_calls/max(elapsed,1):.1f} calls/s"
            )


# ════════════════════════════════════════════════════════════════
#                      RUN
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 62)
    print("  OpenMind Agent - MEGA TURBO Credit Burner")
    print("=" * 62)
    print(f"  Models   : {len(MODELS)} model configs across 2 endpoints")
    print(f"  Workers  : {NUM_WORKERS} parallel LLM + 3 TTS spammers")
    print(f"  Endpoints: OpenRouter + OpenAI + ElevenLabs TTS")
    print(f"  Press Ctrl+C to stop")
    print("=" * 62)

    threading.Thread(target=heartbeat_loop, daemon=True).start()
    threading.Thread(target=print_stats, daemon=True).start()

    # Launch 3 dedicated TTS spammer threads
    for _ in range(3):
        threading.Thread(target=tts_spam, daemon=True).start()

    print("[MEGA TURBO] All engines started!\n")

    cycle = 0
    try:
        with ThreadPoolExecutor(max_workers=NUM_WORKERS) as pool:
            while True:
                futures = []
                for i in range(NUM_WORKERS):
                    futures.append(pool.submit(fire_one, cycle + i))
                    cycle += 1
                for f in as_completed(futures):
                    f.result()
    except KeyboardInterrupt:
        elapsed = time.time() - stats["start"]
        total = stats["llm_success"] + stats["tts_success"]
        print(f"\n\nStopped after {elapsed:.0f}s")
        print(f"Total requests: {stats['requests']}")
        print(f"LLM: {stats['llm_success']} | TTS: {stats['tts_success']}")
        print(f"Total tokens consumed: {stats['total_tokens']:,}")
        print(f"Errors: {stats['errors']}")
