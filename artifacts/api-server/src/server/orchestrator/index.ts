/**
 * DEVIL Orchestrator - Multi-Agent Coordination System
 * 
 * Central orchestrator for coordinating all DEVIL agents.
 * - Agent Registry
 * - Mission Router
 * - Task Dispatcher
 * - Dependency Coordinator
 * - Agent Communication Bus
 * - Workflow Engine
 */

import { logEvent } from "../control-plane/eventLog";
import { randomUUID } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

// Agent Types
export const AgentType = {
  ARCHITECT: "architect",
  EXECUTOR: "executor",
  CODING: "coding",
  GITHUB: "github",
  DEPLOYMENT: "deployment",
  IMAGE_STUDIO: "image_studio",
  VIDEO_STUDIO: "video_studio",
  RESEARCH: "research",
  CUSTOM_LLM: "custom_llm",
} as const;

export type AgentTypeType = typeof AgentType[keyof typeof AgentType];

// Agent States
export const AgentState = {
  ONLINE: "ONLINE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
  FAILED: "FAILED",
  RECOVERING: "RECOVERING",
} as const;

export type AgentStateType = typeof AgentState[keyof typeof AgentState];

// Task States
export const TaskState = {
  QUEUED: "QUEUED",
  ASSIGNED: "ASSIGNED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
} as const;

export type TaskStateType = typeof TaskState[keyof typeof TaskState];

// Orchestration Modes
export const OrchestrationMode = {
  GOD: "GOD",     // Strategic, conservative, validation-heavy
  DEVIL: "DEVIL", // Aggressive, fast, parallel, maximum autonomy
} as const;

export type OrchestrationModeType = typeof OrchestrationMode[keyof typeof OrchestrationMode];

// Workflow Types
export const WorkflowType = {
  SEQUENTIAL: "SEQUENTIAL",
  PARALLEL: "PARALLEL",
  CONDITIONAL: "CONDITIONAL",
} as const;

export type WorkflowTypeType = typeof WorkflowType[keyof typeof WorkflowType];

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export interface AgentCapabilities {
  canPlan: boolean;
  canCode: boolean;
  canDeploy: boolean;
  canAnalyze: boolean;
  canResearch: boolean;
  canGenerateImages: boolean;
  canGenerateVideos: boolean;
  supportedLanguages?: string[];
  supportedFrameworks?: string[];
}

