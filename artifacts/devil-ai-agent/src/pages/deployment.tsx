/**
 * DEVIL Deployment Agent - Deployment Dashboard
 */

import React, { useState, useEffect } from "react";

interface Deployment {
  id: string;
  name: string;
  provider: string;
  state: string;
  health: string;
  environment: string;
  version: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeploymentEvent {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface HealthCheck {
  id: string;
  status: string;
  responseTime?: number;
  checkedAt: string;
}

const stateColors: Record<string, string> = {
  NOT_DEPLOYED: "bg-gray-500",
  PREPARING: "bg-blue-500",
  VALIDATING: "bg-purple-500",
  BUILDING: "bg-blue-600",
  PACKAGING: "bg-yellow-500",
  READY: "bg-green-500",
  AWAITING_APPROVAL: "bg-orange-500",
  DEPLOYING: "bg-blue-500 animate-pulse",
  VERIFYING: "bg-purple-500",
  HEALTH_CHECKING: "bg-purple-500 animate-pulse",
  ACTIVE: "bg-green-600",
  ROLLING_BACK: "bg-red-500 animate-pulse",
  ROLLED_BACK: "bg-yellow-600",
  FAILED: "bg-red-600",
  CANCELLED: "bg-gray-600",
};

const healthColors: Record<string, string> = {
  HEALTHY: "text-green-400",
  DEGRADED: "text-yellow-400",
  UNHEALTHY: "text-red-400",
  UNKNOWN: "text-gray-400",
};

const providers = [
  { id: "local", name: "Local", requiresApproval: false },
  { id: "docker", name: "Docker", requiresApproval: false },
  { id: "vercel", name: "Vercel", requiresApproval: true },
  { id: "railway", name: "Railway", requiresApproval: true },
];

export default function DeploymentDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [events, setEvents] = useState<DeploymentEvent[]>([]);
  const [healthHistory, setHealthHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "details">("list");

  // Form state
  const [newDeployment, setNewDeployment] = useState({
    workspaceId: "",
    name: "",
    provider: "local",
    projectType: "react",
    environment: "development" as const,
  });

  // Load deployments
  const loadDeployments = async () => {
    try {
      const response = await fetch("/api/deployments");
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (err) {
      console.error("Failed to load deployments");
    }
  };

  // Load deployment details
  const loadDeploymentDetails = async (deployment: Deployment) => {
    try {
      const [eventsRes, healthRes] = await Promise.all([
        fetch(`/api/deployments/${deployment.id}/events`),
        fetch(`/api/deployments/${deployment.id}/health`),
      ]);

      const eventsData = await eventsRes.json();
      const healthData = await healthRes.json();

      setEvents(eventsData.events || []);
      setHealthHistory(healthData.checks || [healthData]);
    } catch (err) {
      console.error("Failed to load deployment details");
    }
  };

  // Create deployment
  const handleCreate = async () => {
    if (!newDeployment.workspaceId || !newDeployment.name) {
      setError("Workspace ID and Name are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeployment),
      });

      if (!response.ok) {
        throw new Error("Failed to create deployment");
      }

      const deployment = await response.json();
      setDeployments((prev) => [...prev, deployment]);
      setActiveTab("list");
      setNewDeployment({
        workspaceId: "",
        name: "",
        provider: "local",
        projectType: "react",
        environment: "development",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deployment");
    }

    setLoading(false);
  };

  // Deploy
  const handleDeploy = async (deployment: Deployment) => {
    setLoading(true);
    try {
      await fetch(`/api/deployments/${deployment.id}/start`, {
        method: "POST",
      });
      await loadDeployments();
    } catch (err) {
      setError("Failed to start deployment");
    }
    setLoading(false);
  };

  // Approve
  const handleApprove = async (deployment: Deployment) => {
    try {
      await fetch(`/api/deployments/${deployment.id}/approve`, {
        method: "POST",
      });
      await loadDeployments();
      if (selectedDeployment?.id === deployment.id) {
        loadDeploymentDetails(deployment);
      }
    } catch (err) {
      setError("Failed to approve deployment");
    }
  };

  // Reject
  const handleReject = async (deployment: Deployment) => {
    try {
      await fetch(`/api/deployments/${deployment.id}/reject`, {
        method: "POST",
      });
      await loadDeployments();
    } catch (err) {
      setError("Failed to reject deployment");
    }
  };

  // Cancel
  const handleCancel = async (deployment: Deployment) => {
    try {
      await fetch(`/api/deployments/${deployment.id}/cancel`, {
        method: "POST",
      });
      await loadDeployments();
    } catch (err) {
      setError("Failed to cancel deployment");
    }
  };

  // Rollback
  const handleRollback = async (deployment: Deployment) => {
    if (!confirm("Are you sure you want to rollback?")) return;

    try {
      await fetch(`/api/deployments/${deployment.id}/rollback`, {
        method: "POST",
      });
      await loadDeployments();
    } catch (err) {
      setError("Failed to rollback deployment");
    }
  };

  // Delete
  const handleDelete = async (deployment: Deployment) => {
    if (!confirm("Are you sure you want to delete this deployment?")) return;

    try {
      await fetch(`/api/deployments/${deployment.id}`, {
        method: "DELETE",
      });
      setDeployments((prev) => prev.filter((d) => d.id !== deployment.id));
      if (selectedDeployment?.id === deployment.id) {
        setSelectedDeployment(null);
      }
    } catch (err) {
      setError("Failed to delete deployment");
    }
  };

  // Select deployment
  const handleSelect = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    loadDeploymentDetails(deployment);
    setActiveTab("details");
  };

  // Initial load
  useEffect(() => {
    loadDeployments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🚀 DEVIL Deployment Agent</h1>
              <p className="text-gray-400 text-sm">Safe deployment with rollback support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "list" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            📦 Deployments ({deployments.length})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "create" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            ➕ New Deployment
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-sm text-red-300 hover:text-red-100 mt-2">
              Dismiss
            </button>
          </div>
        )}

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {deployments.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg">No deployments yet</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  Create your first deployment
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {deployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    onClick={() => handleSelect(deployment)}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{deployment.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {deployment.provider} • {deployment.environment} • {deployment.version}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${stateColors[deployment.state] || "bg-gray-500"}`}>
                          {deployment.state.replace("_", " ")}
                        </span>
                        <span className={`font-bold ${healthColors[deployment.health] || "text-gray-400"}`}>
                          {deployment.health}
                        </span>
                      </div>
                    </div>
                    {deployment.url && (
                      <p className="text-blue-400 text-sm mt-2">{deployment.url}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Create New Deployment</h2>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Workspace ID</label>
                <input
                  type="text"
                  value={newDeployment.workspaceId}
                  onChange={(e) => setNewDeployment({ ...newDeployment, workspaceId: e.target.value })}
                  placeholder="ws-xxx"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Deployment Name</label>
                <input
                  type="text"
                  value={newDeployment.name}
                  onChange={(e) => setNewDeployment({ ...newDeployment, name: e.target.value })}
                  placeholder="my-app"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Provider</label>
                  <select
                    value={newDeployment.provider}
                    onChange={(e) => setNewDeployment({ ...newDeployment, provider: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.requiresApproval ? "(Approval Required)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Project Type</label>
                  <select
                    value={newDeployment.projectType}
                    onChange={(e) => setNewDeployment({ ...newDeployment, projectType: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  >
                    <option value="react">React</option>
                    <option value="nextjs">Next.js</option>
                    <option value="node">Node.js</option>
                    <option value="express">Express</option>
                    <option value="fastapi">FastAPI</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Environment</label>
                <select
                  value={newDeployment.environment}
                  onChange={(e) =>
                    setNewDeployment({
                      ...newDeployment,
                      environment: e.target.value as "development" | "staging" | "production",
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production (Approval Required)</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !newDeployment.workspaceId || !newDeployment.name}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded font-bold"
              >
                {loading ? "Creating..." : "Create Deployment"}
              </button>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && selectedDeployment && (
          <div className="space-y-6">
            {/* Deployment Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedDeployment.name}</h2>
                  <p className="text-gray-400">
                    {selectedDeployment.provider} • {selectedDeployment.environment} • {selectedDeployment.version}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded font-bold ${stateColors[selectedDeployment.state] || "bg-gray-500"}`}>
                    {selectedDeployment.state.replace("_", " ")}
                  </span>
                  <span className={`text-2xl font-bold ${healthColors[selectedDeployment.health] || "text-gray-400"}`}>
                    {selectedDeployment.health === "HEALTHY" ? "✓" : selectedDeployment.health === "UNHEALTHY" ? "✗" : "?"}
                  </span>
                </div>
              </div>

              {selectedDeployment.url && (
                <div className="mb-4">
                  <span className="text-gray-400 text-sm">URL:</span>
                  <a href={selectedDeployment.url} className="text-blue-400 ml-2">
                    {selectedDeployment.url}
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedDeployment.state === "READY" && (
                  <button
                    onClick={() => handleDeploy(selectedDeployment)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
                  >
                    🚀 Deploy
                  </button>
                )}
                {selectedDeployment.state === "AWAITING_APPROVAL" && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedDeployment)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedDeployment)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                {["DEPLOYING", "VALIDATING", "BUILDING"].includes(selectedDeployment.state) && (
                  <button
                    onClick={() => handleCancel(selectedDeployment)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
                  >
                    ⏹ Cancel
                  </button>
                )}
                {selectedDeployment.state === "ACTIVE" && (
                  <button
                    onClick={() => handleRollback(selectedDeployment)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
                  >
                    ↩ Rollback
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedDeployment)}
                  className="px-4 py-2 bg-red-900/50 hover:bg-red-900 rounded"
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Health History */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Health History</h3>
              <div className="space-y-2">
                {healthHistory.slice(0, 10).map((check) => (
                  <div key={check.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                    <span className={healthColors[check.status] || "text-gray-400"}>
                      {check.status === "HEALTHY" ? "✓" : "✗"} {check.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {check.responseTime ? `${check.responseTime}ms` : ""} •{" "}
                      {new Date(check.checkedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
                {healthHistory.length === 0 && (
                  <p className="text-gray-400">No health checks yet</p>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Deployment Events</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.slice().reverse().map((event) => (
                  <div key={event.id} className="bg-gray-700 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        event.severity === "error" || event.severity === "critical"
                          ? "text-red-400"
                          : event.severity === "warning"
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}>
                        {event.message}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-gray-400">No events yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
