/**
 * DEVIL Coding Agent - Coding Dashboard
 * 
 * Main dashboard for project generation and management.
 */

import React, { useState, useCallback } from "react";

interface Workspace {
  id: string;
  missionId: string | null;
  projectType: string;
  status: string;
  rootPath: string;
  createdAt: string;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: "react", name: "⚛️ React App", description: "Modern React app with Vite and TypeScript", projectType: "react" },
  { id: "nextjs", name: "▲ Next.js App", description: "Next.js 14 with App Router", projectType: "nextjs" },
  { id: "express", name: "🛠️ Express API", description: "RESTful API with Express and TypeScript", projectType: "express" },
  { id: "fastapi", name: "🐍 FastAPI", description: "Python API with FastAPI", projectType: "fastapi" },
  { id: "node", name: "📦 Node Service", description: "Minimal Node.js service", projectType: "node_service" },
];

export default function CodingDashboard() {
  const [goal, setGoal] = useState("");
  const [projectType, setProjectType] = useState("react");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [missionResult, setMissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "workspaces" | "results">("create");

  // Create new project
  const handleCreate = async () => {
    if (!goal.trim()) {
      setError("Please enter a project description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create workspace
      const wsResponse = await fetch("/api/coding/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectType, name: goal.substring(0, 30).replace(/\s+/g, "-") }),
      });
      
      if (!wsResponse.ok) {
        throw new Error("Failed to create workspace");
      }

      const workspace = await wsResponse.json();
      setWorkspaces((prev) => [...prev, workspace]);
      setSelectedWorkspace(workspace);

      // Step 2: Generate project
      const genResponse = await fetch("/api/coding/codegen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          projectName: goal.substring(0, 30).replace(/\s+/g, "-"),
          projectType,
          options: { tests: true, documentation: true },
        }),
      });

      if (!genResponse.ok) {
        throw new Error("Failed to generate project");
      }

      const generation = await genResponse.json();

      // Step 3: Run build
      const buildResponse = await fetch(`/api/coding/build/${workspace.id}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "npm install && npm run build" }),
      });

      const build = await buildResponse.json();

      // Step 4: Run tests
      const testResponse = await fetch(`/api/coding/build/${workspace.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const tests = await testResponse.json();

      // Step 5: Review
      const reviewResponse = await fetch(`/api/coding/review/${workspace.id}/review`, {
        method: "POST",
      });

      const review = await reviewResponse.json();

      // Set result
      setMissionResult({
        workspace,
        generation,
        build,
        tests,
        review,
        success: build.success,
      });

      setActiveTab("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }

    setLoading(false);
  };

  // Load workspaces
  const loadWorkspaces = async () => {
    try {
      const response = await fetch("/api/coding/workspace");
      const data = await response.json();
      setWorkspaces(data.workspaces);
    } catch (err) {
      console.error("Failed to load workspaces");
    }
  };

  // Delete workspace
  const deleteWorkspace = async (id: string) => {
    if (!confirm("Delete this workspace?")) return;

    try {
      await fetch(`/api/coding/workspace/${id}`, { method: "DELETE" });
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to delete workspace");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🔥 DEVIL Coding Agent</h1>
              <p className="text-gray-400 text-sm">AI-powered project generation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "create"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ✨ Create Project
          </button>
          <button
            onClick={() => {
              setActiveTab("workspaces");
              loadWorkspaces();
            }}
            className={`px-4 py-2 rounded-t ${
              activeTab === "workspaces"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📁 Workspaces
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "results" && missionResult
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            disabled={!missionResult}
          >
            📊 Results
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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

        {/* Create Tab */}
        {activeTab === "create" && (
          <div className="space-y-6">
            {/* Goal Input */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">What do you want to build?</h2>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Build a React dashboard with user authentication and charts"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white h-24 resize-none"
              />
            </div>

            {/* Template Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Select Template</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROJECT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setProjectType(template.projectType)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      projectType === template.projectType
                        ? "border-red-500 bg-gray-700"
                        : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    }`}
                  >
                    <h3 className="font-bold text-lg">{template.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading || !goal.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span> Generating...
                </span>
              ) : (
                "🚀 Generate Project"
              )}
            </button>

            {/* Loading Progress */}
            {loading && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-4">Creating your project...</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">✓</span>
                    <span>Creating workspace</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-yellow-600 animate-pulse">⚡</span>
                    <span>Generating code...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">🔨</span>
                    <span className="text-gray-400">Building project</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">🧪</span>
                    <span className="text-gray-400">Running tests</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">🔍</span>
                    <span className="text-gray-400">Reviewing code</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workspaces Tab */}
        {activeTab === "workspaces" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Workspaces</h2>
              <button
                onClick={loadWorkspaces}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                🔄 Refresh
              </button>
            </div>

            {workspaces.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg">No workspaces yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first project to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{ws.rootPath.split("/").pop()}</h3>
                        <p className="text-gray-400 text-sm">{ws.projectType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm ${
                        ws.status === "ready" ? "bg-green-600" : "bg-yellow-600"
                      }`}>
                        {ws.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setSelectedWorkspace(ws)}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                      >
                        View Files
                      </button>
                      <button
                        onClick={() => deleteWorkspace(ws.id)}
                        className="px-3 py-2 bg-red-900/50 hover:bg-red-900 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Workspace Files */}
            {selectedWorkspace && (
              <div className="bg-gray-800 rounded-lg p-6 mt-6">
                <h3 className="font-bold mb-4">Files in {selectedWorkspace.rootPath.split("/").pop()}</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                  <p className="text-gray-500 text-sm">File listing would appear here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && missionResult && (
          <div className="space-y-6">
            {/* Success/Error Banner */}
            <div className={`rounded-lg p-6 ${missionResult.success ? "bg-green-900/50" : "bg-red-900/50"}`}>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{missionResult.success ? "✅" : "❌"}</span>
                <div>
                  <h2 className="text-2xl font-bold">
                    {missionResult.success ? "Project Created Successfully!" : "Build Failed"}
                  </h2>
                  <p className="text-gray-400">
                    {missionResult.success
                      ? `${missionResult.generation?.filesGenerated || 0} files generated`
                      : "Check the errors below"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Files</p>
                <p className="text-2xl font-bold">{missionResult.generation?.filesGenerated || 0}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Tests</p>
                <p className="text-2xl font-bold text-green-400">
                  {missionResult.tests?.testsPassed || 0}
                  <span className="text-sm text-gray-400">
                    /{missionResult.tests?.testsPassed + missionResult.tests?.testsFailed || 0}
                  </span>
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Code Score</p>
                <p className={`text-2xl font-bold ${
                  (missionResult.review?.overallScore || 0) >= 80 ? "text-green-400" :
                  (missionResult.review?.overallScore || 0) >= 60 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {missionResult.review?.overallScore || 0}%
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Issues</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {missionResult.review?.issues?.length || 0}
                </p>
              </div>
            </div>

            {/* Build Output */}
            {missionResult.build && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-4">🔨 Build Output</h3>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm overflow-auto max-h-48 text-gray-300">
                  {missionResult.build.output || "No output"}
                </pre>
              </div>
            )}

            {/* Code Issues */}
            {missionResult.review?.issues?.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-4">🔍 Code Issues ({missionResult.review.issues.length})</h3>
                <div className="space-y-2">
                  {missionResult.review.issues.slice(0, 10).map((issue: any, i: number) => (
                    <div key={i} className="bg-gray-900 rounded-lg p-3 flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        issue.severity === "critical" ? "bg-red-600" :
                        issue.severity === "error" ? "bg-red-500" :
                        issue.severity === "warning" ? "bg-yellow-600" : "bg-blue-600"
                      }`}>
                        {issue.severity}
                      </span>
                      <div>
                        <p className="text-sm">{issue.message}</p>
                        <p className="text-gray-500 text-xs">{issue.file}</p>
                      </div>
                    </div>
                  ))}
                  {missionResult.review.issues.length > 10 && (
                    <p className="text-gray-400 text-sm">
                      +{missionResult.review.issues.length - 10} more issues
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("workspaces")}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
              >
                📁 View Workspace
              </button>
              <button
                onClick={() => {
                  setGoal("");
                  setMissionResult(null);
                  setActiveTab("create");
                }}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
              >
                ✨ Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
