/**
 * DEVIL Executor Foundation - Executor Dashboard
 * 
 * Real-time mission execution monitoring and control panel.
 */

import React, { useState, useEffect, useCallback } from "react";

// Types
interface ExecutorStatus {
  id: string;
  missionId: string;
  state: string;
  mode: string;
  progress: number;
  currentPhase: string | null;
  currentTask: string | null;
  queueStats: {
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  };
  sandbox: {
    active: boolean;
    sessionId: string | null;
  };
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

interface ExecutorEvent {
  id: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  taskId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

interface QueueSummary {
  missionId: string;
  totalTasks: number;
  pendingTasks: number;
  executingTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  progress: number;
}

// State colors
const STATE_COLORS: Record<string, string> = {
  idle: "bg-gray-500",
  queued: "bg-yellow-500",
  preparing: "bg-blue-500",
  validating: "bg-purple-500",
  running: "bg-green-500 animate-pulse",
  paused: "bg-orange-500",
  awaiting_approval: "bg-yellow-600",
  recovering: "bg-red-400",
  failed: "bg-red-600",
  completed: "bg-green-600",
  cancelled: "bg-gray-600",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "text-blue-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  critical: "text-red-600 font-bold",
};

export default function ExecutorDashboard() {
  const [missionId, setMissionId] = useState("");
  const [status, setStatus] = useState<ExecutorStatus | null>(null);
  const [queue, setQueue] = useState<QueueSummary | null>(null);
  const [events, setEvents] = useState<ExecutorEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto_pilot" | "step_by_step" | "dry_run">("auto_pilot");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch executor status
  const fetchStatus = useCallback(async () => {
    if (!missionId) return;
    
    try {
      const response = await fetch(`/api/executor/mission/${missionId}/full`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.executor);
        setQueue(data.queue);
        setError(null);
      } else if (response.status === 404) {
        setStatus(null);
        setQueue(null);
      }
    } catch (err) {
      setError("Failed to fetch status");
    }
  }, [missionId]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!missionId) return;
    
