"use client";

import { useState, useEffect } from "react";

interface Prediction {
  model: string;
  asset: string;
  timeframe: string;
  outlook: string;
  confidence: string;
  factors: string[];
  action: string;
}

export default function PredictionsPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function fetchPredictions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setPredictions(data.predictions ?? []);
      setTxHash(data.x402_tx_hash ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch predictions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
  }, []);

  const confidenceColor = (c: string) => {
    switch (c.toLowerCase()) {
      case "high":
        return "var(--og-accent)";
      case "medium":
        return "var(--og-warning)";
      case "low":
        return "var(--og-danger)";
      default:
        return "var(--og-text-dim)";
    }
  };

  const confidenceWidth = (c: string) => {
    switch (c.toLowerCase()) {
      case "high":
        return "85%";
      case "medium":
        return "55%";
      case "low":
        return "25%";
      default:
        return "50%";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{
          background: "var(--og-surface)",
          borderColor: "var(--og-border)",
        }}
      >
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--og-cyan)" }}>
            Market Predictions
          </h2>
          <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
            On-chain ML workflows on OpenGradient (Chain 10744)
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-40"
          style={{
            background: "var(--og-teal)",
            color: "var(--og-cyan)",
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ background: "var(--og-deep)" }}
      >
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

        {loading && predictions.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-3">
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
              </div>
              <p style={{ color: "var(--og-text-dim)" }}>
                Fetching predictions via x402 payment...
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {predictions.map((p, i) => (
            <div
              key={i}
              className="rounded-xl p-5 transition-all hover:scale-[1.01]"
              style={{
                background: "var(--og-surface)",
                border: "1px solid var(--og-border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-mono px-2 py-1 rounded"
                  style={{
                    background: "var(--og-teal-dark)",
                    color: "var(--og-cyan)",
                  }}
                >
                  {p.model ?? `${p.asset}-${p.timeframe}`}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: confidenceColor(p.confidence) }}
                >
                  {p.confidence?.toUpperCase()}
                </span>
              </div>

              <h3 className="font-semibold mb-1" style={{ color: "var(--og-text)" }}>
                {p.asset} — {p.timeframe}
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--og-text-dim)" }}>
                {p.outlook}
              </p>

              {/* Confidence bar */}
              <div
                className="h-1.5 rounded-full mb-3"
                style={{ background: "var(--og-teal-dark)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: confidenceWidth(p.confidence),
                    background: confidenceColor(p.confidence),
                  }}
                />
              </div>

              {p.factors && p.factors.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.factors.map((f, j) => (
                    <span
                      key={j}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--og-teal-dark)",
                        color: "var(--og-text-dim)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="text-sm font-medium"
                style={{ color: "var(--og-accent)" }}
              >
                Action: {p.action}
              </div>
            </div>
          ))}
        </div>

        {txHash && (
          <p className="mt-4 text-xs" style={{ color: "var(--og-text-dim)" }}>
            x402 payment tx: {txHash}
          </p>
        )}
      </div>
    </div>
  );
}
