/**
 * DEVIL Orchestrator - Multi-Agent Dashboard
 */

import React, { useState, useEffect } from "react";

interface Agent {
  id: string;
  type: string;
  name: string;
  state: string;
  health: number;
  load: number;
  queueDepth: number;
}

interface Mission {
  id: string;
  goal: string;
  mode: string;
  state: string;
  tasks: Task[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface Task {
  id: string;
  name: string;
  type: string;
  state: string;
  assignedAgent?: string;
  priority: number;
}

interface Stats {
  agents: { total: number; online: number; busy: number; failed: number };
  missions: { total: number; pending: number; executing: number; completed: number; failed: number; paused: number };
  tasks: { total: number; queued: number; running: number; completed: number; failed: number };
  mode: string;
}

const stateColors: Record<string, string> = {
  ONLINE: "bg-green-500",
  BUSY: "bg-yellow-500",
  OFFLINE: "bg-gray-500",
  FAILED: "bg-red-500",
  RECOVERING: "bg-orange-500",
};

const taskStateColors: Record<string, string> = {
  QUEUED: "bg-gray-500",
  ASSIGNED: "bg-blue-500",
  RUNNING: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  PAUSED: "bg-orange-500",
};

const missionStateColors: Record<string, string> = {
  PENDING: "bg-gray-500",
  PLANNING: "bg-blue-500",
  ASSIGNING: "bg-purple-500",
  EXECUTING: "bg-yellow-500",
  PAUSED: "bg-orange-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-gray-700",
};

const agentTypeIcons: Record<string, string> = {
  architect: "🏛️",
  executor: "⚡",
  coding: "💻",
  github: "📦",
  deployment: "🚀",
  image_studio: "🎨",
  video_studio: "🎬",
};

export default function OrchestratorDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mode, setMode] = useState<string>("DEVIL");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "missions" | "events">("overview");

