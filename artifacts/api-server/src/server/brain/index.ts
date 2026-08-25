/**
 * DEVIL Brain - Central Intelligence Core
 * 
 * The brain that orchestrates all DEVIL agents intelligently.
 * - Mission Understanding
 * - Intent Analysis
 * - Agent Selection
 * - Workflow Planning
 * - Model Selection
 * - Reasoning
 * - Context Assembly
 * - Decision Making
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

// Operating Modes
export const OperatingMode = {
  GOD: "god",    // Strategic - high validation, high reasoning, high safety
  DEVIL: "devil", // Aggressive - fast execution, parallel workflows, reduced approvals
} as const;

export type OperatingModeType = typeof OperatingMode[keyof typeof OperatingMode];

// Supported Models
export const ModelProvider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  DEEPSEEK: "deepseek",
  // Future
  LOCAL: "local",
  QWEN: "qwen",
  LLAMA: "llama",
  MISTRAL: "mistral",
} as const;

export type ModelProviderType = typeof ModelProvider[keyof typeof ModelProvider];

// Agent Types
export const AgentType = {
  ARCHITECT: "architect",
  CODING: "coding",
  GITHUB: "github",
  DEPLOYMENT: "deployment",
  MEMORY: "memory",
  IMAGE: "image",
  VIDEO: "video",
  ORCHESTRATOR: "orchestrator",
} as const;

export type AgentTypeType = typeof AgentType[keyof typeof AgentType];

// Task Domains
export const TaskDomain = {
  ARCHITECTURE: "architecture",
  CODING: "coding",
  DEPLOYMENT: "deployment",
  RESEARCH: "research",
  DESIGN: "design",
  IMAGE: "image",
  VIDEO: "video",
  ANALYSIS: "analysis",
  PLANNING: "planning",
  REASONING: "reasoning",
} as const;

export type TaskDomainType = typeof TaskDomain[keyof typeof TaskDomain];

// Complexity Levels
export const ComplexityLevel = {
  TRIVIAL: "trivial",      // Simple, well-defined tasks
  LOW: "low",             // Standard tasks with clear requirements
  MEDIUM: "medium",       // Tasks requiring some planning
  HIGH: "high",           // Complex tasks with multiple components
  CRITICAL: "critical",   // Mission-critical tasks requiring extensive planning
} as const;

export type ComplexityLevelType = typeof ComplexityLevel[keyof typeof ComplexityLevel];

// Urgency Levels
export const UrgencyLevel = {
  LOW: "low",             // No time pressure
  NORMAL: "normal",       // Standard priority
  HIGH: "high",           // Time-sensitive
  CRITICAL: "critical",   // Immediate action required
} as const;

export type UrgencyLevelType = typeof UrgencyLevel[keyof typeof UrgencyLevel];

// Risk Levels
export const RiskLevel = {
  LOW: "low",             // Minimal risk
  MEDIUM: "medium",       // Moderate risk
  HIGH: "high",           // Significant risk
  CRITICAL: "critical",   // Potentially destructive
} as const;

export type RiskLevelType = typeof RiskLevel[keyof typeof RiskLevel];

// ============================================================================
// MISSION ANALYSIS
// ============================================================================

export interface MissionAnalysis {
  id: string;
  originalGoal: string;
  goal: string;
  domain: TaskDomainType;
  complexity: ComplexityLevelType;
  urgency: UrgencyLevelType;
  risk: RiskLevelType;
  requiredAgents: AgentTypeType[];
  estimatedDuration: number; // minutes
  successCriteria: string[];
  potentialChallenges: string[];
  recommendedMode: OperatingModeType;
  createdAt: Date;
}

export interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  impliedNeeds: string[];
  explicitRequirements: string[];
  constraints: string[];
  successDefinition: string;
}

// ============================================================================
// MODEL ROUTING
// ============================================================================

export interface ModelConfig {
  provider: ModelProviderType;
  model: string;
  maxTokens: number;
  temperature: number;
  reasoning: boolean;
}

export interface ModelSelection {
  taskType: TaskDomainType;
  recommendedModel: ModelConfig;
  alternatives: ModelConfig[];
  reasoning: string;
}

// ============================================================================
// WORKFLOW PLANNING
// ============================================================================

export interface WorkflowStep {
  order: number;
  agent: AgentTypeType;
  task: string;
  dependencies: string[]; // IDs of steps this depends on
  parallel: boolean;      // Can run in parallel with other steps
  estimatedDuration: number;
  requiredContext: string[];
}

export interface WorkflowPlan {
  id: string;
  missionId: string;
  steps: WorkflowStep[];
  estimatedTotalDuration: number;
  parallelOpportunities: string[][];
  criticalPath: string[];
  recommendedMode: OperatingModeType;
  approvalPoints: string[]; // Steps requiring approval
}

// ============================================================================
// REASONING
// ============================================================================

export interface ReasoningStep {
  id: string;
  type: "decomposition" | "analysis" | "synthesis" | "evaluation" | "decision";
  input: string;
  reasoning: string;
  output: string;
  confidence: number;
}

export interface ReasoningTrace {
  id: string;
  missionId: string;
  steps: ReasoningStep[];
  finalDecision: string;
  confidence: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface ContextSource {
  type: "mission" | "user" | "project" | "repository" | "brand" | "memory" | "history";
  id: string;
  relevance: number; // 0-1
  content: string;
}

export interface ContextAssembly {
  missionId: string;
  sources: ContextSource[];
  totalTokens: number;
  maxTokens: number;
  optimized: boolean;
  context: string;
}

// ============================================================================
// DECISION
// ============================================================================

export interface Decision {
  id: string;
  missionId: string;
  type: "agent_selection" | "model_selection" | "workflow_decision" | "approval_required" | "retry_decision" | "recovery_decision";
  options: string[];
  selectedOption: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface DecisionOutcome {
  decisionId: string;
  success: boolean;
  actualOutcome: string;
  lessonsLearned?: string;
}

// ============================================================================
// INTELLIGENCE MEMORY
// ============================================================================

export interface PerformanceRecord {
  agentType: AgentTypeType;
  model: string;
  taskDomain: TaskDomainType;
  successRate: number;
  averageDuration: number;
  failurePatterns: string[];
  optimizationSuggestions: string[];
}

export interface PatternRecord {
  pattern: string;
  context: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
}

// ============================================================================
// DEVIL BRAIN
// ============================================================================

export class DevilBrain {
  private mode: OperatingModeType = OperatingMode.DEVIL;
  private modelConfigs: Map<ModelProviderType, ModelConfig> = new Map();
  private decisions: Map<string, Decision> = new Map();
  private performanceRecords: Map<string, PerformanceRecord> = new Map();
  private patterns: Map<string, PatternRecord> = new Map();

  constructor() {
    this.initializeModelConfigs();
    this.log("DevilBrain initialized");
  }

  private initializeModelConfigs() {
    // OpenAI
    this.modelConfigs.set(ModelProvider.OPENAI, {
      provider: ModelProvider.OPENAI,
      model: "gpt-4o",
      maxTokens: 128000,
      temperature: 0.7,
      reasoning: false,
    });

    // Anthropic
    this.modelConfigs.set(ModelProvider.ANTHROPIC, {
      provider: ModelProvider.ANTHROPIC,
      model: "claude-sonnet-4-20250514",
      maxTokens: 200000,
      temperature: 0.7,
      reasoning: true,
    });

    // Google
    this.modelConfigs.set(ModelProvider.GOOGLE, {
      provider: ModelProvider.GOOGLE,
      model: "gemini-1.5-pro",
      maxTokens: 1000000,
      temperature: 0.7,
      reasoning: true,
    });

    // DeepSeek
    this.modelConfigs.set(ModelProvider.DEEPSEEK, {
      provider: ModelProvider.DEEPSEEK,
      model: "deepseek-chat",
      maxTokens: 64000,
      temperature: 0.7,
      reasoning: true,
    });
  }

  // ==========================================================================
  // MISSION ANALYSIS
  // ==========================================================================

  analyzeMission(goal: string, options?: {
    urgency?: UrgencyLevelType;
    risk?: RiskLevelType;
  }): MissionAnalysis {
    const id = `mission-${randomUUID().slice(0, 8)}`;
    
    // Analyze goal
    const intentAnalysis = this.analyzeIntent(goal);
    
    // Determine domain
    const domain = this.determineDomain(goal);
    
    // Determine complexity
    const complexity = this.determineComplexity(goal, domain);
    
    // Determine urgency
    const urgency = options?.urgency || this.determineUrgency(goal);
    
    // Determine risk
    const risk = options?.risk || this.determineRisk(goal, complexity);
    
    // Determine required agents
    const requiredAgents = this.selectAgents(domain, complexity);
    
    // Estimate duration
    const estimatedDuration = this.estimateDuration(domain, complexity);
    
    // Determine mode
    const recommendedMode = this.determineMode(complexity, risk, urgency);
    
    const analysis: MissionAnalysis = {
      id,
      originalGoal: goal,
      goal: intentAnalysis.primaryIntent,
      domain,
      complexity,
      urgency,
      risk,
      requiredAgents,
      estimatedDuration,
      successCriteria: intentAnalysis.explicitRequirements,
      potentialChallenges: this.identifyChallenges(domain, complexity),
      recommendedMode,
      createdAt: new Date(),
    };

    this.log(`Mission analyzed: ${id} - Domain: ${domain}, Complexity: ${complexity}`);
    return analysis;
  }

  private analyzeIntent(goal: string): IntentAnalysis {
    const lowerGoal = goal.toLowerCase();
    
    // Extract primary intent
    let primaryIntent = goal;
    if (lowerGoal.includes("build")) primaryIntent = `Build: ${goal}`;
    else if (lowerGoal.includes("create")) primaryIntent = `Create: ${goal}`;
    else if (lowerGoal.includes("analyze")) primaryIntent = `Analyze: ${goal}`;
    else if (lowerGoal.includes("deploy")) primaryIntent = `Deploy: ${goal}`;
    else if (lowerGoal.includes("design")) primaryIntent = `Design: ${goal}`;
    else if (lowerGoal.includes("generate")) primaryIntent = `Generate: ${goal}`;
    else if (lowerGoal.includes("test")) primaryIntent = `Test: ${goal}`;
    
    // Extract implied needs
    const impliedNeeds: string[] = [];
    if (lowerGoal.includes("startup") || lowerGoal.includes("saas")) impliedNeeds.push("Full stack development");
    if (lowerGoal.includes("api")) impliedNeeds.push("Backend development");
    if (lowerGoal.includes("frontend") || lowerGoal.includes("ui")) impliedNeeds.push("Frontend development");
    if (lowerGoal.includes("database")) impliedNeeds.push("Database setup");
    if (lowerGoal.includes("deploy") || lowerGoal.includes("host")) impliedNeeds.push("Deployment");
    if (lowerGoal.includes("logo") || lowerGoal.includes("brand")) impliedNeeds.push("Branding assets");
    
    return {
      primaryIntent,
      secondaryIntents: [],
      impliedNeeds,
      explicitRequirements: [goal],
      constraints: [],
      successDefinition: `Complete: ${goal}`,
    };
  }

  private determineDomain(goal: string): TaskDomainType {
    const lowerGoal = goal.toLowerCase();
    
    if (lowerGoal.includes("architecture") || lowerGoal.includes("design") || lowerGoal.includes("plan"))
      return TaskDomain.ARCHITECTURE;
    if (lowerGoal.includes("build") || lowerGoal.includes("code") || lowerGoal.includes("implement") || lowerGoal.includes("develop"))
      return TaskDomain.CODING;
    if (lowerGoal.includes("deploy") || lowerGoal.includes("host") || lowerGoal.includes("release"))
      return TaskDomain.DEPLOYMENT;
    if (lowerGoal.includes("analyze") || lowerGoal.includes("review"))
      return TaskDomain.ANALYSIS;
    if (lowerGoal.includes("logo") || lowerGoal.includes("image") || lowerGoal.includes("design"))
      return TaskDomain.DESIGN;
    if (lowerGoal.includes("video") || lowerGoal.includes("commercial"))
      return TaskDomain.VIDEO;
    return TaskDomain.PLANNING;
  }

  private determineComplexity(goal: string, domain: TaskDomainType): ComplexityLevelType {
    const lowerGoal = goal.toLowerCase();
    
    // Keyword-based complexity
    let complexity = ComplexityLevel.MEDIUM;
    
    if (lowerGoal.includes("simple") || lowerGoal.includes("basic") || lowerGoal.includes("small"))
      complexity = ComplexityLevel.LOW;
    if (lowerGoal.includes("complex") || lowerGoal.includes("enterprise") || lowerGoal.includes("large"))
      complexity = ComplexityLevel.HIGH;
    if (lowerGoal.includes("critical") || lowerGoal.includes("mission") || lowerGoal.includes("production"))
      complexity = ComplexityLevel.CRITICAL;
    
    // Domain-specific adjustments
    if (domain === TaskDomain.CODING) {
      if (lowerGoal.includes("full stack") || lowerGoal.includes("startup") || lowerGoal.includes("saas"))
        complexity = ComplexityLevel.HIGH;
    }
    
    return complexity;
  }

  private determineUrgency(goal: string): UrgencyLevelType {
    const lowerGoal = goal.toLowerCase();
    
    if (lowerGoal.includes("asap") || lowerGoal.includes("urgent") || lowerGoal.includes("immediately"))
      return UrgencyLevel.CRITICAL;
    if (lowerGoal.includes("quick") || lowerGoal.includes("fast"))
      return UrgencyLevel.HIGH;
    if (lowerGoal.includes("eventually") || lowerGoal.includes("when possible"))
      return UrgencyLevel.LOW;
    
    return UrgencyLevel.NORMAL;
  }

  private determineRisk(goal: string, complexity: ComplexityLevelType): RiskLevelType {
    const lowerGoal = goal.toLowerCase();
    
    // High risk indicators
    if (lowerGoal.includes("delete") || lowerGoal.includes("remove") || lowerGoal.includes("drop"))
      return RiskLevel.HIGH;
    if (lowerGoal.includes("production") || lowerGoal.includes("live"))
      return RiskLevel.HIGH;
    if (lowerGoal.includes("database") || lowerGoal.includes("migration"))
      return RiskLevel.MEDIUM;
    
    // Risk based on complexity
    if (complexity === ComplexityLevel.CRITICAL) return RiskLevel.CRITICAL;
    if (complexity === ComplexityLevel.HIGH) return RiskLevel.HIGH;
    if (complexity === ComplexityLevel.LOW) return RiskLevel.LOW;
    
    return RiskLevel.MEDIUM;
  }

  private selectAgents(domain: TaskDomainType, complexity: ComplexityLevelType): AgentTypeType[] {
    const agents: AgentTypeType[] = [AgentType.ARCHITECT];
    
    switch (domain) {
      case TaskDomain.CODING:
        agents.push(AgentType.CODING);
        agents.push(AgentType.GITHUB);
        break;
      case TaskDomain.DEPLOYMENT:
        agents.push(AgentType.DEPLOYMENT);
        agents.push(AgentType.GITHUB);
        break;
      case TaskDomain.DESIGN:
        agents.push(AgentType.IMAGE);
        break;
      case TaskDomain.VIDEO:
        agents.push(AgentType.VIDEO);
        agents.push(AgentType.IMAGE);
        break;
      case TaskDomain.ANALYSIS:
        agents.push(AgentType.MEMORY);
        break;
      case TaskDomain.ARCHITECTURE:
        agents.push(AgentType.CODING);
        break;
    }
    
    // Add orchestration for complex tasks
    if (complexity === ComplexityLevel.HIGH || complexity === ComplexityLevel.CRITICAL) {
      agents.push(AgentType.ORCHESTRATOR);
    }
    
    return agents;
  }

  private estimateDuration(domain: TaskDomainType, complexity: ComplexityLevelType): number {
    const baseDurations: Record<TaskDomainType, number> = {
      [TaskDomain.ARCHITECTURE]: 15,
      [TaskDomain.CODING]: 30,
      [TaskDomain.DEPLOYMENT]: 20,
      [TaskDomain.RESEARCH]: 10,
      [TaskDomain.DESIGN]: 15,
      [TaskDomain.IMAGE]: 10,
      [TaskDomain.VIDEO]: 20,
      [TaskDomain.ANALYSIS]: 10,
      [TaskDomain.PLANNING]: 15,
      [TaskDomain.REASONING]: 5,
    };
    
    const complexityMultipliers: Record<ComplexityLevelType, number> = {
      [ComplexityLevel.TRIVIAL]: 0.5,
      [ComplexityLevel.LOW]: 0.75,
      [ComplexityLevel.MEDIUM]: 1.0,
      [ComplexityLevel.HIGH]: 1.5,
      [ComplexityLevel.CRITICAL]: 2.0,
    };
    
    return Math.round(baseDurations[domain] * complexityMultipliers[complexity]);
  }

  private determineMode(complexity: ComplexityLevelType, risk: RiskLevelType, urgency: UrgencyLevelType): OperatingModeType {
    // GOD mode for high risk/critical complexity
    if (risk === RiskLevel.CRITICAL || complexity === ComplexityLevel.CRITICAL)
      return OperatingMode.GOD;
    
    // GOD mode for production deployments
    if (risk === RiskLevel.HIGH)
      return OperatingMode.GOD;
    
    // DEVIL mode for fast execution when urgent
    if (urgency === UrgencyLevel.CRITICAL)
      return OperatingMode.DEVIL;
    
    // Default based on complexity
    return complexity >= ComplexityLevel.HIGH ? OperatingMode.GOD : OperatingMode.DEVIL;
  }

  private identifyChallenges(domain: TaskDomainType, complexity: ComplexityLevelType): string[] {
    const challenges: string[] = [];
    
    if (complexity >= ComplexityLevel.HIGH) {
      challenges.push("Task decomposition required");
      challenges.push("Multiple agent coordination");
    }
    
    if (domain === TaskDomain.CODING) {
      challenges.push("Code quality maintenance");
      challenges.push("Testing coverage");
    }
    
    if (domain === TaskDomain.DEPLOYMENT) {
      challenges.push("Environment configuration");
      challenges.push("Rollback planning");
    }
    
    return challenges;
  }

  // ==========================================================================
  // MODEL ROUTING
  // ==========================================================================

  selectModel(taskType: TaskDomainType, context?: {
    reasoning?: boolean;
    speed?: boolean;
    cost?: boolean;
  }): ModelSelection {
    let recommendedProvider = ModelProvider.ANTHROPIC;
    let reasoning = "Claude excels at complex reasoning and code generation tasks.";
    
    switch (taskType) {
      case TaskDomain.ARCHITECTURE:
        recommendedProvider = ModelProvider.ANTHROPIC;
        reasoning = "Claude provides detailed architectural analysis and planning.";
        break;
      case TaskDomain.CODING:
        if (context?.reasoning) {
          recommendedProvider = ModelProvider.ANTHROPIC;
          reasoning = "Claude has strong code reasoning capabilities.";
        } else {
          recommendedProvider = ModelProvider.OPENAI;
          reasoning = "GPT-4o provides fast and accurate code generation.";
        }
        break;
      case TaskDomain.ANALYSIS:
        recommendedProvider = ModelProvider.GOOGLE;
        reasoning = "Gemini has extensive context for analysis tasks.";
        break;
      case TaskDomain.DESIGN:
        recommendedProvider = ModelProvider.OPENAI;
        reasoning = "DALL-E integration for design tasks.";
        break;
      case TaskDomain.REASONING:
        recommendedProvider = ModelProvider.ANTHROPIC;
        reasoning = "Claude excels at chain-of-thought reasoning.";
        break;
      default:
        recommendedProvider = ModelProvider.OPENAI;
        reasoning = "GPT-4o as reliable default model.";
    }
    
    const recommendedModel = this.modelConfigs.get(recommendedProvider)!;
    const alternatives: ModelConfig[] = [];
    
    for (const [provider, config] of this.modelConfigs) {
      if (provider !== recommendedProvider) {
        alternatives.push(config);
      }
    }
    
    return {
      taskType,
      recommendedModel,
      alternatives,
      reasoning,
    };
  }

  // ==========================================================================
  // WORKFLOW PLANNING
  // ==========================================================================

  planWorkflow(mission: MissionAnalysis): WorkflowPlan {
    const plan: WorkflowPlan = {
      id: `workflow-${randomUUID().slice(0, 8)}`,
      missionId: mission.id,
      steps: [],
      estimatedTotalDuration: 0,
      parallelOpportunities: [],
      criticalPath: [],
      recommendedMode: mission.recommendedMode,
      approvalPoints: [],
    };
    
    let stepOrder = 1;
    
    // Always start with architect for complex missions
    if (mission.complexity >= ComplexityLevel.HIGH) {
      plan.steps.push({
        order: stepOrder++,
        agent: AgentType.ARCHITECT,
        task: "Create detailed execution plan",
        dependencies: [],
        parallel: false,
        estimatedDuration: 10,
        requiredContext: ["mission_analysis"],
      });
    }
    
    // Add agent steps based on required agents
    for (const agent of mission.requiredAgents) {
      if (agent === AgentType.ARCHITECT) continue; // Already added
      
      const step = this.createAgentStep(agent, stepOrder++, mission.domain);
      plan.steps.push(step);
      
      // Add approval point for high-risk agents
      if (agent === AgentType.DEPLOYMENT && mission.risk >= RiskLevel.HIGH) {
        plan.approvalPoints.push(`step-${stepOrder - 1}`);
      }
    }
    
    // Calculate totals
    plan.estimatedTotalDuration = plan.steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
    
    // Identify parallel opportunities
    plan.parallelOpportunities = this.identifyParallelOpportunities(plan.steps);
    
    // Identify critical path
    plan.criticalPath = this.identifyCriticalPath(plan.steps);
    
    return plan;
  }

  private createAgentStep(agent: AgentTypeType, order: number, domain: TaskDomainType): WorkflowStep {
    const stepConfigs: Record<AgentTypeType, { task: string; duration: number }> = {
      [AgentType.ARCHITECT]: { task: "Design architecture", duration: 15 },
      [AgentType.CODING]: { task: "Implement code", duration: 30 },
      [AgentType.GITHUB]: { task: "Manage repository", duration: 10 },
      [AgentType.DEPLOYMENT]: { task: "Deploy application", duration: 20 },
      [AgentType.MEMORY]: { task: "Store memories", duration: 5 },
      [AgentType.IMAGE]: { task: "Generate images", duration: 10 },
      [AgentType.VIDEO]: { task: "Generate videos", duration: 15 },
      [AgentType.ORCHESTRATOR]: { task: "Coordinate agents", duration: 10 },
    };
    
    return {
      order,
      agent,
      task: stepConfigs[agent].task,
      dependencies: [],
      parallel: false,
      estimatedDuration: stepConfigs[agent].duration,
      requiredContext: [],
    };
  }

  private identifyParallelOpportunities(steps: WorkflowStep[]): string[][] {
    const opportunities: string[][] = [];
    
    // Find steps that can run in parallel
    const codingSteps = steps.filter(s => s.agent === AgentType.CODING);
    const imageSteps = steps.filter(s => s.agent === AgentType.IMAGE);
    
    if (codingSteps.length > 0 && imageSteps.length > 0) {
      opportunities.push(codingSteps.map(s => `step-${s.order}`));
      opportunities.push(imageSteps.map(s => `step-${s.order}`));
    }
    
    return opportunities;
  }

  private identifyCriticalPath(steps: WorkflowStep[]): string[] {
    // Simple critical path: longest duration chain
    const sortedSteps = [...steps].sort((a, b) => b.estimatedDuration - a.estimatedDuration);
    return sortedSteps.slice(0, 3).map(s => `step-${s.order}`);
  }

  // ==========================================================================
  // REASONING
  // ==========================================================================

  reason(mission: MissionAnalysis, goal: string): ReasoningTrace {
    const trace: ReasoningTrace = {
      id: `reasoning-${randomUUID().slice(0, 8)}`,
      missionId: mission.id,
      steps: [],
      finalDecision: "",
      confidence: 0,
    };
    
    // Step 1: Decomposition
    trace.steps.push({
      id: `step-${trace.steps.length + 1}`,
      type: "decomposition",
      input: goal,
      reasoning: "Breaking down the mission into core components",
      output: `Identified domain: ${mission.domain}, Complexity: ${mission.complexity}`,
      confidence: 0.9,
    });
    
    // Step 2: Analysis
    trace.steps.push({
      id: `step-${trace.steps.length + 1}`,
      type: "analysis",
      input: `Domain: ${mission.domain}`,
      reasoning: "Analyzing task requirements and constraints",
      output: `Required agents: ${mission.requiredAgents.join(", ")}`,
      confidence: 0.85,
    });
    
    // Step 3: Synthesis
    trace.steps.push({
      id: `step-${trace.steps.length + 1}`,
      type: "synthesis",
      input: "Agent requirements",
      reasoning: "Synthesizing execution strategy",
      output: `Estimated duration: ${mission.estimatedDuration} minutes`,
      confidence: 0.8,
    });
    
    // Step 4: Evaluation
    trace.steps.push({
      id: `step-${trace.steps.length + 1}`,
      type: "evaluation",
      input: "Strategy evaluation",
      reasoning: "Evaluating risks and success factors",
      output: `Risk level: ${mission.risk}, Urgency: ${mission.urgency}`,
      confidence: 0.85,
    });
    
    // Step 5: Decision
    const modelSelection = this.selectModel(mission.domain);
    trace.steps.push({
      id: `step-${trace.steps.length + 1}`,
      type: "decision",
      input: "Model selection",
      reasoning: modelSelection.reasoning,
      output: `Recommended model: ${modelSelection.recommendedModel.model}`,
      confidence: 0.9,
    });
    
    trace.finalDecision = `Execute with ${mission.recommendedMode} mode using ${modelSelection.recommendedModel.model}`;
    trace.confidence = trace.steps.reduce((sum, s) => sum + s.confidence, 0) / trace.steps.length;
    
    return trace;
  }

  // ==========================================================================
  // CONTEXT ASSEMBLY
  // ==========================================================================

  buildContext(missionId: string, sources: ContextSource[], maxTokens: number = 128000): ContextAssembly {
    let totalTokens = 0;
    let context = "";
    
    // Sort sources by relevance
    const sortedSources = [...sources].sort((a, b) => b.relevance - a.relevance);
    
    for (const source of sortedSources) {
      const sourceTokens = Math.ceil(source.content.length / 4);
      
      if (totalTokens + sourceTokens <= maxTokens) {
        context += `\n\n## ${source.type.toUpperCase()}: ${source.id}\n${source.content}`;
        totalTokens += sourceTokens;
      }
    }
    
    return {
      missionId,
      sources: sortedSources,
      totalTokens,
      maxTokens,
      optimized: totalTokens < maxTokens,
      context,
    };
  }

  // ==========================================================================
  // DECISION MAKING
  // ==========================================================================

  makeDecision(
    missionId: string,
    type: Decision["type"],
    options: string[],
    reasoning: string
  ): Decision {
    const id = `decision-${randomUUID().slice(0, 8)}`;
    
    // Simple selection: pick first option by default
    const selectedOption = options[0] || "";
    
    const decision: Decision = {
      id,
      missionId,
      type,
      options,
      selectedOption,
      reasoning,
      confidence: 0.8,
      timestamp: new Date(),
    };
    
    this.decisions.set(id, decision);
    
    // Store outcome for learning
    this.recordDecision(decision);
    
    return decision;
  }

  private recordDecision(decision: Decision) {
    // Store pattern for learning
    const patternKey = `${decision.type}:${decision.selectedOption}`;
    let pattern = this.patterns.get(patternKey);
    
    if (!pattern) {
      pattern = {
        pattern: patternKey,
        context: decision.reasoning,
        successRate: 1.0,
        usageCount: 0,
        lastUsed: new Date(),
      };
    }
    
    pattern.usageCount++;
    pattern.lastUsed = new Date();
    this.patterns.set(patternKey, pattern);
  }

  // ==========================================================================
  // MODE MANAGEMENT
  // ==========================================================================

  setMode(mode: OperatingModeType) {
    this.mode = mode;
    this.log(`Operating mode set to: ${mode}`);
  }

  getMode(): OperatingModeType {
    return this.mode;
  }

  getModeCharacteristics(): Record<string, unknown> {
    if (this.mode === OperatingMode.GOD) {
      return {
        mode: OperatingMode.GOD,
        validation: "high",
        reasoning: "high",
        safety: "high",
        approvals: "all",
        autonomy: "low",
        focus: "maximum reliability",
      };
    } else {
      return {
        mode: OperatingMode.DEVIL,
        validation: "standard",
        reasoning: "normal",
        safety: "standard",
        approvals: "critical only",
        autonomy: "high",
        focus: "maximum speed",
      };
    }
  }

  // ==========================================================================
  // INTELLIGENCE MEMORY
  // ==========================================================================

  recordPerformance(agentType: AgentTypeType, model: string, taskDomain: TaskDomainType, success: boolean) {
    const key = `${agentType}:${model}:${taskDomain}`;
    let record = this.performanceRecords.get(key);
    
    if (!record) {
      record = {
        agentType,
        model,
        taskDomain,
        successRate: success ? 1.0 : 0.0,
        averageDuration: 0,
        failurePatterns: [],
        optimizationSuggestions: [],
      };
      this.performanceRecords.set(key, record);
    } else {
      // Update success rate
      record.successRate = (record.successRate + (success ? 1 : 0)) / 2;
    }
  }

  getRecommendations(agentType: AgentTypeType, taskDomain: TaskDomainType): string[] {
    const recommendations: string[] = [];
    
    for (const [key, record] of this.performanceRecords) {
      if (record.agentType === agentType && record.taskDomain === taskDomain) {
        if (record.successRate > 0.8) {
          recommendations.push(`Use ${record.model} for ${taskDomain} tasks (${Math.round(record.successRate * 100)}% success rate)`);
        }
        if (record.optimizationSuggestions.length > 0) {
          recommendations.push(...record.optimizationSuggestions);
        }
      }
    }
    
    return recommendations;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  getDecisions(missionId?: string): Decision[] {
    const allDecisions = Array.from(this.decisions.values());
    if (missionId) {
      return allDecisions.filter(d => d.missionId === missionId);
    }
    return allDecisions;
  }

  getModelConfigs(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  private log(message: string) {
    logEvent({
      eventType: "devil_brain",
      severity: "info",
      message,
      details: { mode: this.mode },
    });
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const devilBrain = new DevilBrain();
