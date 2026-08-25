/**
 * DEVIL Architect 2.0 - Intelligence Engine
 * 
 * Strategic planning and analysis system for DEVIL.
 * - Goal Analysis
 * - Architecture Analysis
 * - Dependency Graph
 * - Complexity Estimation
 * - Risk Prediction
 * - Timeline Prediction
 * - Stack Recommendations
 * - Adaptive Planning
 */

import { logEvent } from "../control-plane/eventLog";
import { randomUUID } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

// Complexity Levels
export const ComplexityLevel = {
  TRIVIAL: "TRIVIAL",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  EXTREME: "EXTREME",
} as const;

export type ComplexityLevelType = typeof ComplexityLevel[keyof typeof ComplexityLevel];

// Risk Levels
export const RiskLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type RiskLevelType = typeof RiskLevel[keyof typeof RiskLevel];

// Score (0-100)
export type Score = number;

// Mission Scores
export interface MissionScores {
  complexityScore: Score;    // 0-100
  riskScore: Score;         // 0-100
  confidenceScore: Score;    // 0-100
  readinessScore: Score;     // 0-100
}

// Goal Analysis
export interface GoalAnalysis {
  objectives: string[];
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  impliedGoals: string[];
  risks: string[];
}

// Architecture Analysis
export interface ArchitectureAnalysis {
  summary: string;
  components: Component[];
  weaknesses: string[];
  missingComponents: string[];
  improvementOpportunities: string[];
  technologyScore: Score;
}

export interface Component {
  name: string;
  type: "frontend" | "backend" | "database" | "service" | "api" | "infrastructure";
  technologies: string[];
  dependencies: string[];
  complexity: ComplexityLevelType;
}

// Dependency Graph
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  executionOrder: string[];
  circularDependencies: string[][];
  blockedTasks: string[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: "task" | "phase" | "service" | "repository";
  dependencies: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: "blocks" | "requires" | "depends_on";
}

// Complexity Estimate
export interface ComplexityEstimate {
  overall: ComplexityLevelType;
  score: Score;
  factors: ComplexityFactor[];
  breakdown: {
    codeComplexity: Score;
    dependencyComplexity: Score;
    integrationComplexity: Score;
    deploymentComplexity: Score;
  };
}

export interface ComplexityFactor {
  name: string;
  impact: "increases" | "decreases";
  score: Score;
  reason: string;
}

// Risk Analysis
export interface RiskAnalysis {
  overallRisk: RiskLevelType;
  score: Score;
  risks: IdentifiedRisk[];
  mitigationPlan: MitigationStep[];
}

export interface IdentifiedRisk {
  id: string;
  category: "technical" | "deployment" | "security" | "dependency" | "timeline";
  severity: RiskLevelType;
  description: string;
  probability: Score;
  impact: Score;
  mitigation: string;
}

export interface MitigationStep {
  riskId: string;
  action: string;
  priority: "immediate" | "important" | "when_needed";
}

// Timeline Prediction
export interface TimelinePrediction {
  totalDuration: number; // minutes
  phaseDurations: PhaseDuration[];
  milestoneDates: MilestoneDate[];
  confidence: Score;
  factors: string[];
}

export interface PhaseDuration {
  phaseId: string;
  phaseName: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  variance?: number;
}

export interface MilestoneDate {
  name: string;
  date: Date;
  type: "phase_start" | "phase_end" | "milestone";
}

// Stack Recommendation
export interface StackRecommendation {
  frontend?: string;
  backend?: string;
  database?: string;
  cache?: string;
  queue?: string;
  storage?: string;
  infrastructure?: string;
  deployment?: string;
  reasoning: string;
  alternatives: StackAlternative[];
  compatibilityScore: Score;
}

export interface StackAlternative {
  component: string;
  alternatives: string[];
  reason: string;
}

// Roadmap
export interface Roadmap {
  id: string;
  missionId?: string;
  goal: string;
  analysis: {
    goal: GoalAnalysis;
    architecture: ArchitectureAnalysis;
    complexity: ComplexityEstimate;
    risk: RiskAnalysis;
    timeline: TimelinePrediction;
    stack: StackRecommendation;
  };
  phases: RoadmapPhase[];
  executionOrder: string[];
  scores: MissionScores;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  tasks: RoadmapTask[];
  dependencies: string[];
  complexity: ComplexityLevelType;
  estimatedMinutes: number;
  approvalRequired: boolean;
}

