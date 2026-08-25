/**
 * DEVIL Architect 2.0 - Intelligence Dashboard
 */

import React, { useState } from "react";

interface Roadmap {
  id: string;
  goal: string;
  phases: Phase[];
  scores: Scores;
  analysis: Analysis;
  executionOrder: string[];
  createdAt: string;
  version: number;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  tasks: Task[];
  complexity: string;
  estimatedMinutes: number;
  approvalRequired: boolean;
}

interface Task {
  id: string;
  name: string;
  description: string;
  complexity: string;
  estimatedMinutes: number;
  dependencies: string[];
}

interface Scores {
  complexityScore: number;
  riskScore: number;
  confidenceScore: number;
  readinessScore: number;
}

interface Analysis {
  goal: GoalAnalysis;
  complexity: ComplexityInfo;
  risk: RiskInfo;
  timeline: TimelineInfo;
  stack: StackRecommendation;
}

interface GoalAnalysis {
  objectives: string[];
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  impliedGoals: string[];
  risks: string[];
}

interface ComplexityInfo {
  overall: string;
  score: number;
  factors: { name: string; impact: string; score: number; reason: string }[];
}

interface RiskInfo {
  overallRisk: string;
  score: number;
  risks: Risk[];
  mitigationPlan: { riskId: string; action: string; priority: string }[];
}

