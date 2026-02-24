"use client";

import type { Tab } from "../page";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "predictions", label: "Predictions", icon: "📊" },
  { id: "audit", label: "Audit", icon: "🔍" },
  { id: "risk", label: "Risk", icon: "⚠️" },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-16"
      } transition-all duration-300 flex flex-col border-r`}
      style={{
        background: "var(--og-surface)",
        borderColor: "var(--og-border)",
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--og-border)" }}>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: "var(--og-teal)" }}
        >
          <span className="text-sm">{isOpen ? "◀" : "▶"}</span>
        </button>
        {isOpen && (
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: "var(--og-cyan)" }}
            >
              OG DeFi Sentinel
            </h1>
            <p className="text-xs" style={{ color: "var(--og-text-dim)" }}>
              TEE-Verified AI Agent
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
              activeTab === item.id ? "pulse-glow" : "hover:opacity-80"
            }`}
            style={{
              background:
                activeTab === item.id ? "var(--og-teal)" : "transparent",
              color:
                activeTab === item.id ? "var(--og-cyan)" : "var(--og-text-dim)",
            }}
          >
            <span className="text-lg">{item.icon}</span>
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* TEE Status */}
      <div className="p-4 border-t" style={{ borderColor: "var(--og-border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--og-accent)" }}
          />
          {isOpen && (
            <span className="text-xs" style={{ color: "var(--og-text-dim)" }}>
              TEE Verified • Chain 10744
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
