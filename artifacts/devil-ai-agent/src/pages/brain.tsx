/**
 * DEVIL Brain - Central Intelligence Dashboard
 */

import React, { useState, useEffect } from "react";

interface MissionAnalysis {
  id: string;
  goal: string;
  domain: string;
  complexity: string;
  urgency: string;
  risk: string;
  requiredAgents: string[];
  estimatedDuration: number;
  recommendedMode: string;
}

interface ReasoningStep {
  id: string;
  type: string;
  input: string;
  reasoning: string;
  output: string;
  confidence: number;
}

interface WorkflowStep {
  order: number;
  agent: string;
  task: string;
  estimatedDuration: number;
  parallel: boolean;
}

interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
  reasoning: boolean;
}

const domainIcons: Record<string, string> = {
  architecture: "🏗️",
  coding: "💻",
  deployment: "🚀",
  design: "🎨",
  image: "🖼️",
  video: "🎬",
  analysis: "🔍",
  planning: "📋",
  reasoning: "🧠",
};

const agentIcons: Record<string, string> = {
  architect: "🏗️",
  coding: "💻",
  github: "🐙",
  deployment: "🚀",
  memory: "🧠",
  image: "🖼️",
  video: "🎬",
  orchestrator: "🎭",
};

const complexityColors: Record<string, string> = {
  trivial: "text-green-400",
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
};

const modeColors: Record<string, string> = {
  god: "bg-purple-600",
  devil: "bg-red-600",
};