interface Risk {
  id: string;
  category: string;
  severity: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

interface TimelineInfo {
  totalDuration: number;
  phaseDurations: { phaseId: string; phaseName: string; estimatedMinutes: number }[];
  confidence: number;
}

interface StackRecommendation {
  frontend?: string;
  backend?: string;
  database?: string;
  deployment?: string;
  reasoning: string;
}

const riskColors: Record<string, string> = {
  LOW: "bg-green-600",
  MEDIUM: "bg-yellow-600",
  HIGH: "bg-orange-600",
  CRITICAL: "bg-red-600",
};

const complexityColors: Record<string, string> = {
  TRIVIAL: "bg-green-400",
  LOW: "bg-green-600",
  MEDIUM: "bg-yellow-600",
  HIGH: "bg-orange-600",
  EXTREME: "bg-red-600",
};

export default function ArchitectDashboard() {
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "phases" | "risks" | "timeline" | "stack">("overview");

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Please enter a goal");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/architect/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate roadmap");
      }

      const data = await response.json();
      setRoadmap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate roadmap");
    }

    setLoading(false);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🧠 DEVIL Architect 2.0</h1>
              <p className="text-gray-400 text-sm">Intelligent Autonomous Planning System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Input */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">What do you want to build?</h2>
          
          <div className="space-y-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Build a React dashboard with user authentication and charts"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 h-24 resize-none"
            />

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !goal.trim()}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              {loading ? "🧠 Analyzing..." : "🔮 Generate Intelligent Roadmap"}
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap Display */}
      {roadmap && (
        <>
          {/* Scores Overview */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm">Complexity</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${complexityColors[roadmap.analysis.complexity.overall]}`} />
                  <span className="text-2xl font-bold">{roadmap.scores.complexityScore}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{roadmap.analysis.complexity.overall}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm">Risk</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${riskColors[roadmap.analysis.risk.overallRisk]}`} />
                  <span className="text-2xl font-bold">{roadmap.scores.riskScore}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{roadmap.analysis.risk.overallRisk} RISK</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm">Confidence</p>
                <span className="text-2xl font-bold text-blue-400">{roadmap.scores.confidenceScore}%</span>
                <p className="text-xs text-gray-500 mt-1">Prediction confidence</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm">Readiness</p>
                <span className={`text-2xl font-bold ${
                  roadmap.scores.readinessScore >= 70 ? "text-green-400" :
                  roadmap.scores.readinessScore >= 40 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {roadmap.scores.readinessScore}%
                </span>
                <p className="text-xs text-gray-500 mt-1">Mission readiness</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-6 py-2">
            <div className="flex gap-2 border-b border-gray-700 pb-2">
              {(["overview", "phases", "risks", "timeline", "stack"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t ${activeTab === tab ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">🎯 Goal Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-gray-400 mb-2">Objectives</h4>
                      <ul className="space-y-1">
                        {roadmap.analysis.goal.objectives.map((obj, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400 mb-2">Requirements</h4>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.analysis.goal.requirements.map((req, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">{req}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">📊 Complexity Factors</h3>
                  <div className="space-y-3">
                    {roadmap.analysis.complexity.factors.map((factor, i) => (
                      <div key={i} className="bg-gray-700 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{factor.name}</span>
                          <span className={`text-sm ${factor.impact === "increases" ? "text-red-400" : "text-green-400"}`}>
                            {factor.impact === "increases" ? "+" : "-"}{factor.score}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{factor.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Phases */}
            {activeTab === "phases" && (
              <div className="space-y-6">
                {roadmap.phases.map((phase) => (
                  <div key={phase.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{phase.name}</h3>
                        <p className="text-gray-400 text-sm">{phase.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded text-sm ${complexityColors[phase.complexity]}`}>{phase.complexity}</span>
                        <span className="text-gray-400 text-sm">{formatDuration(phase.estimatedMinutes)}</span>
                        {phase.approvalRequired && (
                          <span className="px-2 py-1 bg-orange-900/50 border border-orange-700 rounded text-xs">⚠️ Approval Required</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="bg-gray-700 rounded p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{task.name}</p>
                            <p className="text-xs text-gray-400">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{formatDuration(task.estimatedMinutes)}</span>
                            <span>{task.dependencies.length} deps</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risks */}
            {activeTab === "risks" && (
              <div className="space-y-6">
                {roadmap.analysis.risk.mitigationPlan.length > 0 && (
                  <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">🛡️ Mitigation Plan</h3>
                    <div className="space-y-3">
                      {roadmap.analysis.risk.mitigationPlan.map((plan, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className={`px-2 py-1 rounded text-xs ${plan.priority === "immediate" ? "bg-red-600" : plan.priority === "important" ? "bg-yellow-600" : "bg-gray-600"}`}>{plan.priority}</span>
                          <p className="text-sm flex-1">{plan.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">⚠️ Identified Risks</h3>
                  <div className="space-y-3">
                    {roadmap.analysis.risk.risks.map((risk) => (
                      <div key={risk.id} className="bg-gray-700 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${riskColors[risk.severity]}`}>{risk.severity}</span>
                            <span className="text-xs text-gray-400 uppercase">{risk.category}</span>
                          </div>
                          <span className="text-xs text-gray-400">P: {risk.probability}% / I: {risk.impact}%</span>
                        </div>
                        <p className="text-sm mb-2">{risk.description}</p>
                        <p className="text-xs text-green-400">💡 {risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {activeTab === "timeline" && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">⏱️ Timeline</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatDuration(roadmap.analysis.timeline.totalDuration)}</p>
                    <p className="text-sm text-gray-400">Total Duration</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {roadmap.analysis.timeline.phaseDurations.map((phase, i) => (
                    <div key={phase.phaseId} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-gray-400">{phase.phaseName}</div>
                      <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                        <div className="h-full flex items-center justify-end pr-2" style={{ width: `${(phase.estimatedMinutes / roadmap.analysis.timeline.totalDuration) * 100}%`, backgroundColor: `hsl(${200 + i * 30}, 70%, 50%)` }}>
                          <span className="text-xs text-white font-medium">{formatDuration(phase.estimatedMinutes)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-400 mt-4">Confidence: <span className="text-blue-400 font-bold">{roadmap.analysis.timeline.confidence}%</span></p>
              </div>
            )}

            {/* Stack */}
            {activeTab === "stack" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-sm text-gray-400 mb-2">Frontend</h3>
                  <p className="text-xl font-bold">{roadmap.analysis.stack.frontend || "Not specified"}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-sm text-gray-400 mb-2">Backend</h3>
                  <p className="text-xl font-bold">{roadmap.analysis.stack.backend || "Not specified"}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-sm text-gray-400 mb-2">Database</h3>
                  <p className="text-xl font-bold">{roadmap.analysis.stack.database || "Not specified"}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-sm text-gray-400 mb-2">Deployment</h3>
                  <p className="text-xl font-bold">{roadmap.analysis.stack.deployment || "Not specified"}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 md:col-span-2">
                  <h3 className="text-sm text-gray-400 mb-2">Reasoning</h3>
                  <p className="text-sm">{roadmap.analysis.stack.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