    try {
      const response = await fetch(`/api/executor/mission/${missionId}/events?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch events");
    }
  }, [missionId]);

  // Start executor
  const startExecutor = async () => {
    if (!missionId) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/executor/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId, mode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        await fetchEvents();
      } else {
        const err = await response.json();
        setError(err.error);
      }
    } catch (err) {
      setError("Failed to start executor");
    }
    setLoading(false);
  };

  // Pause executor
  const pauseExecutor = async () => {
    if (!status?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/executor/${status.id}/pause`, {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      setError("Failed to pause executor");
    }
    setLoading(false);
  };

  // Resume executor
  const resumeExecutor = async () => {
    if (!status?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/executor/${status.id}/resume`, {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      setError("Failed to resume executor");
    }
    setLoading(false);
  };

  // Cancel executor
  const cancelExecutor = async () => {
    if (!status?.id) return;
    
    if (!confirm("Are you sure you want to cancel this execution?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/executor/${status.id}/cancel`, {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      setError("Failed to cancel executor");
    }
    setLoading(false);
  };

  // Run dry run
  const runDryRun = async () => {
    if (!missionId) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/executor/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Dry Run Complete!\nTasks: ${data.plan?.phases?.reduce((acc: number, p: any) => acc + p.tasks.length, 0) || 0}\nFiles: ${data.plan?.totalFiles?.length || 0}\nCommands: ${data.plan?.totalCommands?.length || 0}`);
      } else {
        const err = await response.json();
        setError(err.error);
      }
    } catch (err) {
      setError("Failed to run dry run");
    }
    setLoading(false);
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !status) return;
    
    const interval = setInterval(() => {
      fetchStatus();
      fetchEvents();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, status, fetchStatus, fetchEvents]);

  // Format timestamp
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-500">🔥 DEVIL Executor</h1>
            <p className="text-gray-400">Mission Execution Control Center</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-400">Auto-refresh</span>
            </label>
          </div>
        </div>

        {/* Mission Selector */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Mission ID</label>
              <input
                type="text"
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                placeholder="Enter mission ID"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
              >
                <option value="auto_pilot">🚀 Auto Pilot</option>
                <option value="step_by_step">👣 Step by Step</option>
                <option value="dry_run">🔍 Dry Run</option>
              </select>
            </div>
            <button
              onClick={startExecutor}
              disabled={!missionId || loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded font-bold"
            >
              {loading ? "Starting..." : "▶ Start"}
            </button>
            <button
              onClick={runDryRun}
              disabled={!missionId || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded"
            >
              🔍 Dry Run
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-300 hover:text-red-100 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status Panel */}
        {status && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Status */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Execution Status</h2>
                <span className={`px-3 py-1 rounded text-sm font-bold ${STATE_COLORS[status.state] || "bg-gray-500"}`}>
                  {status.state.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm">Mission ID</p>
                  <p className="font-mono text-sm">{status.missionId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mode</p>
                  <p className="font-bold text-lg">{status.mode.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Current Phase</p>
                  <p className="font-mono text-sm">{status.currentPhase || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Current Task</p>
                  <p className="font-mono text-sm truncate">{status.currentTask || "-"}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Started</p>
                  <p>{formatTime(status.startedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Paused</p>
                  <p>{formatTime(status.pausedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Completed</p>
                  <p>{formatTime(status.completedAt)}</p>
                </div>
              </div>

              {/* Error */}
              {status.error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded">
                  <p className="text-red-400 text-sm">Error: {status.error}</p>
                </div>
              )}
            </div>

            {/* Queue Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Queue Statistics</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Tasks</span>
                  <span className="font-bold">{status.queueStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pending</span>
                  <span className="text-yellow-400 font-bold">{status.queueStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Executing</span>
                  <span className="text-green-400 font-bold animate-pulse">{status.queueStats.executing}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-500 font-bold">{status.queueStats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Failed</span>
                  <span className="text-red-400 font-bold">{status.queueStats.failed}</span>
                </div>
              </div>

              {/* Sandbox Status */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-bold mb-2">Sandbox</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${status.sandbox.active ? "bg-green-500" : "bg-gray-500"}`} />
                  <span className="text-sm">{status.sandbox.active ? "Active" : "Inactive"}</span>
                </div>
                {status.sandbox.sessionId && (
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    {status.sandbox.sessionId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        {status && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex gap-4 justify-center">
              {status.state === "running" && (
                <button
                  onClick={pauseExecutor}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-8 py-3 rounded font-bold text-lg"
                >
                  ⏸ Pause
                </button>
              )}
              {status.state === "paused" && (
                <button
                  onClick={resumeExecutor}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-8 py-3 rounded font-bold text-lg"
                >
                  ▶ Resume
                </button>
              )}
              {["running", "paused", "queued", "preparing", "validating"].includes(status.state) && (
                <button
                  onClick={cancelExecutor}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-8 py-3 rounded font-bold text-lg"
                >
                  ⏹ Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Event Stream */}
        {status && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📜 Event Stream</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {events.length === 0 ? (
                <p className="text-gray-500">No events yet</p>
              ) : (
                events.slice().reverse().map((event, i) => (
                  <div key={event.id || i} className="py-1 border-b border-gray-800">
                    <span className="text-gray-500">[{formatTime(event.timestamp)}]</span>{" "}
                    <span className={SEVERITY_COLORS[event.severity]}>[{event.severity.toUpperCase()}]</span>{" "}
                    <span className="text-white">{event.message}</span>
                    {event.taskId && (
                      <span className="text-gray-400"> (task: {event.taskId})</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!status && !error && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-xl mb-4">Enter a Mission ID to start monitoring</p>
            <p className="text-gray-500">Or start a new execution above</p>
          </div>
        )}
      </div>
    </div>
  );
}
