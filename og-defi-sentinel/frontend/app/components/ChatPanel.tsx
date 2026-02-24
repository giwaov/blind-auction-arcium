"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  txHash?: string;
}

const quickPrompts = [
  "What are the latest ETH and SUI predictions?",
  "Assess the risk of Aave on Ethereum",
  "Analyze a basic ERC20 for vulnerabilities",
  "What DeFi protocols have the lowest risk right now?",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          tools: data.tools_used,
          txHash: data.x402_tx_hash,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

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
            AI Chat Agent
          </h2>
          <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
            Powered by OpenGradient TEE-secured inference
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs"
          style={{
            background: "var(--og-teal)",
            color: "var(--og-cyan)",
          }}
        >
          x402 Payments Active
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ background: "var(--og-deep)" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--og-cyan)" }}
              >
                OG DeFi Sentinel
              </h3>
              <p style={{ color: "var(--og-text-dim)" }}>
                Ask me anything about DeFi security, market predictions, or risk
                analysis
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="p-3 rounded-lg text-sm text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: "var(--og-surface)",
                    border: "1px solid var(--og-border)",
                    color: "var(--og-text-dim)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] rounded-xl px-4 py-3"
              style={{
                background:
                  msg.role === "user" ? "var(--og-teal)" : "var(--og-surface)",
                border: `1px solid ${
                  msg.role === "user" ? "var(--og-cyan)" : "var(--og-border)"
                }`,
              }}
            >
              <div
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--og-text)" }}
              >
                {msg.content}
              </div>
              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.tools.map((tool, j) => {
                    const name = tool.match(/\[([^\]]+)\]/)?.[1] ?? "tool";
                    return (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--og-teal-dark)",
                          color: "var(--og-accent)",
                        }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              )}
              {msg.txHash && (
                <div className="mt-1">
                  <span
                    className="text-xs"
                    style={{ color: "var(--og-text-dim)" }}
                  >
                    x402 tx: {msg.txHash.slice(0, 10)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-xl px-4 py-3 flex gap-1"
              style={{ background: "var(--og-surface)" }}
            >
              <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--og-cyan)" }} />
              <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--og-cyan)" }} />
              <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--og-cyan)" }} />
            </div>
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-lg text-sm"
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

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{
          background: "var(--og-surface)",
          borderColor: "var(--og-border)",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about DeFi security, predictions, or risk..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none placeholder:opacity-50"
            style={{
              background: "var(--og-deep)",
              border: "1px solid var(--og-border)",
              color: "var(--og-text)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--og-teal), var(--og-cyan))",
              color: "var(--og-deep)",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
