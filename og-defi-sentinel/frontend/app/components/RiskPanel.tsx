"use client";

import { useState } from "react";

const protocolPresets = [
  { name: "Aave", chain: "Ethereum" },
  { name: "Uniswap", chain: "Ethereum" },
  { name: "Compound", chain: "Ethereum" },
  { name: "GMX", chain: "Arbitrum" },
  { name: "Raydium", chain: "Solana" },
  { name: "Marinade", chain: "Solana" },
];

export default function RiskPanel() {
  const [protocol, setProtocol] = useState("");
  const [chain, setChain] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function assessRisk(p?: string, c?: string) {
    const protocolName = p ?? protocol;
    const chainName = c ?? chain;
    if (!protocolName.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Perform a comprehensive risk assessment for ${protocolName}${
                chainName ? ` on ${chainName}` : ""
              }. Evaluate across these dimensions:

1. **Smart Contract Risk** - Code quality, audit history, upgrade patterns
2. **Oracle Risk** - Price feed reliability, manipulation resistance
3. **Liquidity Risk** - TVL stability, withdrawal mechanisms
4. **Governance Risk** - Decentralization, timelock, admin keys
5. **Market Risk** - Token volatility, correlation, systemic risk

Provide a score (1-10) for each dimension and an overall composite risk score. Include specific concerns and mitigations.`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setResult(data.reply);
      setTxHash(data.x402_tx_hash ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assessment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          background: "var(--og-surface)",
          borderColor: "var(--og-border)",
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--og-cyan)" }}>
          DeFi Risk Assessment
        </h2>
        <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
          Multi-dimensional protocol risk analysis via OpenGradient
        </p>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ background: "var(--og-deep)" }}
      >
        {/* Protocol presets */}
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--og-text-dim)" }}
          >
            Quick Select
          </label>
          <div className="flex flex-wrap gap-2">
            {protocolPresets.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setProtocol(p.name);
                  setChain(p.chain);
                  assessRisk(p.name, p.chain);
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{
                  background: "var(--og-surface)",
                  border: "1px solid var(--og-border)",
                  color: "var(--og-text-dim)",
                }}
              >
                {p.name} ({p.chain})
              </button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <div className="flex gap-3 mb-6">
          <input
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            placeholder="Protocol name (e.g., Aave)"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: "var(--og-surface)",
              border: "1px solid var(--og-border)",
              color: "var(--og-text)",
            }}
          />
          <input
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            placeholder="Chain (optional)"
            className="w-48 px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: "var(--og-surface)",
              border: "1px solid var(--og-border)",
              color: "var(--og-text)",
            }}
          />
          <button
            onClick={() => assessRisk()}
            disabled={loading || !protocol.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--og-teal), var(--og-cyan))",
              color: "var(--og-deep)",
            }}
          >
            {loading ? "Assessing..." : "Assess Risk"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-lg mb-4 text-sm"
            style={{
              background: "rgba(248, 113, 113, 0.1)",
              border: "1px solid var(--og-danger)",
              color: "var(--og-danger)",
            }}
          >
            {error}
            <p className="mt-1 text-xs" style={{ color: "var(--og-text-dim)" }}>
              Make sure OG_PRIVATE_KEY is set in your Vercel environment variables
              and your wallet has OUSDC.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-3">
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
              </div>
              <p style={{ color: "var(--og-text-dim)" }}>
                Running risk assessment via x402...
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--og-surface)",
              border: "1px solid var(--og-border)",
            }}
          >
            <div
              className="prose prose-sm max-w-none whitespace-pre-wrap text-sm"
              style={{ color: "var(--og-text)" }}
            >
              {result}
            </div>
            {txHash && (
              <p className="mt-4 text-xs" style={{ color: "var(--og-text-dim)" }}>
                x402 payment tx: {txHash}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