export interface RoadmapTask {
  id: string;
  name: string;
  description: string;
  complexity: ComplexityLevelType;
  estimatedMinutes: number;
  dependencies: string[];
  toolRequirements: string[];
}

// Architect Events
export type ArchitectEventType =
  | "architect_analysis_started"
  | "architect_analysis_completed"
  | "roadmap_generated"
  | "roadmap_adapted"
  | "risk_detected"
  | "timeline_predicted"
  | "stack_recommended";

export interface ArchitectEvent {
  id: string;
  type: ArchitectEventType;
  roadmapId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// ARCHITECT 2.0
// ============================================================================

export class Architect {
  private events: ArchitectEvent[] = [];

  // ==========================================================================
  // MAIN ANALYSIS
  // ==========================================================================

  async analyzeGoal(goal: string, context?: {
    repositoryUrl?: string;
    userPreferences?: Record<string, unknown>;
    projectId?: string;
  }): Promise<GoalAnalysis> {
    this.emitEvent("architect_analysis_started", { goal });

    const analysis: GoalAnalysis = {
      objectives: [],
      requirements: [],
      constraints: [],
      deliverables: [],
      successCriteria: [],
      impliedGoals: [],
      risks: [],
    };

    // Simple keyword-based analysis
    const goalLower = goal.toLowerCase();

    // Extract objectives
    if (goalLower.includes("build") || goalLower.includes("create")) {
      analysis.objectives.push("Build new functionality");
    }
    if (goalLower.includes("deploy")) {
      analysis.objectives.push("Deploy to target environment");
    }
    if (goalLower.includes("fix") || goalLower.includes("bug")) {
      analysis.objectives.push("Fix identified issues");
    }
    if (goalLower.includes("migrate")) {
      analysis.objectives.push("Migrate existing system");
    }
    if (goalLower.includes("api")) {
      analysis.objectives.push("Implement API endpoints");
    }

    // Extract requirements
    if (goalLower.includes("react")) {
      analysis.requirements.push("React frontend framework");
    }
    if (goalLower.includes("typescript")) {
      analysis.requirements.push("TypeScript implementation");
    }
    if (goalLower.includes("auth")) {
      analysis.requirements.push("Authentication system");
    }
    if (goalLower.includes("database") || goalLower.includes("db")) {
      analysis.requirements.push("Database integration");
    }
    if (goalLower.includes("test")) {
      analysis.requirements.push("Test coverage");
    }

    // Extract constraints
    if (goalLower.includes("mobile")) {
      analysis.constraints.push("Mobile-responsive design");
    }
    if (goalLower.includes("real-time")) {
      analysis.constraints.push("Real-time updates");
    }
    if (goalLower.includes("offline")) {
      analysis.constraints.push("Offline capability");
    }
    if (goalLower.includes("security")) {
      analysis.constraints.push("Security compliance");
    }

    // Generate deliverables
    analysis.deliverables.push("Functional application");
    analysis.deliverables.push("Code repository");
    analysis.deliverables.push("Documentation");
    analysis.deliverables.push("Deployment artifacts");

    // Success criteria
    analysis.successCriteria.push("All tests pass");
    analysis.successCriteria.push("Build succeeds");
    analysis.successCriteria.push("Deployment successful");
    analysis.successCriteria.push("User acceptance");

    // Implied goals
    if (goalLower.includes("build") && !goalLower.includes("test")) {
      analysis.impliedGoals.push("Add appropriate tests");
    }
    if (goalLower.includes("api") && !goalLower.includes("docs")) {
      analysis.impliedGoals.push("API documentation");
    }

    // Identify risks
    if (goalLower.includes("migrate")) {
      analysis.risks.push("Data migration risks");
      analysis.risks.push("Downtime during transition");
    }
    if (goalLower.includes("real-time")) {
      analysis.risks.push("WebSocket complexity");
    }

    this.emitEvent("architect_analysis_completed", { goal, objectives: analysis.objectives.length });

    return analysis;
  }

