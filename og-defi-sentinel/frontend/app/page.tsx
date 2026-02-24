"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import PredictionsPanel from "./components/PredictionsPanel";
import AuditPanel from "./components/AuditPanel";
import RiskPanel from "./components/RiskPanel";

export type Tab = "chat" | "predictions" | "audit" | "risk";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" && <ChatPanel />}
        {activeTab === "predictions" && <PredictionsPanel />}
        {activeTab === "audit" && <AuditPanel />}
        {activeTab === "risk" && <RiskPanel />}
      </main>
    </div>
  );
}
