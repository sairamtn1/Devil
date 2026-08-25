/**
 * DEVIL Executor Foundation - Executor Engine
 * 
 * Main orchestrator that coordinates all execution components:
 * - State Machine
 * - Execution Queue
 * - Sandbox Manager
 * - Execution Modes
 * - Recovery Engine
 */

import { db, missionsTable, missionPhasesTable, missionTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logEvent } from "../control-plane/eventLog";
import { validateForExecution } from "../control-plane/validationLayer";
import {
  ExecutorState,
  ExecutorStateType,
  ExecutionMode,
  ExecutionModeType,
  createExecutor,
  getExecutor,
  getExecutorByMission,
  removeExecutor,
  transitionExecutorState,
  updateExecutorProgress,
  ExecutorStateRecord,
} from "./stateMachine";
import {
  executionQueue,
  QueuePriority,
  QueuedTask,
  getMissionQueueSummary,
} from "./queue";
import {
  SandboxManager,
  defaultSandboxManager,
  ResourceLimits,
} from "./sandbox";
import {
  createExecutionMode,
  DryRunMode,
  StepByStepMode,
  AutoPilotMode,
  ExecutionContext,
  ExecutionResult,
} from "./modes";
import {
  RecoveryEngine,
  defaultRecoveryEngine,
} from "./recovery";

// ============================================================================
// EXECUTOR ENGINE TYPES
// ============================================================================

export interface ExecutorConfig {
  missionId: string;
  mode: ExecutionModeType;
  userId?: string;
  sandboxLimits?: ResourceLimits;
  autoStart?: boolean;
  approvalRequired?: boolean;
}

export interface ExecutorStatus {
  id: string;
  missionId: string;
  state: ExecutorStateType;
  mode: ExecutionModeType;
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
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}

export interface ExecutorEvent {
  id: string;
  executorId: string;
  missionId: string;
  taskId?: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// EXECUTOR ENGINE
// ============================================================================

export class ExecutorEngine {
  private recoveryEngine: RecoveryEngine;
  private sandboxManager: SandboxManager;
  private eventStore: Map<string, ExecutorEvent[]> = new Map();
  private activeModes: Map<string, DryRunMode | StepByStepMode | AutoPilotMode> = new Map();

  constructor(
    recoveryEngine: RecoveryEngine = defaultRecoveryEngine,
    sandboxManager: SandboxManager = defaultSandboxManager
  ) {
    this.recoveryEngine = recoveryEngine;
    this.sandboxManager = sandboxManager;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Initialize the executor engine
   */
  async initialize(): Promise<void> {
    await this.sandboxManager.initialize();
    
    logEvent({
      eventType: "system_recovery",
      severity: "info",
      message: "Executor engine initialized",
      actor: "system",
    });
  }

  /**
   * Shutdown the executor engine
   */
  async shutdown(): Promise<void> {
    // Stop all active executions
    for (const [executorId] of this.activeModes) {
      await this.stop(executorId);
    }
    
    await this.sandboxManager.shutdown();
    
    logEvent({
      eventType: "system_recovery",
      severity: "info",
      message: "Executor engine shutdown",
      actor: "system",
    });
  }

  // ==========================================================================
  // EXECUTOR MANAGEMENT
  // ==========================================================================

  /**
   * Create and start a new executor for a mission
   */
  async start(config: ExecutorConfig): Promise<ExecutorStatus> {
    const { missionId, mode, userId, sandboxLimits, autoStart = true } = config;

    // Check if executor already exists for this mission
    const existing = getExecutorByMission(missionId);
    if (existing) {
      throw new Error(`Executor already exists for mission: ${missionId}`);
    }

    // Validate mission exists and is in valid state
    const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));
    
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }

    if (mission.status !== "running" && mission.status !== "approved") {
      throw new Error(`Mission not in executable state: ${mission.status}`);
    }

    // Create executor
    const executorId = `executor-${crypto.randomUUID()}`;
    const executor = createExecutor(executorId, missionId, mode);

    // Create sandbox session
    let sessionId: string | null = null;
    
    if (mode !== ExecutionMode.DRY_RUN) {
      try {
        const session = await this.sandboxManager.createSession(sandboxLimits);
        sessionId = session.id;
        executor.metadata = { sessionId };
      } catch (error) {
        console.error("Failed to create sandbox session:", error);
      }
    }

    // Queue all tasks from mission
    await this.queueMissionTasks(missionId);