  // ==========================================================================
  // COMPLEXITY ESTIMATION
  // ==========================================================================

  estimateComplexity(
    goal: GoalAnalysis,
    architecture?: ArchitectureAnalysis
  ): ComplexityEstimate {
    let score = 50; // Base score
    const factors: ComplexityFactor[] = [];

    // Goal-based complexity
    const objectiveCount = goal.objectives.length;
    if (objectiveCount > 5) {
      score += 15;
      factors.push({
        name: "Multiple Objectives",
        impact: "increases",
        score: 15,
        reason: `${objectiveCount} objectives increase complexity`
      });
    }

    const requirementCount = goal.requirements.length;
    if (requirementCount > 5) {
      score += 10;
      factors.push({
        name: "Complex Requirements",
        impact: "increases",
        score: 10,
        reason: `${requirementCount} technical requirements`
      });
    }

    // Check for complex technologies
    const techKeywords = ["real-time", "websocket", "graphql", "microservices", "ai", "ml"];
    for (const keyword of techKeywords) {
      if (goal.goal.toLowerCase().includes(keyword)) {
        score += 15;
        factors.push({
          name: `Technology: ${keyword}`,
          impact: "increases",
          score: 15,
          reason: `${keyword} adds significant complexity`
        });
      }
    }

    // Architecture-based complexity
    if (architecture) {
      if (architecture.components.length > 10) {
        score += 10;
        factors.push({
          name: "Large Architecture",
          impact: "increases",
          score: 10,
          reason: `${architecture.components.length} components`
        });
      }
      score += architecture.missingComponents.length * 5;
    }

    // Constraints add complexity
    if (goal.constraints.length > 3) {
      score += 10;
      factors.push({
        name: "Multiple Constraints",
        impact: "increases",
        score: 10,
        reason: `${goal.constraints.length} constraints to satisfy`
      });
    }

    // Normalize score
    score = Math.min(100, Math.max(0, score));

    // Determine level
    let level: ComplexityLevelType = ComplexityLevel.LOW;
    if (score >= 80) level = ComplexityLevel.EXTREME;
    else if (score >= 60) level = ComplexityLevel.HIGH;
    else if (score >= 40) level = ComplexityLevel.MEDIUM;
    else if (score >= 20) level = ComplexityLevel.LOW;
    else level = ComplexityLevel.TRIVIAL;

    return {
      overall: level,
      score,
      factors,
      breakdown: {
        codeComplexity: Math.min(100, score * 1.1),
        dependencyComplexity: Math.min(100, score * 0.9),
        integrationComplexity: Math.min(100, score * 1.0),
        deploymentComplexity: Math.min(100, score * 0.8),
      }
    };
  }

  // ==========================================================================
  // RISK ANALYSIS
  // ==========================================================================

