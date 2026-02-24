"use client";

import { useState } from "react";

interface Finding {
  severity: string;
  title: string;
  description: string;
  location: string;
  recommendation: string;
}

interface AuditResult {
  summary: string;
  risk_level: string;
  findings: Finding[];
  gas_optimizations: string[];
  overall_score: number;
}

const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
}`;

export default function AuditPanel() {
  const [code, setCode] = useState(sampleContract);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function runAudit() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAudit(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setAudit(data.audit);
      setTxHash(data.x402_tx_hash ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "critical":
        return "#ef4444";
      case "high":
        return "var(--og-danger)";
      case "medium":
        return "var(--og-warning)";
      case "low":
        return "var(--og-accent)";
      default:
        return "var(--og-text-dim)";
    }
  };

  const riskColor = (r: string) => {
    switch (r.toLowerCase()) {
      case "critical":
        return "#ef4444";
      case "high":
        return "var(--og-danger)";
      case "medium":
        return "var(--og-warning)";
      case "low":
        return "var(--og-accent)";
      default:
        return "var(--og-text-dim)";
    }
  };

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
          Smart Contract Audit
        </h2>
        <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
          TEE-verified security analysis powered by OpenGradient
        </p>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ background: "var(--og-deep)" }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Code editor */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--og-text-dim)" }}
            >
              Solidity Source Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={20}
              className="w-full rounded-lg p-4 font-mono text-sm resize-none outline-none"
              style={{
                background: "var(--og-surface)",
                border: "1px solid var(--og-border)",
                color: "var(--og-text)",
              }}
              placeholder="Paste your Solidity code here..."
            />
            <button
              onClick={runAudit}
              disabled={loading || !code.trim()}
              className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, var(--og-teal), var(--og-cyan))",
                color: "var(--og-deep)",
              }}
            >
              {loading ? "Auditing via x402..." : "Run TEE-Verified Audit"}
            </button>
          </div>

          {/* Results */}
          <div>
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

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="flex gap-1 justify-center mb-3">
                    <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                    <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                    <span className="typing-dot w-3 h-3 rounded-full" style={{ background: "var(--og-cyan)" }} />
                  </div>
                  <p style={{ color: "var(--og-text-dim)" }}>
                    Running TEE-verified audit...
                  </p>
                </div>
              </div>
            )}

            {audit && (
              <div className="space-y-4">
                {/* Summary card */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--og-surface)",
                    border: "1px solid var(--og-border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: "var(--og-text)" }}>
                      Summary
                    </h3>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{
                        background: `${riskColor(audit.risk_level)}20`,
                        color: riskColor(audit.risk_level),
                      }}
                    >
                      {audit.risk_level?.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--og-text-dim)" }}>
                    {audit.summary}
                  </p>
                  {audit.overall_score !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--og-text-dim)" }}>
                          Security Score
                        </span>
                        <span style={{ color: "var(--og-cyan)" }}>
                          {audit.overall_score}/100
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full"
                        style={{ background: "var(--og-teal-dark)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${audit.overall_score}%`,
                            background:
                              audit.overall_score >= 70
                                ? "var(--og-accent)"
                                : audit.overall_score >= 40
                                ? "var(--og-warning)"
                                : "var(--og-danger)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Findings */}
                {audit.findings?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--og-text)" }}>
                      Findings ({audit.findings.length})
                    </h3>
                    {audit.findings.map((f, i) => (
                      <div
                        key={i}
                        className="rounded-lg p-4"
                        style={{
                          background: "var(--og-surface)",
                          borderLeft: `3px solid ${severityColor(f.severity)}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${severityColor(f.severity)}20`,
                              color: severityColor(f.severity),
                            }}
                          >
                            {f.severity?.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--og-text)" }}>
                            {f.title}
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: "var(--og-text-dim)" }}>
                          {f.description}
                        </p>
                        {f.location && (
                          <p className="text-xs font-mono" style={{ color: "var(--og-text-dim)" }}>
                            Location: {f.location}
                          </p>
                        )}
                        {f.recommendation && (
                          <p className="text-xs mt-1" style={{ color: "var(--og-accent)" }}>
                            Fix: {f.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Gas optimizations */}
                {audit.gas_optimizations?.length > 0 && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--og-surface)",
                      border: "1px solid var(--og-border)",
                    }}
                  >
                    <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--og-text)" }}>
                      Gas Optimizations
                    </h3>
                    <ul className="space-y-1">
                      {audit.gas_optimizations.map((g, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-start gap-2"
                          style={{ color: "var(--og-text-dim)" }}
                        >
                          <span style={{ color: "var(--og-accent)" }}>•</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {txHash && (
                  <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
                    x402 payment tx: {txHash}
                  </p>
                )}
              </div>
            )}

            {!audit && !loading && !error && (
              <div className="flex items-center justify-center h-64">
                <p style={{ color: "var(--og-text-dim)" }}>
                  Paste Solidity code and click &quot;Run Audit&quot; to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