export default function BrainDashboard() {
  const [goal, setGoal] = useState("");
  const [analysis, setAnalysis] = useState<MissionAnalysis | null>(null);
  const [reasoning, setReasoning] = useState<{ steps: ReasoningStep[]; confidence: number } | null>(null);
  const [workflow, setWorkflow] = useState<{ steps: WorkflowStep[]; recommendedMode: string } | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [mode, setMode] = useState<{ mode: string; validation: string; reasoning: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyze" | "models" | "mode">("analyze");

  useEffect(() => {
    loadModels();
    loadMode();
  }, []);

  const loadModels = async () => {
    try {
      const res = await fetch("/api/brain/models");
      const data = await res.json();
      setModels(data.models || []);
    } catch (err) {
      console.error("Failed to load models");
    }
  };

  const loadMode = async () => {
    try {
      const res = await fetch("/api/brain/mode");
      const data = await res.json();
      setMode(data);
    } catch (err) {
      console.error("Failed to load mode");
    }
  };

  const analyzeMission = async () => {
    if (!goal.trim()) return;
    setLoading(true);

    try {
      // Analyze
      const res = await fetch("/api/brain/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const analysisData = await res.json();
      setAnalysis(analysisData);

      // Reason
      const reasoningRes = await fetch("/api/brain/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: analysisData.id, goal }),
      });
      const reasoningData = await reasoningRes.json();
      setReasoning(reasoningData);

      // Plan workflow
      const workflowRes = await fetch("/api/brain/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: analysisData.id }),
      });
      const workflowData = await workflowRes.json();
      setWorkflow(workflowData);
    } catch (err) {
      console.error("Analysis failed");
    }

    setLoading(false);
  };

  const setOperatingMode = async (newMode: string) => {
    try {
      const res = await fetch("/api/brain/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await res.json();
      setMode(data);
    } catch (err) {
      console.error("Failed to set mode");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-purple-400">🧠 DEVIL Brain</h1>
              <p className="text-gray-400 text-sm">Central Intelligence Core</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setOperatingMode("god")}
                className={`px-4 py-2 rounded ${
                  mode?.mode === "god" ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                ⚡ GOD Mode
              </button>
              <button
                onClick={() => setOperatingMode("devil")}
                className={`px-4 py-2 rounded ${
                  mode?.mode === "devil" ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                🔥 DEVIL Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {[
            { id: "analyze", label: "🧠 Analyze Mission" },
            { id: "models", label: "🤖 Models" },
            { id: "mode", label: "⚙️ Operating Mode" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-t ${
                activeTab === tab.id ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input */}
            <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🎯 Describe Your Mission</h3>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Build me a SaaS startup with React frontend and Node.js backend..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 h-32 resize-none"
              />
              <button
                onClick={analyzeMission}
                disabled={loading || !goal.trim()}
                className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded"
              >
                {loading ? "🧠 Analyzing..." : "🧠 Analyze Mission"}
              </button>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">📊 Mission Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{domainIcons[analysis.domain] || "🎯"}</span>
                      <div>
                        <p className="text-sm text-gray-400">Domain</p>
                        <p className="font-medium capitalize">{analysis.domain}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Complexity</p>
                      <p className={`font-medium capitalize ${complexityColors[analysis.complexity]}`}>
                        {analysis.complexity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Risk Level</p>
                      <p className="font-medium capitalize">{analysis.risk}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Estimated Duration</p>
                      <p className="font-medium">{analysis.estimatedDuration} minutes</p>
                    </div>
                    <div className={`mt-4 px-3 py-2 rounded ${modeColors[analysis.recommendedMode]}`}>
                      <p className="text-sm">Recommended Mode</p>
                      <p className="font-bold uppercase">{analysis.recommendedMode}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">🤖 Required Agents</h3>
                  <div className="space-y-2">
                    {analysis.requiredAgents.map((agent, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-700 rounded p-3">
                        <span className="text-2xl">{agentIcons[agent] || "🤖"}</span>
                        <span className="capitalize font-medium">{agent.replace("_", " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">🛤️ Workflow Plan</h3>
                  {workflow && (
                    <div className="space-y-3">
                      {workflow.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-700 rounded p-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                            {step.order}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {agentIcons[step.agent] || "🤖"} {step.task}
                            </p>
                            <p className="text-xs text-gray-400">{step.estimatedDuration} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Reasoning Trace */}
            {reasoning && (
              <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">
                  🧠 Reasoning Trace ({Math.round(reasoning.confidence * 100)}% confidence)
                </h3>
                <div className="space-y-4">
                  {reasoning.steps.map((step, i) => (
                    <div key={i} className="border-l-2 border-purple-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded capitalize">
                          {step.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Confidence: {Math.round(step.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">{step.reasoning}</p>
                      <p className="text-sm text-green-400">{step.output}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "models" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{model.provider.toUpperCase()}</h3>
                  {model.reasoning && (
                    <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs rounded">
                      🧠 Reasoning
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-400">Model</p>
                    <p className="font-medium">{model.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Max Tokens</p>
                    <p className="font-medium">{(model.maxTokens / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "mode" && mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg ${mode.mode === "god" ? "bg-purple-900" : "bg-gray-800"}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚡</span>
                <h3 className="text-xl font-bold">GOD Mode</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Strategic mode for maximum reliability.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> High validation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> High reasoning
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> High safety
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Detailed planning
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Multiple approval gates
                </li>
              </ul>
              <button
                onClick={() => setOperatingMode("god")}
                className={`mt-4 w-full py-2 rounded ${
                  mode.mode === "god" ? "bg-purple-600" : "bg-purple-600/50 hover:bg-purple-600"
                }`}
              >
                {mode.mode === "god" ? "✓ Active" : "Activate GOD Mode"}
              </button>
            </div>

            <div className={`p-6 rounded-lg ${mode.mode === "devil" ? "bg-red-900" : "bg-gray-800"}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🔥</span>
                <h3 className="text-xl font-bold">DEVIL Mode</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Aggressive mode for maximum speed.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Fast execution
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Parallel workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Reduced approvals
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> High autonomy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Minimal interruptions
                </li>
              </ul>
              <button
                onClick={() => setOperatingMode("devil")}
                className={`mt-4 w-full py-2 rounded ${
                  mode.mode === "devil" ? "bg-red-600" : "bg-red-600/50 hover:bg-red-600"
                }`}
              >
                {mode.mode === "devil" ? "✓ Active" : "Activate DEVIL Mode"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