  analyzeRisk(
    goal: GoalAnalysis,
    complexity: ComplexityEstimate,
    stack?: StackRecommendation
  ): RiskAnalysis {
    const risks: IdentifiedRisk[] = [];
    let totalRiskScore = 0;

    // Technical risks
    if (complexity.overall === ComplexityLevel.HIGH || complexity.overall === ComplexityLevel.EXTREME) {
      const risk: IdentifiedRisk = {
        id: randomUUID(),
        category: "technical",
        severity: RiskLevel.HIGH,
        description: "High complexity may lead to technical challenges",
        probability: 70,
        impact: 60,
        mitigation: "Break down into smaller, manageable phases"
      };
      risks.push(risk);
      totalRiskScore += 70;
    }

    // Dependency risks
    if (goal.requirements.some(r => r.toLowerCase().includes("integration"))) {
      const risk: IdentifiedRisk = {
        id: randomUUID(),
        category: "dependency",
        severity: RiskLevel.MEDIUM,
        description: "Third-party integration may have reliability issues",
        probability: 40,
        impact: 50,
        mitigation: "Implement fallback mechanisms and timeout handling"
      };
      risks.push(risk);
      totalRiskScore += 45;
    }

    // Timeline risks
    if (goal.objectives.length > 5) {
      const risk: IdentifiedRisk = {
        id: randomUUID(),
        category: "timeline",
        severity: RiskLevel.MEDIUM,
        description: "Multiple objectives may extend timeline",
        probability: 60,
        impact: 40,
        mitigation: "Prioritize objectives and plan for iterations"
      };
      risks.push(risk);
      totalRiskScore += 50;
    }

    // Security risks
    if (goal.constraints.some(c => c.toLowerCase().includes("security"))) {
      const risk: IdentifiedRisk = {
        id: randomUUID(),
        category: "security",
        severity: RiskLevel.HIGH,
        description: "Security requirements require careful implementation",
        probability: 30,
        impact: 80,
        mitigation: "Follow security best practices and conduct audits"
      };
      risks.push(risk);
      totalRiskScore += 55;
    }

    // Stack risks
    if (stack) {
      for (const alt of stack.alternatives) {
        const risk: IdentifiedRisk = {
          id: randomUUID(),
          category: "technical",
          severity: RiskLevel.LOW,
          description: `Alternative stack for ${alt.component}: ${alt.reason}`,
          probability: 20,
          impact: 30,
          mitigation: "Use recommended stack unless there are specific reasons not to"
        };
        risks.push(risk);
        totalRiskScore += 25;
      }
    }

    // Determine overall risk level
    let overallRisk: RiskLevelType = RiskLevel.LOW;
    const avgRisk = risks.length > 0 ? totalRiskScore / risks.length : 0;
    
    if (avgRisk >= 70) overallRisk = RiskLevel.CRITICAL;
    else if (avgRisk >= 50) overallRisk = RiskLevel.HIGH;
    else if (avgRisk >= 30) overallRisk = RiskLevel.MEDIUM;

    // Mitigation plan
    const mitigationPlan: MitigationStep[] = risks
      .filter(r => r.severity !== RiskLevel.LOW)
      .map(r => ({
        riskId: r.id,
        action: r.mitigation,
        priority: r.severity === RiskLevel.CRITICAL ? "immediate" as const : "important" as const
      }));

    this.emitEvent("risk_detected", { riskCount: risks.length, overallRisk });

    return {
      overallRisk,
      score: Math.min(100, avgRisk),
      risks,
      mitigationPlan
    };
  }

  // ==========================================================================
  // TIMELINE PREDICTION
  // ==========================================================================

  predictTimeline(
    phases: RoadmapPhase[],
    complexity: ComplexityEstimate,
    historicalData?: { avgMinutesPerComplexity: Record<ComplexityLevelType, number> }
  ): TimelinePrediction {
    const phaseDurations: PhaseDuration[] = [];
    const defaults = {
      [ComplexityLevel.TRIVIAL]: 30,
      [ComplexityLevel.LOW]: 60,
      [ComplexityLevel.MEDIUM]: 120,
      [ComplexityLevel.HIGH]: 240,
      [ComplexityLevel.EXTREME]: 480,
    };

    let totalMinutes = 0;
    const now = new Date();

    for (const phase of phases) {
      const complexityMultiplier = complexity.score / 50;
      let estimated = defaults[phase.complexity] || 120;
      
      // Adjust for actual task count
      estimated *= (1 + (phase.tasks.length - 3) * 0.1);
      
      // Adjust for complexity
      estimated *= complexityMultiplier;
      
      estimated = Math.round(estimated);
      totalMinutes += estimated;

      phaseDurations.push({
        phaseId: phase.id,
        phaseName: phase.name,
        estimatedMinutes: estimated,
      });
    }

    // Generate milestone dates
    const milestoneDates: MilestoneDate[] = [];
    let accumulatedMinutes = 0;

    for (const duration of phaseDurations) {
      milestoneDates.push({
        name: `${duration.phaseName} Start`,
        date: new Date(now.getTime() + accumulatedMinutes * 60 * 1000),
        type: "phase_start"
      });
      
      accumulatedMinutes += duration.estimatedMinutes;
      
      milestoneDates.push({
        name: `${duration.phaseName} Complete`,
        date: new Date(now.getTime() + accumulatedMinutes * 60 * 1000),
        type: "phase_end"
      });
    }

    const confidence = Math.max(40, 100 - complexity.score * 0.3);

    this.emitEvent("timeline_predicted", { totalMinutes, phaseCount: phases.length });

    return {
      totalDuration: totalMinutes,
      phaseDurations,
      milestoneDates,
      confidence,
      factors: [
        `Based on ${phases.length} phases`,
        `Complexity score: ${complexity.score}`,
        `Total estimated tasks: ${phases.reduce((acc, p) => acc + p.tasks.length, 0)}`
      ]
    };
  }