    // Log executor creation
    await logEvent({
      missionId,
      eventType: "mission_started",
      severity: "info",
      message: `Executor started: ${executorId}`,
      actor: userId ?? "system",
      details: { executorId, mode, sessionId },
    });

    // Transition to queued
    await transitionExecutorState(executorId, ExecutorState.QUEUED, userId);

    // Start execution if autoStart
    if (autoStart) {
      await this.resume(executorId, userId);
    }

    return this.getStatus(executorId);
  }

  /**
   * Pause execution
   */
  async pause(executorId: string, userId?: string): Promise<ExecutorStatus> {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    if (executor.state !== ExecutorState.RUNNING) {
      throw new Error(`Cannot pause from state: ${executor.state}`);
    }

    // Transition to paused
    await transitionExecutorState(executorId, ExecutorState.PAUSED, userId, {
      reason: "User paused execution",
    });

    // Pause active mode
    const mode = this.activeModes.get(executorId);
    if (mode instanceof StepByStepMode) {
      mode.pause();
    } else if (mode instanceof AutoPilotMode) {
      mode.pause();
    }

    // Log pause
    await logEvent({
      missionId: executor.missionId,
      eventType: "mission_paused",
      severity: "info",
      message: `Execution paused: ${executorId}`,
      actor: userId ?? "system",
    });

    return this.getStatus(executorId);
  }

  /**
   * Resume execution
   */
  async resume(executorId: string, userId?: string): Promise<ExecutorStatus> {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    if (executor.state !== ExecutorState.PAUSED && executor.state !== ExecutorState.QUEUED) {
      throw new Error(`Cannot resume from state: ${executor.state}`);
    }

    // Get or create sandbox session if needed
    const sessionId = executor.metadata?.sessionId as string | undefined;
    
    if (!sessionId && executor.mode !== ExecutionMode.DRY_RUN) {
      const session = await this.sandboxManager.createSession();
      executor.metadata = { ...executor.metadata, sessionId: session.id };
    }

    // Transition to running
    executor.startedAt = executor.startedAt ?? new Date();
    await transitionExecutorState(executorId, ExecutorState.RUNNING, userId, {
      reason: "Execution resumed",
    });

    // Create execution context
    const context: ExecutionContext = {
      executorId,
      missionId: executor.missionId,
      sandboxManager: this.sandboxManager,
      recoveryEngine: this.recoveryEngine,
      onTaskStart: async (task) => {
        this.addEvent(executorId, {
          type: "task_start",
          severity: "info",
          message: `Starting task: ${task.taskId}`,
          taskId: task.taskId,
        });
      },
      onTaskComplete: async (task, result) => {
        this.addEvent(executorId, {
          type: "task_complete",
          severity: "info",
          message: `Task completed: ${task.taskId}`,
          taskId: task.taskId,
          data: { result },
        });
      },
      onTaskFail: async (task, error) => {
        this.addEvent(executorId, {
          type: "task_fail",
          severity: "error",
          message: `Task failed: ${task.taskId}`,
          taskId: task.taskId,
          data: { error },
        });
      },
      onApprovalRequired: async (task, reason) => {
        this.addEvent(executorId, {
          type: "approval_required",
          severity: "warning",
          message: `Approval required for task: ${task.taskId}`,
          taskId: task.taskId,
          data: { reason },
        });
      },
    };

    // Create and start execution mode
    const mode = createExecutionMode(executor.mode, context);
    this.activeModes.set(executorId, mode);

    // Run execution (in background for non-blocking)
    this.runExecution(executorId, mode).catch(error => {
      console.error(`Executor ${executorId} error:`, error);
    });

    // Log resume
    await logEvent({
      missionId: executor.missionId,
      eventType: "mission_resumed",
      severity: "info",
      message: `Execution resumed: ${executorId}`,
      actor: userId ?? "system",
    });

    return this.getStatus(executorId);
  }

  /**
   * Cancel execution
   */
  async cancel(executorId: string, userId?: string): Promise<ExecutorStatus> {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    if ([ExecutorState.COMPLETED, ExecutorState.CANCELLED, ExecutorState.FAILED].includes(executor.state)) {
      throw new Error(`Cannot cancel from state: ${executor.state}`);
    }

    // Stop active mode
    const mode = this.activeModes.get(executorId);
    if (mode instanceof AutoPilotMode) {
      mode.cancel();
    }
    this.activeModes.delete(executorId);

    // Transition to cancelled
    await transitionExecutorState(executorId, ExecutorState.CANCELLED, userId, {
      reason: "User cancelled execution",
    });

    // Clean up sandbox session
    const sessionId = executor.metadata?.sessionId as string | undefined;
    if (sessionId) {
      await this.sandboxManager.destroySession(sessionId);
    }

    // Log cancel
    await logEvent({
      missionId: executor.missionId,
      eventType: "mission_cancelled",
      severity: "info",
      message: `Execution cancelled: ${executorId}`,
      actor: userId ?? "system",
    });

    return this.getStatus(executorId);
  }

  /**
   * Stop executor and cleanup
   */
  async stop(executorId: string): Promise<void> {
    const executor = getExecutor(executorId);
    
    if (executor) {
      // Clean up sandbox
      const sessionId = executor.metadata?.sessionId as string | undefined;
      if (sessionId) {
        await this.sandboxManager.destroySession(sessionId);
      }
      
      // Remove executor
      removeExecutor(executorId);
      this.activeModes.delete(executorId);
    }
  }

  // ==========================================================================
  // EXECUTION
  // ==========================================================================

  private async runExecution(
    executorId: string,
    mode: DryRunMode | StepByStepMode | AutoPilotMode
  ): Promise<void> {
    try {
      const result = await mode.run();
      
      const executor = getExecutor(executorId);
      if (!executor) return;

      // Update final state
      if (result.success) {
        await transitionExecutorState(executorId, ExecutorState.COMPLETED, "system", {
          reason: "Execution completed successfully",
        });
        
        // Log completion
        await logEvent({
          missionId: executor.missionId,
          eventType: "mission_completed",
          severity: "info",
          message: `Mission completed: ${executor.missionId}`,
          actor: "system",
          details: {
            tasksCompleted: result.tasksCompleted,
            tasksFailed: result.tasksFailed,
            duration: result.duration,
          },
        });
      } else {
        await transitionExecutorState(executorId, ExecutorState.FAILED, "system", {
          reason: result.errors.join(", "),
        });
      }

      // Store result
      executor.metadata = { ...executor.metadata, lastResult: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      const executor = getExecutor(executorId);
      if (executor) {
        await transitionExecutorState(executorId, ExecutorState.FAILED, "system", {
          error: errorMsg,
        });
      }
      
      console.error(`Executor ${executorId} failed:`, error);
    } finally {
      this.activeModes.delete(executorId);
    }
  }

  private async queueMissionTasks(missionId: string): Promise<void> {
    // Get all tasks for the mission
    const tasks = await db
      .select()
      .from(missionTasksTable)
      .where(eq(missionTasksTable.missionId, missionId))
      .orderBy(missionTasksTable.order);

    // Queue each task
    for (const task of tasks) {
      executionQueue.enqueue({
        id: `queue-${task.id}`,
        missionId,
        phaseId: task.phaseId,
        taskId: task.id,
        priority: QueuePriority.NORMAL,
        dependencies: [],  // Would need to parse from task definition
        maxRetries: 3,
      });
    }
  }

  // ==========================================================================
  // STATUS & EVENTS
  // ==========================================================================

  /**
   * Get executor status
   */
  getStatus(executorId: string): ExecutorStatus {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    const queueStats = executionQueue.getStats(executor.missionId);
    const sessionId = executor.metadata?.sessionId as string | undefined;
    const session = sessionId ? this.sandboxManager.getSession(sessionId) : null;

    return {
      id: executor.id,
      missionId: executor.missionId,
      state: executor.state,
      mode: executor.mode,
      progress: executor.progress,
      currentPhase: executor.currentPhaseId,
      currentTask: executor.currentTaskId,
      queueStats: {
        total: queueStats.total,
        pending: queueStats.pending,
        executing: queueStats.executing,
        completed: queueStats.completed,
        failed: queueStats.failed,
      },
      sandbox: {
        active: session?.status === "ready" || session?.status === "running",
        sessionId: sessionId ?? null,
      },
      startedAt: executor.startedAt,
      pausedAt: executor.pausedAt,
      completedAt: executor.completedAt,
      error: executor.error,
    };
  }

  /**
   * Get executor status by mission ID
   */
  getStatusByMission(missionId: string): ExecutorStatus | null {
    const executor = getExecutorByMission(missionId);
    
    if (!executor) {
      return null;
    }

    return this.getStatus(executor.id);
  }

  /**
   * Add an event to the event store
   */
  private addEvent(executorId: string, event: Omit<ExecutorEvent, "id" | "executorId" | "missionId" | "timestamp">): void {
    const executor = getExecutor(executorId);
    if (!executor) return;

    const fullEvent: ExecutorEvent = {
      id: `evt-${crypto.randomUUID()}`,
      executorId,
      missionId: executor.missionId,
      timestamp: new Date(),
      ...event,
    };

    const events = this.eventStore.get(executorId) ?? [];
    events.push(fullEvent);
    
    // Keep only last 1000 events
    if (events.length > 1000) {
      events.shift();
    }
    
    this.eventStore.set(executorId, events);
  }

  /**
   * Get events for an executor
   */
  getEvents(executorId: string, limit: number = 100): ExecutorEvent[] {
    const events = this.eventStore.get(executorId) ?? [];
    return events.slice(-limit);
  }

  /**
   * Get events by mission ID
   */
  getEventsByMission(missionId: string, limit: number = 100): ExecutorEvent[] {
    const executor = getExecutorByMission(missionId);
    if (!executor) return [];
    return this.getEvents(executor.id, limit);
  }

  /**
   * Stream events (for SSE)
   */
  async *streamEvents(executorId: string): AsyncGenerator<ExecutorEvent> {
    const events = this.eventStore.get(executorId) ?? [];
    let index = events.length;

    while (true) {
      const currentEvents = this.eventStore.get(executorId) ?? [];
      
      while (index < currentEvents.length) {
        yield currentEvents[index];
        index++;
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if executor still exists
      if (!getExecutor(executorId)) {
        break;
      }
    }
  }

  // ==========================================================================
  // DRY RUN
  // ==========================================================================

  /**
   * Generate a dry run plan
   */
  async generateDryRunPlan(missionId: string, userId?: string): Promise<{
    plan: any;
    executor: ExecutorStatus;
  }> {
    // Create a temporary executor in dry run mode
    const executorId = `executor-${crypto.randomUUID()}`;
    const executor = createExecutor(executorId, missionId, ExecutionMode.DRY_RUN);

    const context: ExecutionContext = {
      executorId,
      missionId,
      sandboxManager: this.sandboxManager,
      recoveryEngine: this.recoveryEngine,
    };

    const dryRunMode = new DryRunMode(context);
    const result = await dryRunMode.run();

    // Clean up the temporary executor
    removeExecutor(executorId);

    return {
      plan: result.dryRunPlan,
      executor: this.getStatus(executorId),
    };
  }

  // ==========================================================================
  // APPROVAL
  // ==========================================================================

  /**
   * Approve a paused task and resume execution
   */
  async approveAndContinue(executorId: string, taskId: string, userId: string): Promise<ExecutorStatus> {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    // Log approval
    await logEvent({
      missionId: executor.missionId,
      taskId,
      eventType: "approval_granted",
      severity: "info",
      message: `Task approved: ${taskId}`,
      actor: userId,
      details: { taskId },
    });

    // Resume if paused
    if (executor.state === ExecutorState.PAUSED) {
      return this.resume(executorId, userId);
    }

    return this.getStatus(executorId);
  }

  /**
   * Deny and skip a task
   */
  async denyAndSkip(executorId: string, taskId: string, userId: string, reason?: string): Promise<ExecutorStatus> {
    const executor = getExecutor(executorId);
    
    if (!executor) {
      throw new Error(`Executor not found: ${executorId}`);
    }

    // Skip the task
    executionQueue.skipTask(taskId, reason ?? "Denied by user");

    // Log denial
    await logEvent({
      missionId: executor.missionId,
      taskId,
      eventType: "approval_denied",
      severity: "info",
      message: `Task denied: ${taskId}`,
      actor: userId,
      details: { taskId, reason },
    });

    return this.getStatus(executorId);
  }
}

// ============================================================================
// DEFAULT EXECUTOR ENGINE INSTANCE
// ============================================================================

export const defaultExecutorEngine = new ExecutorEngine();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function getExecutorFullStatus(missionId: string): Promise<{
  executor: ExecutorStatus | null;
  queue: Awaited<ReturnType<typeof getMissionQueueSummary>> | null;
}> {
  const executorStatus = defaultExecutorEngine.getStatusByMission(missionId);
  const queue = await getMissionQueueSummary(missionId);
  
  return {
    executor: executorStatus,
    queue,
  };
}
