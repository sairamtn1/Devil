/**
 * DEVIL Executor Foundation - Executor State Machine
 * 
 * Manages the lifecycle of execution states:
 * IDLE → QUEUED → PREPARING → VALIDATING → RUNNING → PAUSED → COMPLETED/FAILED
 *                                         ↓
 *                                   AWAITING_APPROVAL
 *                                         ↓
 *                                       RUNNING
 * 
 * Also supports: RECOVERING, CANCELLED
 */

import { db, missionsTable, missionPhasesTable, missionTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// EXECUTOR STATES
// ============================================================================

export const ExecutorState = {
  IDLE: "idle",
  QUEUED: "queued",
  PREPARING: "preparing",
  VALIDATING: "validating",
  RUNNING: "running",
  PAUSED: "paused",
  AWAITING_APPROVAL: "awaiting_approval",
  RECOVERING: "recovering",
  FAILED: "failed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ExecutorStateType = (typeof ExecutorState)[keyof typeof ExecutorState];

export const EXECUTOR_STATES: ExecutorStateType[] = [
  ExecutorState.IDLE,
  ExecutorState.QUEUED,
  ExecutorState.PREPARING,
  ExecutorState.VALIDATING,
  ExecutorState.RUNNING,
  ExecutorState.PAUSED,
  ExecutorState.AWAITING_APPROVAL,
  ExecutorState.RECOVERING,
  ExecutorState.FAILED,
  ExecutorState.COMPLETED,
  ExecutorState.CANCELLED,
];

// ============================================================================
// EXECUTION MODES
// ============================================================================

export const ExecutionMode = {
  DRY_RUN: "dry_run",
  STEP_BY_STEP: "step_by_step",
  AUTO_PILOT: "auto_pilot",
} as const;

export type ExecutionModeType = (typeof ExecutionMode)[keyof typeof ExecutionMode];

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

const EXECUTOR_TRANSITIONS: Record<ExecutorStateType, ExecutorStateType[]> = {
  [ExecutorState.IDLE]: [ExecutorState.QUEUED],
  [ExecutorState.QUEUED]: [ExecutorState.PREPARING, ExecutorState.CANCELLED],
  [ExecutorState.PREPARING]: [ExecutorState.VALIDATING, ExecutorState.FAILED, ExecutorState.CANCELLED],
  [ExecutorState.VALIDATING]: [ExecutorState.RUNNING, ExecutorState.FAILED, ExecutorState.CANCELLED],
  [ExecutorState.RUNNING]: [
    ExecutorState.PAUSED,
    ExecutorState.AWAITING_APPROVAL,
    ExecutorState.COMPLETED,
    ExecutorState.FAILED,
    ExecutorState.CANCELLED,
  ],
  [ExecutorState.PAUSED]: [ExecutorState.RUNNING, ExecutorState.CANCELLED],
  [ExecutorState.AWAITING_APPROVAL]: [ExecutorState.RUNNING, ExecutorState.CANCELLED],
  [ExecutorState.RECOVERING]: [ExecutorState.RUNNING, ExecutorState.FAILED, ExecutorState.CANCELLED],
  [ExecutorState.FAILED]: [ExecutorState.QUEUED, ExecutorState.IDLE], // Can retry
  [ExecutorState.COMPLETED]: [ExecutorState.IDLE],
  [ExecutorState.CANCELLED]: [ExecutorState.QUEUED, ExecutorState.IDLE], // Can restart
};

// ============================================================================
// STATE VALIDATION
// ============================================================================

export function canTransitionExecutor(from: ExecutorStateType, to: ExecutorStateType): boolean {
  return EXECUTOR_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: ExecutorStateType): ExecutorStateType[] {
  return EXECUTOR_TRANSITIONS[from] ?? [];
}

// ============================================================================
// EXECUTOR STATE RECORD
// ============================================================================

export interface ExecutorStateRecord {
  id: string;
  missionId: string;
  state: ExecutorStateType;
  mode: ExecutionModeType;
  currentPhaseId: string | null;
  currentTaskId: string | null;
  progress: number;
  error: string | null;
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  lastHeartbeat: Date;
  recoveryAttempts: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// EXECUTOR STATE OPERATIONS
// ============================================================================

export interface ExecutorTransitionResult {
  success: boolean;
  error?: string;
  previousState?: ExecutorStateType;
  newState?: ExecutorStateType;
}

export async function transitionExecutorState(
  executorId: string,
  newState: ExecutorStateType,
  userId?: string,
  metadata?: { error?: string; reason?: string; recoveryAttempt?: number }
): Promise<ExecutorTransitionResult> {
  // For now, we'll store executor state in memory
  // In production, this would be in a database table
  const executor = executorState.get(executorId);
  
  if (!executor) {
    return { success: false, error: "Executor not found" };
  }

  const previousState = executor.state;
  
  if (!canTransitionExecutor(previousState, newState)) {
    return {
      success: false,
      error: `Invalid transition: ${previousState} → ${newState}`,
      previousState,
    };
  }

  // Update state
  executor.state = newState;
  executor.lastHeartbeat = new Date();

  // Handle state-specific updates
  switch (newState) {
    case ExecutorState.RUNNING:
      executor.pausedAt = null;
      break;
    case ExecutorState.PAUSED:
      executor.pausedAt = new Date();
      break;
    case ExecutorState.COMPLETED:
    case ExecutorState.FAILED:
    case ExecutorState.CANCELLED:
      executor.completedAt = new Date();
      executor.progress = newState === ExecutorState.COMPLETED ? 100 : executor.progress;
      if (metadata?.error) {
        executor.error = metadata.error;
      }
      break;
    case ExecutorState.RECOVERING:
      executor.recoveryAttempts = (executor.recoveryAttempts || 0) + 1;
      break;
  }

  if (metadata) {
    executor.metadata = { ...executor.metadata, ...metadata };
  }

  // Log the transition
  await logEvent({
    missionId: executor.missionId,
    eventType: `executor_${newState}` as any,
    severity: newState === ExecutorState.FAILED ? "error" : "info",
    message: `Executor transitioned from ${previousState} to ${newState}${metadata?.reason ? `: ${metadata.reason}` : ""}`,
    actor: userId ?? "system",
    details: { executorId, previousState, newState, metadata },
  });

  return {
    success: true,
    previousState,
    newState,
  };
}

// ============================================================================
// IN-MEMORY EXECUTOR STATE STORE
// ============================================================================

export const executorState: Map<string, ExecutorStateRecord> = new Map();

export function createExecutor(
  executorId: string,
  missionId: string,
  mode: ExecutionModeType = ExecutionMode.AUTO_PILOT
): ExecutorStateRecord {
  const executor: ExecutorStateRecord = {
    id: executorId,
    missionId,
    state: ExecutorState.IDLE,
    mode,
    currentPhaseId: null,
    currentTaskId: null,
    progress: 0,
    error: null,
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    lastHeartbeat: new Date(),
    recoveryAttempts: 0,
    metadata: {},
  };

  executorState.set(executorId, executor);
  return executor;
}

export function getExecutor(executorId: string): ExecutorStateRecord | undefined {
  return executorState.get(executorId);
}

export function removeExecutor(executorId: string): boolean {
  return executorState.delete(executorId);
}

export function getAllExecutors(): ExecutorStateRecord[] {
  return Array.from(executorState.values());
}

export function getExecutorByMission(missionId: string): ExecutorStateRecord | undefined {
  for (const executor of executorState.values()) {
    if (executor.missionId === missionId) {
      return executor;
    }
  }
  return undefined;
}

// ============================================================================
// STATE QUERY HELPERS
// ============================================================================

export async function getExecutorMissionState(missionId: string): Promise<{
  executor: ExecutorStateRecord | undefined;
  mission: typeof missionsTable.$inferSelect | null;
  phases: typeof missionPhasesTable.$inferSelect[];
  tasks: typeof missionTasksTable.$inferSelect[];
} | null> {
  const executor = getExecutorByMission(missionId);
  
  if (!executor) {
    return null;
  }

  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));
  
  if (!mission) {
    return null;
  }

  const phases = await db
    .select()
    .from(missionPhasesTable)
    .where(eq(missionPhasesTable.missionId, missionId))
    .orderBy(missionPhasesTable.order);

  const tasks = await db
    .select()
    .from(missionTasksTable)
    .where(eq(missionTasksTable.missionId, missionId))
    .orderBy(missionTasksTable.order);

  return { executor, mission, phases, tasks };
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export async function updateExecutorProgress(
  executorId: string,
  progress: number,
  currentPhaseId?: string,
  currentTaskId?: string
): Promise<void> {
  const executor = executorState.get(executorId);
  
  if (executor) {
    executor.progress = progress;
    executor.lastHeartbeat = new Date();
    
    if (currentPhaseId !== undefined) {
      executor.currentPhaseId = currentPhaseId;
    }
    
    if (currentTaskId !== undefined) {
      executor.currentTaskId = currentTaskId;
    }
  }
}

// ============================================================================
// HEARTBEAT
// ============================================================================

export function heartbeat(executorId: string): boolean {
  const executor = executorState.get(executorId);
  
  if (executor) {
    executor.lastHeartbeat = new Date();
    return true;
  }
  
  return false;
}

export function isExecutorStale(executorId: string, maxAgeMs: number = 60000): boolean {
  const executor = executorState.get(executorId);
  
  if (!executor) {
    return true;
  }
  
  return Date.now() - executor.lastHeartbeat.getTime() > maxAgeMs;
}
