/**
 * DEVIL Autonomous Evolution & Self-Improvement Engine
 * 
 * Phase 20: Extend existing Evolution system with self-improvement capabilities.
 * 
 * Features:
 * - Learning Engine (Track missions, outcomes, patterns)
 * - Capability Analyzer (Analyze strengths, weaknesses)
 * - Weakness Detector (Identify failure patterns)
 * - Strategy Engine (Generate improvement proposals)
 * - Self Optimization (Create optimization plans)
 * - Experimentation Engine (A/B testing, workflow testing)
 * - Evolution Memory (Store lessons, best practices)
 * - DEVIL Genome (Store capabilities)
 * - Mission Retrospective (After-mission analysis)
 * - Evolution Score (Generate intelligence scores)
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES - LEARNING
// ============================================================================

export interface MissionOutcome {
  missionId: string;
  success: boolean;
  duration: number;
  userApproval: boolean;
  userRejection?: boolean;
  rejectionReason?: string;
  recoveryActions: string[];
  lessons: string[];
  timestamp: Date;
}

export interface AgentPerformance {
  agentId: string;
  agentType: string;
  missionsAttempted: number;
  missionsSucceeded: number;
  averageDuration: number;
  successRate: number;
  recentTrend: "improving" | "stable" | "declining";
}

export interface LearningPattern {
  id: string;
  type: "success" | "failure" | "recovery";
  pattern: string;
  frequency: number;
  examples: string[];
  recommendations: string[];
  discoveredAt: Date;
}

export interface Weakness {
  id: string;
  component: string;
  weaknessType: "execution" | "reasoning" | "memory" | "tool" | "prompt" | "workflow";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  frequency: number;
  lastOccurrence: Date;
  impact: number;
  suggestedFix?: string;
  status: "identified" | "fixing" | "resolved" | "accepted";
}

// ============================================================================
// TYPES - GENOME
// ============================================================================

export interface DEVILGenome {
  id: string;
  coreCapabilities: {
    name: string;
    maturity: number;
    lastUsed: Date;
  }[];
  learnedCapabilities: {
    name: string;
    learnedFrom: string;
    successRate: number;
    addedAt: Date;
  }[];
  experimentalCapabilities: {
    name: string;
    experimentId: string;
    status: "running" | "success" | "failed";
    results?: string;
  }[];
  retiredCapabilities: {
    name: string;
    reason: string;
    retiredAt: Date;
  }[];
}

// ============================================================================
// TYPES - EXPERIMENTS
// ============================================================================

export interface Experiment {
  id: string;
  name: string;
  type: "prompt" | "workflow" | "model" | "agent";
  hypothesis: string;
  control: Record<string, unknown>;
  variant: Record<string, unknown>;
  status: "planned" | "running" | "completed" | "cancelled";
  results?: {
    controlMetric: number;
    variantMetric: number;
    winner: "control" | "variant" | "tie";
    confidence: number;
    recommendation: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// TYPES - OPTIMIZATION
// ============================================================================

export interface OptimizationProposal {
  id: string;
  target: "prompt" | "workflow" | "agent" | "architecture" | "memory";
  currentIssue: string;
  proposedChange: string;
  expectedImprovement: {
    metric: string;
    improvement: number;
  }[];
  risk: "low" | "medium" | "high";
  status: "proposed" | "experimenting" | "approved" | "implemented" | "rejected";
  createdAt: Date;
}

// ============================================================================
// TYPES - EVOLUTION SCORE
// ============================================================================

export interface EvolutionScore {
  timestamp: Date;
  intelligenceScore: number;
  executionScore: number;
  reliabilityScore: number;
  autonomyScore: number;
  innovationScore: number;
  overallScore: number;
  trends: {
    metric: string;
    change: number;
    trend: "improving" | "stable" | "declining";
  }[];
}

// ============================================================================
// AUTONOMOUS EVOLUTION ENGINE
// ============================================================================

export class AutonomousEvolutionEngine {
  // Learning data
  private missionOutcomes: MissionOutcome[] = [];
  private agentPerformances: Map<string, AgentPerformance> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private weaknesses: Map<string, Weakness> = new Map();
  
  // Genome
  private genome: DEVILGenome;
  
  // Experiments
  private experiments: Map<string, Experiment> = new Map();
  
  // Optimization
  private optimizationProposals: Map<string, OptimizationProposal> = new Map();
  
  // Evolution scores
  private evolutionScores: EvolutionScore[] = [];
  
  // Evolution memory
  private evolutionMemory: {
    lessonsLearned: string[];
    bestPractices: string[];
    winningWorkflows: string[];
    failedWorkflows: string[];
    optimizationHistory: { date: Date; change: string; result: string }[];
  } = {
    lessonsLearned: [],
    bestPractices: [],
    winningWorkflows: [],
    failedWorkflows: [],
    optimizationHistory: [],
  };

  constructor() {
    this.initializeGenome();
    this.initializeWeaknesses();
    this.log("AutonomousEvolutionEngine initialized");
  }

  // ==========================================================================
  // LEARNING ENGINE
  // ==========================================================================

  recordMissionOutcome(outcome: Omit<MissionOutcome, "timestamp">): MissionOutcome {
    const fullOutcome: MissionOutcome = {
      ...outcome,
      timestamp: new Date(),
    };

    this.missionOutcomes.push(fullOutcome);
    this.analyzeOutcome(fullOutcome);
    this.updateAgentPerformance(fullOutcome);
    
    return fullOutcome;
  }

  private analyzeOutcome(outcome: MissionOutcome) {
    // Extract patterns from successful missions
    if (outcome.success) {
      this.extractSuccessPatterns(outcome);
      this.evolutionMemory.winningWorkflows.push(outcome.missionId);
    } else {
      this.extractFailurePatterns(outcome);
      this.evolutionMemory.failedWorkflows.push(outcome.missionId);
    }

    // Learn from recovery actions
    if (outcome.recoveryActions.length > 0) {
      this.learnFromRecovery(outcome);
    }

    // Generate lessons
    if (outcome.lessons.length > 0) {
      this.evolutionMemory.lessonsLearned.push(...outcome.lessons);
    }
  }

  private extractSuccessPatterns(outcome: MissionOutcome) {
    const patternId = `success-${outcome.missionId.slice(0, 8)}`;
    
    if (!this.learningPatterns.has(patternId)) {
      this.learningPatterns.set(patternId, {
        id: patternId,
        type: "success",
        pattern: `Successful mission ${outcome.missionId}`,
        frequency: 1,
        examples: [outcome.missionId],
        recommendations: outcome.lessons,
        discoveredAt: new Date(),
      });
    } else {
      const pattern = this.learningPatterns.get(patternId)!;
      pattern.frequency++;
      pattern.examples.push(outcome.missionId);
    }
  }

  private extractFailurePatterns(outcome: MissionOutcome) {
    const patternId = `failure-${outcome.rejectionReason || "unknown"}`;
    
    if (!this.learningPatterns.has(patternId)) {
      this.learningPatterns.set(patternId, {
        id: patternId,
        type: "failure",
        pattern: outcome.rejectionReason || "Unknown failure",
        frequency: 1,
        examples: [outcome.missionId],
        recommendations: this.generateFailureRecommendations(outcome),
        discoveredAt: new Date(),
      });
    } else {
      const pattern = this.learningPatterns.get(patternId)!;
      pattern.frequency++;
      pattern.examples.push(outcome.missionId);
    }
  }

  private generateFailureRecommendations(outcome: MissionOutcome): string[] {
    const recommendations: string[] = [];
    
    if (outcome.duration > 300000) { // > 5 minutes
      recommendations.push("Consider optimizing mission workflow for faster execution");
    }
    
    if (outcome.rejectionReason) {
      recommendations.push(`Address root cause: ${outcome.rejectionReason}`);
    }
    
    if (outcome.recoveryActions.length > 2) {
      recommendations.push("Mission required multiple recovery attempts - review error handling");
    }
    
    return recommendations;
  }

  private learnFromRecovery(outcome: MissionOutcome) {
    const patternId = `recovery-${outcome.missionId.slice(0, 8)}`;
    
    this.learningPatterns.set(patternId, {
      id: patternId,
      type: "recovery",
      pattern: "Recovery action successful",
      frequency: outcome.recoveryActions.length,
      examples: outcome.recoveryActions,
      recommendations: outcome.recoveryActions,
      discoveredAt: new Date(),
    });

    // Add to best practices if recovery worked
    if (outcome.success) {
      this.evolutionMemory.bestPractices.push(...outcome.recoveryActions);
    }
  }

  private updateAgentPerformance(outcome: MissionOutcome) {
    // Simplified - would connect to actual agent system
    const agentId = "default-agent";
    let perf = this.agentPerformances.get(agentId);
    
    if (!perf) {
      perf = {
        agentId,
        agentType: "general",
        missionsAttempted: 0,
        missionsSucceeded: 0,
        averageDuration: 0,
        successRate: 0,
        recentTrend: "stable",
      };
      this.agentPerformances.set(agentId, perf);
    }

    perf.missionsAttempted++;
    if (outcome.success) perf.missionsSucceeded++;
    
    perf.successRate = (perf.missionsSucceeded / perf.missionsAttempted) * 100;
    perf.averageDuration = (
      (perf.averageDuration * (perf.missionsAttempted - 1)) + outcome.duration
    ) / perf.missionsAttempted;

    // Determine trend
    const recentOutcomes = this.missionOutcomes.slice(-10);
    const recentSuccess = recentOutcomes.filter(o => o.success).length;
    const previousOutcomes = this.missionOutcomes.slice(-20, -10);
    const previousSuccess = previousOutcomes.length > 0 
      ? previousOutcomes.filter(o => o.success).length / previousOutcomes.length
      : recentSuccess / recentOutcomes.length;
    
    const recentRate = recentSuccess / recentOutcomes.length;
    if (recentRate > previousSuccess + 0.05) {
      perf.recentTrend = "improving";
    } else if (recentRate < previousSuccess - 0.05) {
      perf.recentTrend = "declining";
    } else {
      perf.recentTrend = "stable";
    }
  }

  getLearningHistory(limit: number = 100): MissionOutcome[] {
    return this.missionOutcomes.slice(-limit);
  }

  getAgentPerformances(): AgentPerformance[] {
    return Array.from(this.agentPerformances.values());
  }

  getPatterns(): LearningPattern[] {
    return Array.from(this.learningPatterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  // ==========================================================================
  // CAPABILITY ANALYZER
  // ==========================================================================

  analyzeCapabilities(): {
    strengths: { capability: string; score: number }[];
    weaknesses: { capability: string; score: number }[];
    missing: string[];
    bottlenecks: string[];
  } {
    // Analyze success rates by capability
    const capabilityScores: Record<string, { success: number; total: number }> = {};
    
    for (const outcome of this.missionOutcomes) {
      const capability = this.inferCapability(outcome.missionId);
      if (!capabilityScores[capability]) {
        capabilityScores[capability] = { success: 0, total: 0 };
      }
      capabilityScores[capability].total++;
      if (outcome.success) capabilityScores[capability].success++;
    }

    const capabilities = Object.entries(capabilityScores)
      .map(([name, scores]) => ({
        name,
        score: (scores.success / scores.total) * 100,
        total: scores.total,
      }));

    const strengths = capabilities
      .filter(c => c.score >= 85)
      .map(c => ({ capability: c.name, score: c.score }));

    const weaknesses = capabilities
      .filter(c => c.score < 70)
      .map(c => ({ capability: c.name, score: c.score }));

    const missing = this.identifyMissingCapabilities();
    const bottlenecks = this.identifyBottlenecks();

    return { strengths, weaknesses, missing, bottlenecks };
  }

  private inferCapability(missionId: string): string {
    // Simplified inference based on mission ID
    if (missionId.includes("code")) return "Code Generation";
    if (missionId.includes("deploy")) return "Deployment";
    if (missionId.includes("test")) return "Testing";
    return "General";
  }

  private identifyMissingCapabilities(): string[] {
    const knownCapabilities = [
      "Code Generation",
      "Code Review",
      "Deployment",
      "Testing",
      "Documentation",
      "Research",
      "Analysis",
    ];

    const usedCapabilities = new Set(
      this.missionOutcomes.map(o => this.inferCapability(o.missionId))
    );

    return knownCapabilities.filter(c => !usedCapabilities.has(c));
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    const avgDuration = this.missionOutcomes.reduce((sum, o) => sum + o.duration, 0) 
      / this.missionOutcomes.length;
    
    const slowMissions = this.missionOutcomes.filter(o => o.duration > avgDuration * 1.5);
    
    if (slowMissions.length > this.missionOutcomes.length * 0.2) {
      bottlenecks.push("Execution speed - too many slow missions");
    }

    const failedRecovery = this.missionOutcomes.filter(
      o => !o.success && o.recoveryActions.length === 0
    );
    
    if (failedRecovery.length > 5) {
      bottlenecks.push("Recovery capability - insufficient recovery actions");
    }

    return bottlenecks;
  }

  // ==========================================================================
  // WEAKNESS DETECTOR
  // ==========================================================================

  detectWeaknesses(): Weakness[] {
    // Analyze failure patterns
    const failurePatterns = this.getPatterns().filter(p => p.type === "failure");
    
    for (const pattern of failurePatterns) {
      if (pattern.frequency >= 3) {
        const weaknessId = `weak-${pattern.id}`;
        
        if (!this.weaknesses.has(weaknessId)) {
          this.weaknesses.set(weaknessId, {
            id: weaknessId,
            component: this.inferComponent(pattern.pattern),
            weaknessType: this.inferWeaknessType(pattern.pattern),
            description: pattern.pattern,
            severity: pattern.frequency >= 5 ? "high" : pattern.frequency >= 3 ? "medium" : "low",
            frequency: pattern.frequency,
            lastOccurrence: new Date(),
            impact: pattern.frequency * 10,
            suggestedFix: pattern.recommendations[0],
            status: "identified",
          });
        } else {
          const weakness = this.weaknesses.get(weaknessId)!;
          weakness.frequency = pattern.frequency;
          weakness.lastOccurrence = new Date();
        }
      }
    }

    return Array.from(this.weaknesses.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  private inferComponent(pattern: string): string {
    if (pattern.includes("code")) return "Coding Agent";
    if (pattern.includes("deploy")) return "Deployment Agent";
    if (pattern.includes("memory")) return "Memory System";
    return "General";
  }

  private inferWeaknessType(pattern: string): Weakness["weaknessType"] {
    if (pattern.includes("prompt")) return "prompt";
    if (pattern.includes("tool")) return "tool";
    if (pattern.includes("memory")) return "memory";
    if (pattern.includes("workflow")) return "workflow";
    if (pattern.includes("reason")) return "reasoning";
    return "execution";
  }

  getWeaknesses(): Weakness[] {
    return Array.from(this.weaknesses.values());
  }

  updateWeaknessStatus(id: string, status: Weakness["status"]) {
    const weakness = this.weaknesses.get(id);
    if (weakness) {
      weakness.status = status;
    }
  }

  // ==========================================================================
  // STRATEGY ENGINE
  // ==========================================================================

  generateImprovementProposals(): OptimizationProposal[] {
    const proposals: OptimizationProposal[] = [];
    
    // Analyze weaknesses and generate proposals
    const weaknesses = this.detectWeaknesses();
    
    for (const weakness of weaknesses.filter(w => w.status === "identified").slice(0, 5)) {
      proposals.push(this.createProposalFromWeakness(weakness));
    }

    // Analyze capability gaps
    const capabilities = this.analyzeCapabilities();
    
    for (const missing of capabilities.missing.slice(0, 3)) {
      proposals.push({
        id: `opt-${randomUUID().slice(0, 8)}`,
        target: "agent",
        currentIssue: `Missing capability: ${missing}`,
        proposedChange: `Develop ${missing} capability`,
        expectedImprovement: [{ metric: "coverage", improvement: 10 }],
        risk: "medium",
        status: "proposed",
        createdAt: new Date(),
      });
    }

    for (const proposal of proposals) {
      this.optimizationProposals.set(proposal.id, proposal);
    }

    return proposals;
  }

  private createProposalFromWeakness(weakness: Weakness): OptimizationProposal {
    return {
      id: `opt-${randomUUID().slice(0, 8)}`,
      target: weakness.weaknessType === "prompt" ? "prompt" :
              weakness.weaknessType === "workflow" ? "workflow" :
              weakness.weaknessType === "agent" ? "agent" : "architecture",
      currentIssue: weakness.description,
      proposedChange: weakness.suggestedFix || `Fix ${weakness.component} ${weakness.weaknessType}`,
      expectedImprovement: [
        { metric: "success_rate", improvement: weakness.impact },
        { metric: "reliability", improvement: weakness.frequency * 5 },
      ],
      risk: weakness.severity === "critical" ? "high" : 
            weakness.severity === "high" ? "medium" : "low",
      status: "proposed",
      createdAt: new Date(),
    };
  }

  getProposals(): OptimizationProposal[] {
    return Array.from(this.optimizationProposals.values());
  }

  approveProposal(id: string): boolean {
    const proposal = this.optimizationProposals.get(id);
    if (proposal) {
      proposal.status = "approved";
      return true;
    }
    return false;
  }

  implementProposal(id: string): boolean {
    const proposal = this.optimizationProposals.get(id);
    if (proposal && proposal.status === "approved") {
      proposal.status = "implemented";
      this.evolutionMemory.optimizationHistory.push({
        date: new Date(),
        change: proposal.proposedChange,
        result: "Implemented successfully",
      });
      return true;
    }
    return false;
  }

  // ==========================================================================
  // EXPERIMENTATION ENGINE
  // ==========================================================================

  createExperiment(
    name: string,
    type: Experiment["type"],
    hypothesis: string,
    control: Record<string, unknown>,
    variant: Record<string, unknown>
  ): Experiment {
    const experiment: Experiment = {
      id: `exp-${randomUUID().slice(0, 8)}`,
      name,
      type,
      hypothesis,
      control,
      variant,
      status: "planned",
      createdAt: new Date(),
    };

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  startExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (experiment && experiment.status === "planned") {
      experiment.status = "running";
      experiment.startedAt = new Date();
      return true;
    }
    return false;
  }

  completeExperiment(
    id: string,
    controlMetric: number,
    variantMetric: number,
    recommendation: string
  ): Experiment | undefined {
    const experiment = this.experiments.get(id);
    if (experiment && experiment.status === "running") {
      experiment.status = "completed";
      experiment.completedAt = new Date();
      
      let winner: "control" | "variant" | "tie" = "tie";
      if (variantMetric > controlMetric * 1.05) winner = "variant";
      else if (controlMetric > variantMetric * 1.05) winner = "control";
      
      experiment.results = {
        controlMetric,
        variantMetric,
        winner,
        confidence: Math.abs(variantMetric - controlMetric) / Math.max(controlMetric, variantMetric),
        recommendation,
      };

      // Update genome if variant won
      if (winner === "variant") {
        this.addExperimentalCapability(experiment);
      }

      return experiment;
    }
    return undefined;
  }

  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  // ==========================================================================
  // DEVIL GENOME
  // ==========================================================================

  private initializeGenome() {
    this.genome = {
      id: "devil-genome-v1",
      coreCapabilities: [
        { name: "Mission Execution", maturity: 90, lastUsed: new Date() },
        { name: "Code Generation", maturity: 85, lastUsed: new Date() },
        { name: "Deployment", maturity: 88, lastUsed: new Date() },
        { name: "Memory Management", maturity: 82, lastUsed: new Date() },
        { name: "Multi-Agent Coordination", maturity: 80, lastUsed: new Date() },
      ],
      learnedCapabilities: [],
      experimentalCapabilities: [],
      retiredCapabilities: [],
    };
  }

  addLearnedCapability(name: string, source: string, successRate: number) {
    this.genome.learnedCapabilities.push({
      name,
      learnedFrom: source,
      successRate,
      addedAt: new Date(),
    });
  }

  private addExperimentalCapability(experiment: Experiment) {
    this.genome.experimentalCapabilities.push({
      name: experiment.name,
      experimentId: experiment.id,
      status: experiment.results?.winner === "variant" ? "success" : "failed",
      results: experiment.results?.recommendation,
    });
  }

  retireCapability(name: string, reason: string) {
    const index = this.genome.coreCapabilities.findIndex(c => c.name === name);
    if (index !== -1) {
      const [capability] = this.genome.coreCapabilities.splice(index, 1);
      this.genome.retiredCapabilities.push({
        name: capability.name,
        reason,
        retiredAt: new Date(),
      });
    }
  }

  getGenome(): DEVILGenome {
    return this.genome;
  }

  // ==========================================================================
  // MISSION RETROSPECTIVE
  // ==========================================================================

  generateRetrospective(missionId: string): {
    summary: string;
    outcome: "success" | "failure";
    keyLessons: string[];
    areasForImprovement: string[];
    actionableRecommendations: string[];
  } {
    const outcomes = this.missionOutcomes.filter(o => o.missionId === missionId);
    const outcome = outcomes[0];

    if (!outcome) {
      return {
        summary: "Mission not found in history",
        outcome: "failure",
        keyLessons: [],
        areasForImprovement: [],
        actionableRecommendations: [],
      };
    }

    return {
      summary: outcome.success 
        ? `Mission ${missionId} completed successfully in ${outcome.duration}ms`
        : `Mission ${missionId} failed: ${outcome.rejectionReason}`,
      outcome: outcome.success ? "success" : "failure",
      keyLessons: outcome.lessons,
      areasForImprovement: outcome.rejectionReason 
        ? [outcome.rejectionReason] 
        : [],
      actionableRecommendations: outcome.success 
        ? ["Continue using successful patterns"]
        : [`Address: ${outcome.rejectionReason}`],
    };
  }

  // ==========================================================================
  // EVOLUTION SCORE
  // ==========================================================================

  calculateEvolutionScore(): EvolutionScore {
    // Calculate individual scores
    const recentOutcomes = this.missionOutcomes.slice(-50);
    const successRate = recentOutcomes.length > 0
      ? (recentOutcomes.filter(o => o.success).length / recentOutcomes.length) * 100
      : 85;

    const avgDuration = recentOutcomes.length > 0
      ? recentOutcomes.reduce((sum, o) => sum + o.duration, 0) / recentOutcomes.length
      : 60000;

    const efficiency = Math.max(0, 100 - (avgDuration / 1000)); // ms to seconds penalty

    const intelligenceScore = successRate * 0.6 + efficiency * 0.4;
    const executionScore = successRate * 0.7 + (100 - avgDuration / 1000) * 0.3;
    const reliabilityScore = successRate;
    const autonomyScore = recentOutcomes.filter(o => o.userApproval).length / 
      (recentOutcomes.filter(o => o.userApproval || o.userRejection).length || 1) * 100;
    const innovationScore = this.genome.learnedCapabilities.length * 10 + 
      this.genome.experimentalCapabilities.length * 5;

    const overallScore = (
      intelligenceScore * 0.25 +
      executionScore * 0.25 +
      reliabilityScore * 0.25 +
      autonomyScore * 0.15 +
      innovationScore * 0.1
    );

    // Calculate trends
    const olderOutcomes = this.missionOutcomes.slice(-100, -50);
    const olderSuccessRate = olderOutcomes.length > 0
      ? (olderOutcomes.filter(o => o.success).length / olderOutcomes.length) * 100
      : successRate;

    const trends = [
      {
        metric: "success_rate",
        change: successRate - olderSuccessRate,
        trend: successRate > olderSuccessRate + 2 ? "improving" :
               successRate < olderSuccessRate - 2 ? "declining" : "stable",
      },
    ];

    const score: EvolutionScore = {
      timestamp: new Date(),
      intelligenceScore,
      executionScore,
      reliabilityScore,
      autonomyScore,
      innovationScore,
      overallScore,
      trends,
    };

    this.evolutionScores.push(score);
    return score;
  }

  getEvolutionScore(): EvolutionScore {
    return this.calculateEvolutionScore();
  }

  getScoreHistory(): EvolutionScore[] {
    return this.evolutionScores;
  }

  // ==========================================================================
  // EVOLUTION MEMORY
  // ==========================================================================

  getEvolutionMemory(): typeof this.evolutionMemory {
    return {
      ...this.evolutionMemory,
      lessonsLearned: this.evolutionMemory.lessonsLearned.slice(-50),
      bestPractices: this.evolutionMemory.bestPractices.slice(-20),
      winningWorkflows: this.evolutionMemory.winningWorkflows.slice(-20),
      failedWorkflows: this.evolutionMemory.failedWorkflows.slice(-20),
    };
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  getEvolutionDashboard(): {
    score: EvolutionScore;
    recentMissions: MissionOutcome[];
    topPatterns: LearningPattern[];
    criticalWeaknesses: Weakness[];
    activeExperiments: Experiment[];
    pendingProposals: OptimizationProposal[];
    genome: DEVILGenome;
    metrics: {
      totalMissions: number;
      successRate: number;
      averageDuration: number;
      improvementsImplemented: number;
    };
  } {
    const score = this.calculateEvolutionScore();
    const recentOutcomes = this.missionOutcomes.slice(-10);
    const recentSuccessRate = recentOutcomes.length > 0
      ? (recentOutcomes.filter(o => o.success).length / recentOutcomes.length) * 100
      : 0;

    return {
      score,
      recentMissions: recentOutcomes,
      topPatterns: this.getPatterns().slice(0, 5),
      criticalWeaknesses: this.getWeaknesses()
        .filter(w => w.severity === "high" || w.severity === "critical")
        .slice(0, 5),
      activeExperiments: this.getExperiments()
        .filter(e => e.status === "running" || e.status === "planned"),
      pendingProposals: this.getProposals()
        .filter(p => p.status === "proposed"),
      genome: this.getGenome(),
      metrics: {
        totalMissions: this.missionOutcomes.length,
        successRate: recentSuccessRate,
        averageDuration: recentOutcomes.reduce((sum, o) => sum + o.duration, 0) / (recentOutcomes.length || 1),
        improvementsImplemented: this.evolutionMemory.optimizationHistory.length,
      },
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "autonomous_evolution",
      severity: "info",
      message,
      details: { engine: "autonomous_evolution" },
    });
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const autonomousEvolution = new AutonomousEvolutionEngine();