export interface Agent {
  id: string;
  type: AgentTypeType;
  name: string;
  state: AgentStateType;
  capabilities: AgentCapabilities;
  health: number; // 0-100
  load: number; // 0-100 (current workload)
  queueDepth: number;
  version: string;
  registeredAt: Date;
  lastHeartbeat?: Date;
  currentTask?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRegistration {
  type: AgentTypeType;
  name: string;
  capabilities: AgentCapabilities;
  version?: string;
}

// ============================================================================
// MISSION
// ============================================================================

export interface OrchestratedMission {
  id: string;
  userId?: string;
  goal: string;
  roadmapId?: string;
  mode: OrchestrationModeType;
  state: MissionStateType;
  assignedAgents: string[];
  tasks: OrchestratedTask[];
  workflow: WorkflowDefinition;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  error?: string;
}

export const MissionState = {
  PENDING: "PENDING",
  PLANNING: "PLANNING",
  ASSIGNING: "ASSIGNING",
  EXECUTING: "EXECUTING",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type MissionStateType = typeof MissionState[keyof typeof MissionState];

// ============================================================================
// TASKS
// ============================================================================

export interface OrchestratedTask {
  id: string;
  missionId: string;
  name: string;
  description: string;
  type: AgentTypeType;
  assignedAgent?: string;
  state: TaskStateType;
  dependencies: string[];
  priority: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// WORKFLOW
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  type: WorkflowTypeType;
  steps: WorkflowStep[];
  parallelGroups?: string[][]; // Task IDs that can run in parallel
  conditions?: WorkflowCondition[];
}

export interface WorkflowStep {
  id: string;
  taskId: string;
  dependsOn: string[];
  agentType: AgentTypeType;
  parallelWith?: string[];
}

export interface WorkflowCondition {
  id: string;
  taskId: string;
  expression: string;
  trueBranch: string[];
  falseBranch: string[];
}

// ============================================================================
// EVENTS
// ============================================================================

export type OrchestratorEventType =
  | "orchestrator_started"
  | "agent_registered"
  | "agent_unregistered"
  | "agent_state_changed"
  | "mission_started"
  | "mission_paused"
  | "mission_resumed"
  | "mission_completed"
  | "mission_failed"
  | "task_assigned"
  | "task_started"
  | "task_completed"
  | "task_failed"
  | "task_retried"
  | "workflow_started"
  | "workflow_completed"
  | "load_balanced";

export interface OrchestratorEvent {
  id: string;
  type: OrchestratorEventType;
  agentId?: string;
  missionId?: string;
  taskId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class Orchestrator {
  private agents: Map<string, Agent> = new Map();
  private missions: Map<string, OrchestratedMission> = new Map();
  private tasks: Map<string, OrchestratedTask> = new Map();
  private events: OrchestratorEvent[] = [];
  private mode: OrchestrationModeType = OrchestrationMode.DEVIL;
  
  // Configuration by mode
  private readonly modeConfig = {
    [OrchestrationMode.GOD]: {
      maxRetries: 3,
      requireApprovalForDeploy: true,
      requireApprovalForPR: true,
      validationLevel: "strict",
      parallelExecution: false,
      autoRecovery: false,
    },
    [OrchestrationMode.DEVIL]: {
      maxRetries: 1,
      requireApprovalForDeploy: false,
      requireApprovalForPR: false,
      validationLevel: "normal",
      parallelExecution: true,
      autoRecovery: true,
    },
  };

  // ==========================================================================
  // AGENT MANAGEMENT
  // ==========================================================================

  registerAgent(registration: AgentRegistration): Agent {
    const id = `agent-${registration.type}-${randomUUID().slice(0, 8)}`;
    
    const agent: Agent = {
      id,
      type: registration.type,
      name: registration.name,
      state: AgentState.ONLINE,
      capabilities: registration.capabilities,
      health: 100,
      load: 0,
      queueDepth: 0,
      version: registration.version || "1.0.0",
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    this.agents.set(id, agent);
    this.emitEvent("agent_registered", { agentId: id, type: registration.type });

    logEvent({
      eventType: "agent_registered",
      severity: "info",
      message: `Agent registered: ${agent.name} (${agent.type})`,
      details: { agentId: id, type: registration.type }
    });

    return agent;
  }

  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    this.agents.delete(agentId);
    this.emitEvent("agent_unregistered", { agentId, type: agent.type });

    return true;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByType(type: AgentTypeType): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.type === type);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getOnlineAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(a => 
      a.state === AgentState.ONLINE || a.state === AgentState.BUSY
    );
  }

  updateAgentState(agentId: string, state: AgentStateType): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const oldState = agent.state;
    agent.state = state;
    
    this.emitEvent("agent_state_changed", {
      agentId,
      oldState,
      newState: state
    });

    return true;
  }

  updateAgentHealth(agentId: string, health: number): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.health = Math.max(0, Math.min(100, health));
    
    if (agent.health < 20 && agent.state !== AgentState.FAILED) {
      this.updateAgentState(agentId, AgentState.FAILED);
    }

    return true;
  }