  // ==========================================================================
  // STACK RECOMMENDATION
  // ==========================================================================

  recommendStack(
    goal: GoalAnalysis,
    userPreferences?: Record<string, unknown>,
    projectContext?: { existingStack?: string[] }
  ): StackRecommendation {
    const recommendation: StackRecommendation = {
      reasoning: "",
      alternatives: [],
      compatibilityScore: 80
    };

    const goalLower = goal.goal.toLowerCase();

    // Frontend
    if (goalLower.includes("react")) {
      recommendation.frontend = "React 18";
    } else if (goalLower.includes("vue")) {
      recommendation.frontend = "Vue 3";
    } else if (goalLower.includes("angular")) {
      recommendation.frontend = "Angular 17";
    } else {
      recommendation.frontend = "React 18"; // Default
      recommendation.alternatives.push({
        component: "frontend",
        alternatives: ["React 18", "Vue 3", "Svelte"],
        reason: "React is the most popular choice"
      });
    }

    // Backend
    if (goalLower.includes("api") || goalLower.includes("node")) {
      recommendation.backend = "Express/Fastify";
    } else if (goalLower.includes("python") || goalLower.includes("ml") || goalLower.includes("ai")) {
      recommendation.backend = "FastAPI";
    } else if (goalLower.includes("java")) {
      recommendation.backend = "Spring Boot";
    } else {
      recommendation.backend = "Node.js/Express";
    }

    // Database
    if (goalLower.includes("mongodb") || goalLower.includes("nosql")) {
      recommendation.database = "MongoDB";
    } else if (goalLower.includes("postgresql") || goalLower.includes("postgres")) {
      recommendation.database = "PostgreSQL";
    } else if (goalLower.includes("mysql")) {
      recommendation.database = "MySQL";
    } else {
      recommendation.database = "PostgreSQL"; // Default
    }

    // Deployment
    if (goalLower.includes("serverless") || goalLower.includes("lambda")) {
      recommendation.deployment = "Vercel/AWS Lambda";
    } else if (goalLower.includes("docker") || goalLower.includes("container")) {
      recommendation.deployment = "Railway/Docker";
    } else {
      recommendation.deployment = "Vercel";
    }

    // Cache
    recommendation.cache = "Redis";
    recommendation.queue = "Bull/BullMQ";

    // Reasoning
    recommendation.reasoning = `Based on ${goal.objectives.length} objectives and ${goal.requirements.length} requirements`;

    this.emitEvent("stack_recommended", recommendation);

    return recommendation;
  }

  // ==========================================================================
  // ROADMAP GENERATION
  // ==========================================================================