  // Load data
  const loadData = async () => {
    try {
      const [agentsRes, missionsRes, statsRes, modeRes] = await Promise.all([
        fetch("/api/orchestrator/agents"),
        fetch("/api/orchestrator/missions"),
        fetch("/api/orchestrator/stats"),
        fetch("/api/orchestrator/mode"),
      ]);
      
      const agentsData = await agentsRes.json();
      const missionsData = await missionsRes.json();
      const statsData = await statsRes.json();
      const modeData = await modeRes.json();
      
      setAgents(agentsData.agents || []);
      setMissions(missionsData.missions || []);
      setStats(statsData);
      setMode(modeData.mode);
    } catch (err) {
      console.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Start mission
  const handleStartMission = async () => {
    if (!goal.trim()) return;
    
    setLoading(true);
    try {
      await fetch("/api/orchestrator/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, mode }),
      });
      setGoal("");
      loadData();
    } catch (err) {
      console.error("Failed to start mission");
    }
    setLoading(false);
  };

  // Control mission
  const handleMissionAction = async (action: string, missionId: string) => {
    try {
      await fetch(`/api/orchestrator/${action}/${missionId}`, { method: "POST" });
      loadData();
    } catch (err) {
      console.error(`Failed to ${action} mission`);
    }
  };

  // Toggle mode
  const handleModeToggle = async () => {
    const newMode = mode === "DEVIL" ? "GOD" : "DEVIL";
    try {
      await fetch("/api/orchestrator/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      setMode(newMode);
    } catch (err) {
      console.error("Failed to change mode");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🎭 DEVIL Orchestrator</h1>
              <p className="text-gray-400 text-sm">Multi-Agent Coordination System</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                Mode: <span className={mode === "DEVIL" ? "text-red-400" : "text-blue-400"}>{mode}</span>
              </span>
              <button
                onClick={handleModeToggle}
                className={`px-4 py-2 rounded font-bold ${
                  mode === "DEVIL" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {mode === "DEVIL" ? "😈 DEVIL MODE" : "👼 GOD MODE"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Agents</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.agents.total}</span>
                <span className="text-green-400 text-sm">{stats.agents.online} online</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Missions</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.missions.total}</span>
                <span className="text-yellow-400 text-sm">{stats.missions.executing} active</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Tasks</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.tasks.total}</span>
                <span className="text-blue-400 text-sm">{stats.tasks.running} running</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Success Rate</p>
              <span className="text-2xl font-bold text-green-400">
                {stats.tasks.total > 0 
                  ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {(["overview", "agents", "missions", "events"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t ${
                activeTab === tab ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Start Mission */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🚀 Start New Mission</h3>
              <div className="space-y-4">
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do you want to accomplish?"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 h-24 resize-none"
                />
                <button
                  onClick={handleStartMission}
                  disabled={loading || !goal.trim()}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded"
                >
                  {loading ? "Starting..." : mode === "DEVIL" ? "😈 Execute (DEVIL Mode)" : "👼 Execute (GOD Mode)"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                {mode === "DEVIL" 
                  ? "DEVIL Mode: Fast execution, parallel workflows, minimal approvals"
                  : "GOD Mode: Strategic, conservative, validation-heavy, approval-required"}
              </p>
            </div>

            {/* Agent Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">👥 Active Agents</h3>
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{agentTypeIcons[agent.type] || "🤖"}</span>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-400">{agent.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Load: {agent.load}%</p>
                        <div className="w-16 h-1.5 bg-gray-600 rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${agent.load}%` }}
                          />
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${stateColors[agent.state]}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agentTypeIcons[agent.type] || "🤖"}</span>
                    <div>
                      <p className="font-bold">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.type}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${stateColors[agent.state]}`}>
                    {agent.state}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Health</span>
                      <span>{agent.health}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full">
                      <div 
                        className={`h-full rounded-full ${agent.health > 50 ? "bg-green-500" : agent.health > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${agent.health}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Load</span>
                      <span>{agent.load}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${agent.load}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Queue Depth</span>
                    <span className="text-white">{agent.queueDepth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "missions" && (
          <div className="space-y-4">
            {missions.map((mission) => (
              <div 
                key={mission.id} 
                className={`bg-gray-800 rounded-lg p-6 border cursor-pointer ${
                  selectedMission?.id === mission.id ? "border-red-500" : "border-gray-700"
                }`}
                onClick={() => setSelectedMission(mission)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold">{mission.goal}</p>
                    <p className="text-xs text-gray-400">
                      ID: {mission.id} • Mode: {mission.mode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm ${missionStateColors[mission.state]}`}>
                      {mission.state}
                    </span>
                    {mission.state === "EXECUTING" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMissionAction("pause", mission.id); }}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
                      >
                        ⏸️ Pause
                      </button>
                    )}
                    {mission.state === "PAUSED" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMissionAction("resume", mission.id); }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        ▶️ Resume
                      </button>
                    )}
                    {(mission.state === "EXECUTING" || mission.state === "PAUSED") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMissionAction("cancel", mission.id); }}
                        className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm"
                      >
                        ⏹️ Cancel
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Tasks Progress */}
                <div className="space-y-2">
                  {mission.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${taskStateColors[task.state]}`} />
                        <span className="text-sm">{task.name}</span>
                        <span className="text-xs text-gray-400">{agentTypeIcons[task.type]}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {task.assignedAgent ? "→ " + task.assignedAgent.split("-")[1] : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {missions.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No missions yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">📋 Live Events</h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {[
                { time: new Date().toLocaleTimeString(), event: "System initialized", type: "info" },
                { time: new Date().toLocaleTimeString(), event: "Agents registered", type: "success" },
                { time: new Date().toLocaleTimeString(), event: "Orchestrator ready", type: "success" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">{item.time}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    item.type === "success" ? "bg-green-500" : 
                    item.type === "error" ? "bg-red-500" : "bg-blue-500"
                  }`} />
                  <span>{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