  updateAgentLoad(agentId: string, load: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.load = Math.max(0, Math.min(100, load));
      this.emitEvent("load_balanced", { agentId, load: agent.load });
    }
  }

  heartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.lastHeartbeat = new Date();
    if (agent.state === AgentState.FAILED) {
      agent.state = AgentState.RECOVERING;
    }
    
    return true;
  }

  // ==========================================================================
  // MISSION MANAGEMENT
  // ==========================================================================

  createMission(
    goal: string,
    mode: OrchestrationModeType = this.mode,
    options?: {
      userId?: string;
      roadmapId?: string;
      tasks?: Partial<OrchestratedTask>[];
    }
  ): OrchestratedMission {
    const id = `mission-${randomUUID().slice(0, 8)}`;
    
    const mission: OrchestratedMission = {
      id,
      goal,
      userId: options?.userId,
      roadmapId: options?.roadmapId,
      mode,
      state: MissionState.PENDING,
      assignedAgents: [],
      tasks: [],
      workflow: {
        id: `workflow-${id}`,
        name: `Mission ${id}`,
        type: mode === OrchestrationMode.DEVIL ? WorkflowType.PARALLEL : WorkflowType.SEQUENTIAL,
        steps: [],
      },
      createdAt: new Date(),
    };

    // Create tasks from options or generate default
    if (options?.tasks && options.tasks.length > 0) {
      mission.tasks = options.tasks.map(t => this.createTask(id, t));
    } else {
      mission.tasks = this.generateDefaultTasks(id, goal);
    }

    // Build workflow
    mission.workflow.steps = mission.tasks.map(t => ({
      id: `step-${t.id}`,
      taskId: t.id,
      dependsOn: t.dependencies,
      agentType: t.type,
      parallelWith: mode === OrchestrationMode.DEVIL ? this.getParallelTasks(t) : undefined,
    }));

    this.missions.set(id, mission);
    
    this.emitEvent("mission_started", { missionId: id, goal, mode });
    
    logEvent({
      eventType: "orchestrator_mission_created",
      severity: "info",
      message: `Mission created: ${goal}`,
      details: { missionId: id, mode }
    });

    return mission;
  }

  private createTask(
    missionId: string,
    taskDef: Partial<OrchestratedTask>
  ): OrchestratedTask {
    const id = `task-${randomUUID().slice(0, 8)}`;
    
    return {
      id,
      missionId,
      name: taskDef.name || "Untitled Task",
      description: taskDef.description || "",
      type: taskDef.type || AgentType.EXECUTOR,
      state: TaskState.QUEUED,
      dependencies: taskDef.dependencies || [],
      priority: taskDef.priority || 50,
      input: taskDef.input || {},
      retryCount: 0,
      maxRetries: this.modeConfig[this.mode].maxRetries,
      createdAt: new Date(),
    };
  }

  private generateDefaultTasks(missionId: string, goal: string): OrchestratedTask[] {
    const tasks: OrchestratedTask[] = [];
    const goalLower = goal.toLowerCase();

    // Planning task
    tasks.push(this.createTask(missionId, {
      name: "Analyze Goal",
      description: `Analyze: ${goal}`,
      type: AgentType.ARCHITECT,
      priority: 100,
    }));

    // Coding tasks
    if (goalLower.includes("build") || goalLower.includes("create") || goalLower.includes("implement")) {
      tasks.push(this.createTask(missionId, {
        name: "Generate Code",
        description: "Generate code for the solution",
        type: AgentType.CODING,
        dependencies: [tasks[0].id],
        priority: 80,
      }));
    }

    // GitHub tasks
    if (goalLower.includes("commit") || goalLower.includes("push") || goalLower.includes("pr")) {
      tasks.push(this.createTask(missionId, {
        name: "GitHub Operations",
        description: "Perform GitHub operations",
        type: AgentType.GITHUB,
        dependencies: tasks.length > 1 ? [tasks[tasks.length - 1].id] : [tasks[0].id],
        priority: 60,
      }));
    }

    // Deployment tasks
    if (goalLower.includes("deploy") || goalLower.includes("release")) {
      tasks.push(this.createTask(missionId, {
        name: "Deploy Application",
        description: "Deploy to target environment",
        type: AgentType.DEPLOYMENT,
        dependencies: tasks.filter((_, i) => i > 0).map(t => t.id),
        priority: 40,
      }));
    }

    // Default executor task
    tasks.push(this.createTask(missionId, {
      name: "Execute Mission",
      description: "Execute the mission",
      type: AgentType.EXECUTOR,
      dependencies: tasks.filter(t => t.type !== AgentType.ARCHITECT).map(t => t.id),
      priority: 50,
    }));

    return tasks;
  }

  private getParallelTasks(task: OrchestratedTask): string[] | undefined {
    // Tasks without dependencies can run in parallel
    if (task.dependencies.length === 0) {
      return [];
    }
    return undefined;
  }

  getMission(missionId: string): OrchestratedMission | undefined {
    return this.missions.get(missionId);
  }

  getAllMissions(): OrchestratedMission[] {
    return Array.from(this.missions.values());
  }

  pauseMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    if (mission.state === MissionState.EXECUTING) {
      mission.state = MissionState.PAUSED;
      mission.pausedAt = new Date();
      
      // Pause all running tasks
      mission.tasks.forEach(t => {
        if (t.state === TaskState.RUNNING || t.state === TaskState.ASSIGNED) {
          t.state = TaskState.PAUSED;
        }
      });

      this.emitEvent("mission_paused", { missionId });
      return true;
    }

    return false;
  }

  resumeMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    if (mission.state === MissionState.PAUSED) {
      mission.state = MissionState.EXECUTING;
      mission.pausedAt = undefined;

      // Resume paused tasks
      mission.tasks.forEach(t => {
        if (t.state === TaskState.PAUSED) {
          t.state = TaskState.QUEUED;
        }
      });

      this.emitEvent("mission_resumed", { missionId });
      return true;
    }

    return false;
  }

  cancelMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    mission.state = MissionState.CANCELLED;

    // Cancel all tasks
    mission.tasks.forEach(t => {
      if (t.state !== TaskState.COMPLETED && t.state !== TaskState.FAILED) {
        t.state = TaskState.CANCELLED;
      }
    });

    // Release agents
    mission.assignedAgents.forEach(agentId => {
      this.updateAgentLoad(agentId, Math.max(0, (this.getAgent(agentId)?.load || 0) - 20));
    });

    this.emitEvent("mission_completed", { missionId, cancelled: true });
    return true;
  }

  // ==========================================================================
  // TASK ROUTING
  // ==========================================================================

  routeTask(task: OrchestratedTask): Agent | undefined {
    // Find agents that can handle this task type
    const capableAgents = this.getAgentsByType(task.type)
      .filter(a => a.state === AgentState.ONLINE || a.state === AgentState.BUSY)
      .filter(a => a.health > 30);

    if (capableAgents.length === 0) {
      return undefined;
    }

    // Load balancing: pick agent with lowest load
    return capableAgents.sort((a, b) => {
      const loadDiff = a.load - b.load;
      if (loadDiff !== 0) return loadDiff;
      
      // Secondary: pick agent with fewer queued tasks
      return a.queueDepth - b.queueDepth;
    })[0];
  }

  assignTask(taskId: string, agentId: string): boolean {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);
    
    if (!task || !agent) return false;

    task.assignedAgent = agentId;
    task.state = TaskState.ASSIGNED;
    task.assignedAt = new Date();

    agent.state = AgentState.BUSY;
    agent.currentTask = taskId;
    agent.queueDepth++;

    this.emitEvent("task_assigned", { taskId, agentId });
    return true;
  }

  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.state = TaskState.RUNNING;
    task.startedAt = new Date();

    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent);
      if (agent) {
        agent.load = Math.min(100, agent.load + 20);
      }
    }

    this.emitEvent("task_started", { taskId });
    return true;
  }

  completeTask(taskId: string, output?: Record<string, unknown>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.state = TaskState.COMPLETED;
    task.completedAt = new Date();
    task.output = output;

    // Calculate actual duration
    if (task.startedAt) {
      task.actualMinutes = (task.completedAt.getTime() - task.startedAt.getTime()) / 60000;
    }

    // Release agent
    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent);
      if (agent) {
        agent.state = AgentState.ONLINE;
        agent.currentTask = undefined;
        agent.queueDepth = Math.max(0, agent.queueDepth - 1);
        agent.load = Math.max(0, agent.load - 20);
      }
    }

    // Check if mission is complete
    this.checkMissionCompletion(task.missionId);

    this.emitEvent("task_completed", { taskId, output });
    return true;
  }

  failTask(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.error = error;
    task.retryCount++;

    if (task.retryCount < task.maxRetries) {
      // Retry
      task.state = TaskState.QUEUED;
      this.emitEvent("task_retried", { taskId, retryCount: task.retryCount });
    } else {
      // Max retries reached
      task.state = TaskState.FAILED;
      
      // Fail mission
      const mission = this.missions.get(task.missionId);
      if (mission) {
        mission.state = MissionState.FAILED;
        mission.error = error;
      }

      // Release agent
      if (task.assignedAgent) {
        const agent = this.agents.get(task.assignedAgent);
        if (agent) {
          agent.state = AgentState.ONLINE;
          agent.currentTask = undefined;
        }
      }

      this.emitEvent("task_failed", { taskId, error, maxRetriesReached: true });
    }

    return true;
  }

  private checkMissionCompletion(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    const incompleteTasks = mission.tasks.filter(
      t => t.state !== TaskState.COMPLETED && 
           t.state !== TaskState.FAILED &&
           t.state !== TaskState.CANCELLED
    );

    if (incompleteTasks.length === 0) {
      const failedTasks = mission.tasks.filter(t => t.state === TaskState.FAILED);
      
      if (failedTasks.length === 0) {
        mission.state = MissionState.COMPLETED;
        mission.completedAt = new Date();
        this.emitEvent("mission_completed", { missionId });
      } else {
        mission.state = MissionState.FAILED;
        mission.error = `${failedTasks.length} task(s) failed`;
        this.emitEvent("mission_failed", { missionId, failedCount: failedTasks.length });
      }

      // Release all agents
      mission.assignedAgents.forEach(agentId => {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.state = AgentState.ONLINE;
          agent.load = Math.max(0, agent.load - 20);
        }
      });
    }
  }

  // ==========================================================================
  // WORKFLOW EXECUTION
  // ==========================================================================

  executeWorkflow(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    mission.state = MissionState.EXECUTING;
    mission.startedAt = new Date();

    this.emitEvent("workflow_started", { missionId });

    // In God mode: execute sequentially
    // In Devil mode: execute in parallel where possible
    if (mission.mode === OrchestrationMode.GOD) {
      this.executeSequential(mission);
    } else {
      this.executeParallel(mission);
    }

    return true;
  }

  private async executeSequential(mission: OrchestratedMission): Promise<void> {
    for (const task of mission.tasks) {
      if (mission.state === MissionState.PAUSED || mission.state === MissionState.CANCELLED) {
        break;
      }

      this.tasks.set(task.id, task);
      await this.executeTask(task);
    }
  }

  private async executeParallel(mission: OrchestratedMission): Promise<void> {
    // Find tasks with no dependencies
    const readyTasks = mission.tasks.filter(t => t.dependencies.length === 0);
    
    for (const task of readyTasks) {
      this.tasks.set(task.id, task);
    }

    // In a real implementation, this would use async/await for parallel execution
    for (const task of readyTasks) {
      if (mission.state === MissionState.PAUSED || mission.state === MissionState.CANCELLED) {
        break;
      }
      await this.executeTask(task);
    }

    // Recursively execute dependent tasks
    const remainingTasks = mission.tasks.filter(t => t.state === TaskState.QUEUED);
    if (remainingTasks.length > 0) {
      await this.executeParallel(mission);
    }
  }

  private async executeTask(task: OrchestratedTask): Promise<void> {
    // Route task to available agent
    const agent = this.routeTask(task);
    if (!agent) {
      task.state = TaskState.QUEUED;
      return;
    }

    // Assign and start
    this.assignTask(task.id, agent.id);
    this.startTask(task.id);

    // Simulate task execution (in real implementation, call the agent)
    // The actual execution would be handled by the agent itself
    
    logEvent({
      eventType: "orchestrator_task_execution",
      severity: "info",
      message: `Executing task: ${task.name}`,
      details: { taskId: task.id, agentId: agent.id }
    });
  }

  // ==========================================================================
  // DEPENDENCY COORDINATION
  // ==========================================================================

  canExecuteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Check if all dependencies are completed
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.state !== TaskState.COMPLETED) {
        return false;
      }
    }

    return true;
  }

  getExecutableTasks(missionId: string): OrchestratedTask[] {
    const mission = this.missions.get(missionId);
    if (!mission) return [];

    return mission.tasks
      .filter(t => t.state === TaskState.QUEUED)
      .filter(t => this.canExecuteTask(t.id))
      .sort((a, b) => b.priority - a.priority);
  }

  // ==========================================================================
  // MODE MANAGEMENT
  // ==========================================================================

  setMode(mode: OrchestrationModeType): void {
    this.mode = mode;
    logEvent({
      eventType: "orchestrator_mode_changed",
      severity: "info",
      message: `Orchestrator mode changed to ${mode}`,
      details: { mode }
    });
  }

  getMode(): OrchestrationModeType {
    return this.mode;
  }

  getModeConfig(): typeof this.modeConfig[keyof typeof this.modeConfig] {
    return this.modeConfig[this.mode];
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  private emitEvent(type: OrchestratorEventType, details: Record<string, unknown>): void {
    const event: OrchestratorEvent = {
      id: randomUUID(),
      type,
      details,
      timestamp: new Date()
    };

    if (details.missionId) event.missionId = details.missionId as string;
    if (details.taskId) event.taskId = details.taskId as string;
    if (details.agentId) event.agentId = details.agentId as string;

    this.events.push(event);

    // Keep last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    logEvent({
      eventType: type,
      severity: "info",
      message: `Orchestrator: ${type}`,
      details
    });
  }

  getEvents(): OrchestratorEvent[] {
    return [...this.events];
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  getStats(): {
    agents: {
      total: number;
      online: number;
      busy: number;
      failed: number;
    };
    missions: {
      total: number;
      pending: number;
      executing: number;
      completed: number;
      failed: number;
      paused: number;
    };
    tasks: {
      total: number;
      queued: number;
      running: number;
      completed: number;
      failed: number;
    };
    mode: OrchestrationModeType;
  } {
    const agents = this.getAllAgents();
    const missions = this.getAllMissions();
    const tasks = Array.from(this.tasks.values());

    return {
      agents: {
        total: agents.length,
        online: agents.filter(a => a.state === AgentState.ONLINE).length,
        busy: agents.filter(a => a.state === AgentState.BUSY).length,
        failed: agents.filter(a => a.state === AgentState.FAILED).length,
      },
      missions: {
        total: missions.length,
        pending: missions.filter(m => m.state === MissionState.PENDING).length,
        executing: missions.filter(m => m.state === MissionState.EXECUTING).length,
        completed: missions.filter(m => m.state === MissionState.COMPLETED).length,
        failed: missions.filter(m => m.state === MissionState.FAILED).length,
        paused: missions.filter(m => m.state === MissionState.PAUSED).length,
      },
      tasks: {
        total: tasks.length,
        queued: tasks.filter(t => t.state === TaskState.QUEUED).length,
        running: tasks.filter(t => t.state === TaskState.RUNNING).length,
        completed: tasks.filter(t => t.state === TaskState.COMPLETED).length,
        failed: tasks.filter(t => t.state === TaskState.FAILED).length,
      },
      mode: this.mode,
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const orchestrator = new Orchestrator();

// Register default agents
orchestrator.registerAgent({
  type: AgentType.ARCHITECT,
  name: "Architect Agent",
  capabilities: {
    canPlan: true,
    canCode: false,
    canDeploy: false,
    canAnalyze: true,
    canResearch: false,
    canGenerateImages: false,
    canGenerateVideos: false,
  },
  version: "1.0.0",
});

orchestrator.registerAgent({
  type: AgentType.EXECUTOR,
  name: "Executor Agent",
  capabilities: {
    canPlan: false,
    canCode: true,
    canDeploy: false,
    canAnalyze: false,
    canResearch: false,
    canGenerateImages: false,
    canGenerateVideos: false,
  },
  version: "1.0.0",
});

orchestrator.registerAgent({
  type: AgentType.CODING,
  name: "Coding Agent",
  capabilities: {
    canPlan: false,
    canCode: true,
    canDeploy: false,
    canAnalyze: false,
    canResearch: false,
    canGenerateImages: false,
    canGenerateVideos: false,
    supportedLanguages: ["TypeScript", "JavaScript", "Python"],
    supportedFrameworks: ["React", "Next.js", "Express"],
  },
  version: "1.0.0",
});

orchestrator.registerAgent({
  type: AgentType.GITHUB,
  name: "GitHub Agent",
  capabilities: {
    canPlan: false,
    canCode: false,
    canDeploy: false,
    canAnalyze: true,
    canResearch: false,
    canGenerateImages: false,
    canGenerateVideos: false,
  },
  version: "1.0.0",
});

orchestrator.registerAgent({
  type: AgentType.DEPLOYMENT,
  name: "Deployment Agent",
  capabilities: {
    canPlan: false,
    canCode: false,
    canDeploy: true,
    canAnalyze: false,
    canResearch: false,
    canGenerateImages: false,
    canGenerateVideos: false,
  },
  version: "1.0.0",
});