  generateRoadmap(
    goal: string,
    context?: {
      repositoryUrl?: string;
      userPreferences?: Record<string, unknown>;
      projectId?: string;
    }
  ): Roadmap {
    const id = `roadmap-${randomUUID()}`;
    const goalAnalysis = this.analyzeGoal(goal, context);
    const complexity = this.estimateComplexity(goalAnalysis);
    const risk = this.analyzeRisk(goalAnalysis, complexity);
    const stack = this.recommendStack(goalAnalysis, context?.userPreferences);
    
    // Generate phases based on complexity
    const phases = this.generatePhases(goalAnalysis, complexity);
    const timeline = this.predictTimeline(phases, complexity);

    // Calculate scores
    const scores: MissionScores = {
      complexityScore: complexity.score,
      riskScore: risk.score,
      confidenceScore: Math.max(30, 100 - complexity.score * 0.5),
      readinessScore: this.calculateReadiness(complexity, risk, timeline)
    };

    // Build dependency graph
    const executionOrder = phases.map(p => p.id);

    const roadmap: Roadmap = {
      id,
      goal,
      analysis: {
        goal: goalAnalysis,
        architecture: {
          summary: "Architecture analysis pending repository scan",
          components: [],
          weaknesses: [],
          missingComponents: [],
          improvementOpportunities: [],
          technologyScore: 70
        },
        complexity,
        risk,
        timeline,
        stack
      },
      phases,
      executionOrder,
      scores,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.emitEvent("roadmap_generated", { roadmapId: id, phases: phases.length });

    return roadmap;
  }

  private generatePhases(goal: GoalAnalysis, complexity: ComplexityEstimate): RoadmapPhase[] {
    const phases: RoadmapPhase[] = [];
    
    // Discovery Phase (always)
    phases.push({
      id: "phase-1-discovery",
      name: "Discovery",
      description: "Understand requirements and setup environment",
      objectives: ["Analyze requirements", "Setup development environment"],
      tasks: [
        {
          id: "task-1-1",
          name: "Requirements Analysis",
          description: "Review and clarify all requirements",
          complexity: ComplexityLevel.LOW,
          estimatedMinutes: 30,
          dependencies: [],
          toolRequirements: []
        },
        {
          id: "task-1-2",
          name: "Environment Setup",
          description: "Setup development environment",
          complexity: ComplexityLevel.LOW,
          estimatedMinutes: 60,
          dependencies: ["task-1-1"],
          toolRequirements: ["code-editor", "terminal"]
        }
      ],
      dependencies: [],
      complexity: ComplexityLevel.LOW,
      estimatedMinutes: 90,
      approvalRequired: false
    });

    // Implementation Phase
    const implPhase: RoadmapPhase = {
      id: "phase-2-implementation",
      name: "Implementation",
      description: "Build the core functionality",
      objectives: goal.objectives,
      tasks: [],
      dependencies: ["phase-1-discovery"],
      complexity: complexity.overall,
      estimatedMinutes: complexity.score * 2,
      approvalRequired: goal.objectives.length > 3
    };

    // Generate tasks based on objectives
    goal.objectives.forEach((obj, i) => {
      implPhase.tasks.push({
        id: `task-2-${i + 1}`,
        name: obj,
        description: `Implement: ${obj}`,
        complexity: i < 2 ? ComplexityLevel.MEDIUM : ComplexityLevel.HIGH,
        estimatedMinutes: 60 + i * 30,
        dependencies: i > 0 ? [`task-2-${i}`] : [],
        toolRequirements: ["code-editor", "terminal"]
      });
    });

    phases.push(implPhase);

    // Testing Phase
    phases.push({
      id: "phase-3-testing",
      name: "Testing",
      description: "Test all functionality",
      objectives: ["Unit tests", "Integration tests", "E2E tests"],
      tasks: [
        {
          id: "task-3-1",
          name: "Write Unit Tests",
          description: "Create unit tests for core functionality",
          complexity: ComplexityLevel.MEDIUM,
          estimatedMinutes: 120,
          dependencies: ["phase-2-implementation"],
          toolRequirements: ["test-runner"]
        },
        {
          id: "task-3-2",
          name: "Integration Tests",
          description: "Test component integration",
          complexity: ComplexityLevel.MEDIUM,
          estimatedMinutes: 90,
          dependencies: ["task-3-1"],
          toolRequirements: ["test-runner"]
        }
      ],
      dependencies: ["phase-2-implementation"],
      complexity: ComplexityLevel.MEDIUM,
      estimatedMinutes: 210,
      approvalRequired: false
    });

    // Deployment Phase
    phases.push({
      id: "phase-4-deployment",
      name: "Deployment",
      description: "Deploy to target environment",
      objectives: ["Deploy application", "Verify deployment"],
      tasks: [
        {
          id: "task-4-1",
          name: "Build Artifacts",
          description: "Build deployment artifacts",
          complexity: ComplexityLevel.LOW,
          estimatedMinutes: 30,
          dependencies: ["phase-3-testing"],
          toolRequirements: ["deployment"]
        },
        {
          id: "task-4-2",
          name: "Deploy",
          description: "Deploy to target environment",
          complexity: ComplexityLevel.MEDIUM,
          estimatedMinutes: 60,
          dependencies: ["task-4-1"],
          toolRequirements: ["deployment"]
        }
      ],
      dependencies: ["phase-3-testing"],
      complexity: ComplexityLevel.MEDIUM,
      estimatedMinutes: 90,
      approvalRequired: true
    });

    return phases;
  }

  private calculateReadiness(
    complexity: ComplexityEstimate,
    risk: RiskAnalysis,
    timeline: TimelinePrediction
  ): Score {
    let readiness = 100;

    // Reduce for high complexity
    readiness -= (complexity.score - 50) * 0.5;

    // Reduce for high risk
    readiness -= risk.score * 0.3;

    // Reduce for low timeline confidence
    readiness -= (100 - timeline.confidence) * 0.2;

    return Math.max(0, Math.min(100, readiness));
  }

  // ==========================================================================
  // ADAPTIVE PLANNING
  // ==========================================================================

  replan(roadmap: Roadmap, failedTaskId: string, reason: string): Roadmap {
    const updated: Roadmap = {
      ...roadmap,
      phases: roadmap.phases.map(phase => {
        const failedTaskIndex = phase.tasks.findIndex(t => t.id === failedTaskId);
        if (failedTaskIndex >= 0) {
          // Add recovery task
          const recoveryTask = {
            id: `task-recovery-${randomUUID()}`,
            name: `Recovery: ${phase.tasks[failedTaskIndex].name}`,
            description: `Recover from failure: ${reason}`,
            complexity: ComplexityLevel.HIGH,
            estimatedMinutes: phase.tasks[failedTaskIndex].estimatedMinutes * 1.5,
            dependencies: [],
            toolRequirements: ["debugging", "code-editor"]
          };

          const updatedTasks = [...phase.tasks];
          updatedTasks.splice(failedTaskIndex + 1, 0, recoveryTask);

          return {
            ...phase,
            tasks: updatedTasks
          };
        }
        return phase;
      }),
      updatedAt: new Date(),
      version: roadmap.version + 1
    };

    // Recalculate timeline
    updated.analysis.timeline = this.predictTimeline(updated.phases, updated.analysis.complexity);

    this.emitEvent("roadmap_adapted", {
      roadmapId: roadmap.id,
      failedTaskId,
      newVersion: updated.version
    });

    return updated;
  }

  // ==========================================================================
  // LEARNING LOOP
  // ==========================================================================

  learnFromMission(
    missionId: string,
    results: {
      plannedDuration: number;
      actualDuration: number;
      plannedComplexity: ComplexityLevelType;
      actualComplexity: ComplexityLevelType;
      risksOccurred: string[];
      recoveriesSuccessful: boolean;
    }
  ): Record<string, unknown> {
    const lessons: Record<string, unknown> = {
      missionId,
      timestamp: new Date(),
      accuracy: {
        durationAccuracy: 100 - Math.abs(results.actualDuration - results.plannedDuration) / results.plannedDuration * 100,
        complexityAccuracy: results.plannedComplexity === results.actualComplexity ? 100 : 50,
      },
      learnings: [] as string[]
    };

    // Duration accuracy
    if (results.actualDuration > results.plannedDuration * 1.2) {
      (lessons.learnings as string[]).push("Underestimated duration - consider adding buffer");
    }

    // Complexity accuracy
    if (results.plannedComplexity !== results.actualComplexity) {
      const levelDiff: Record<string, number> = {
        TRIVIAL: 1,
        LOW: 2,
        MEDIUM: 3,
        HIGH: 4,
        EXTREME: 5
      };
      
      if (levelDiff[results.actualComplexity] > levelDiff[results.plannedComplexity]) {
        (lessons.learnings as string[]).push("Complexity was underestimated");
      }
    }

    // Risk analysis
    if (results.risksOccurred.length > 0) {
      (lessons.learnings as string[]).push(`Risks that occurred: ${results.risksOccurred.join(", ")}`);
    }

    // Recovery effectiveness
    if (results.recoveriesSuccessful) {
      (lessons.learnings as string[]).push("Recovery strategies were effective");
    }

    return lessons;
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  private emitEvent(type: ArchitectEventType, details: Record<string, unknown>): void {
    const event: ArchitectEvent = {
      id: randomUUID(),
      type,
      details,
      timestamp: new Date()
    };

    this.events.push(event);

    // Keep last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }

    logEvent({
      eventType: type,
      severity: "info",
      message: `Architect: ${type}`,
      details
    });
  }

  getEvents(): ArchitectEvent[] {
    return [...this.events];
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const architect = new Architect();
