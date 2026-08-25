/**
 * DEVIL Control Plane - Mission State Machine
 * 
 * Manages the lifecycle of missions through well-defined states:
 * - queued → running → blocked/awaiting_approval → succeeded/failed/cancelled
 * 
 * Provides state transition validation and automatic event emission.
 */

import { db, missionsTable, missionPhasesTable, missionTasksTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { MissionStatus, PhaseStatus, TaskStatus } from "@workspace/db";
import { logEvent } from "./eventLog";

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

export const MISSION_STATES: MissionStatus[] = [
  "queued",
  "running",
  "blocked",
  "awaiting_approval",
  "succeeded",
  "failed",
  "cancelled",
];

export const PHASE_STATES: PhaseStatus[] = [
  "pending",
  "approved",
  "queued",
  "in_progress",
  "completed",
  "failed",
  "skipped",
  "paused",
];

export const TASK_STATES: TaskStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "skipped",
];

// Valid state transitions
const MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["blocked", "awaiting_approval", "succeeded", "failed", "cancelled"],
  blocked: ["running", "cancelled"],
  awaiting_approval: ["running", "cancelled"],
  succeeded: [],
  failed: ["queued"], // Can retry
  cancelled: ["queued"], // Can restart
};

const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  pending: ["approved", "skipped"],
  approved: ["queued", "skipped"],
  queued: ["in_progress", "skipped"],
  in_progress: ["completed", "failed", "paused"],
  completed: [],
  failed: ["in_progress"], // Can retry
  skipped: [],
  paused: ["in_progress", "skipped"],
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress", "skipped"],
  in_progress: ["completed", "failed", "skipped"],
  completed: [],
  failed: ["in_progress"], // Can retry
  skipped: [],
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function canTransitionMission(from: MissionStatus, to: MissionStatus): boolean {
  return MISSION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionPhase(from: PhaseStatus, to: PhaseStatus): boolean {
  return PHASE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// MISSION STATE OPERATIONS
// ============================================================================

export interface TransitionResult {
  success: boolean;
  error?: string;
  previousState?: MissionStatus;
  newState?: MissionStatus;
}

export async function transitionMission(
  missionId: string,
  newStatus: MissionStatus,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<TransitionResult> {
  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));
  
  if (!mission) {
    return { success: false, error: "Mission not found" };
  }

  const previousStatus = mission.status as MissionStatus;
  
  if (!canTransitionMission(previousStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid transition: ${previousStatus} → ${newStatus}`,
      previousState: previousStatus,
    };
  }

  const updateData: Partial<typeof mission> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // Set timestamps based on state
  if (newStatus === "running" && !mission.startedAt) {
    updateData.startedAt = new Date();
  }
  
  if (["succeeded", "failed", "cancelled"].includes(newStatus)) {
    updateData.completedAt = new Date();
    updateData.progress = newStatus === "succeeded" ? 100 : mission.progress;
  }

  if (metadata) {
    updateData.metadata = { ...(mission.metadata as object), ...metadata };
  }

  await db.update(missionsTable).set(updateData).where(eq(missionsTable.id, missionId));

  // Log the transition
  await logEvent({
    missionId,
    eventType: `mission_${newStatus === "awaiting_approval" ? "approved" : newStatus}` as any,
    severity: newStatus === "failed" ? "error" : "info",
    message: `Mission transitioned from ${previousStatus} to ${newStatus}`,
    actor: userId ?? "system",
    details: { previousStatus, newStatus, metadata },
  });

  return {
    success: true,
    previousState: previousStatus,
    newState: newStatus,
  };
}

// ============================================================================
// PHASE STATE OPERATIONS
// ============================================================================

export async function transitionPhase(
  phaseId: string,
  newStatus: PhaseStatus,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; previousState?: PhaseStatus }> {
  const [phase] = await db.select().from(missionPhasesTable).where(eq(missionPhasesTable.id, phaseId));
  
  if (!phase) {
    return { success: false, error: "Phase not found" };
  }

  const previousStatus = phase.status as PhaseStatus;
  
  if (!canTransitionPhase(previousStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid transition: ${previousStatus} → ${newStatus}`,
      previousState: previousStatus,
    };
  }

  const updateData: Partial<typeof phase> = {
    status: newStatus,
  };

  if (newStatus === "in_progress" && !phase.startedAt) {
    updateData.startedAt = new Date();
  }
  
  if (newStatus === "completed") {
    updateData.completedAt = new Date();
  }

  await db.update(missionPhasesTable).set(updateData).where(eq(missionPhasesTable.id, phaseId));

  // Log the transition
  await logEvent({
    missionId: phase.missionId,
    phaseId,
    eventType: `phase_${newStatus}` as any,
    severity: newStatus === "failed" ? "error" : "info",
    message: `Phase "${phase.name}" transitioned from ${previousStatus} to ${newStatus}`,
    actor: userId ?? "system",
    details: { phaseName: phase.name, previousStatus, newStatus, metadata },
  });

  // Update mission progress
  await updateMissionProgress(phase.missionId);

  return { success: true, previousState: previousStatus };
}

// ============================================================================
// TASK STATE OPERATIONS
// ============================================================================

export async function transitionTask(
  taskId: string,
  newStatus: TaskStatus,
  userId?: string,
  metadata?: { result?: string; error?: string }
): Promise<{ success: boolean; error?: string; previousState?: TaskStatus }> {
  const [task] = await db.select().from(missionTasksTable).where(eq(missionTasksTable.id, taskId));
  
  if (!task) {
    return { success: false, error: "Task not found" };
  }

  const previousStatus = task.status as TaskStatus;
  
  if (!canTransitionTask(previousStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid transition: ${previousStatus} → ${newStatus}`,
      previousState: previousStatus,
    };
  }

  const updateData: Partial<typeof task> = {
    status: newStatus,
  };

  if (newStatus === "in_progress" && !task.startedAt) {
    updateData.startedAt = new Date();
  }
  
  if (newStatus === "completed") {
    updateData.completedAt = new Date();
    if (metadata?.result) {
      updateData.result = metadata.result;
    }
  }
  
  if (newStatus === "failed" && metadata?.error) {
    updateData.errorMessage = metadata.error;
    updateData.completedAt = new Date();
  }

  await db.update(missionTasksTable).set(updateData).where(eq(missionTasksTable.id, taskId));

  // Log the transition
  await logEvent({
    missionId: task.missionId,
    phaseId: task.phaseId ?? undefined,
    taskId,
    eventType: `task_${newStatus}` as any,
    severity: newStatus === "failed" ? "error" : "info",
    message: `Task "${task.name}" transitioned from ${previousStatus} to ${newStatus}`,
    actor: userId ?? "system",
    details: { taskName: task.name, previousStatus, newStatus, ...metadata },
  });

  // Update phase and mission progress
  if (task.phaseId) {
    await updatePhaseProgress(task.phaseId);
  }
  await updateMissionProgress(task.missionId);

  return { success: true, previousState: previousStatus };
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

async function updatePhaseProgress(phaseId: string): Promise<void> {
  const phase = await db.select().from(missionPhasesTable).where(eq(missionPhasesTable.id, phaseId));
  if (!phase[0]) return;

  const tasks = await db
    .select()
    .from(missionTasksTable)
    .where(eq(missionTasksTable.phaseId, phaseId));

  if (tasks.length === 0) return;

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progress = Math.round((completedTasks / tasks.length) * 100);

  await db
    .update(missionPhasesTable)
    .set({ progress })
    .where(eq(missionPhasesTable.id, phaseId));

  // If all tasks completed, mark phase as completed
  if (progress === 100) {
    await transitionPhase(phaseId, "completed");
  }
}

async function updateMissionProgress(missionId: string): Promise<void> {
  const phases = await db
    .select()
    .from(missionPhasesTable)
    .where(eq(missionPhasesTable.missionId, missionId))
    .orderBy(missionPhasesTable.order);

  if (phases.length === 0) return;

  const totalProgress = phases.reduce((sum, p) => sum + p.progress, 0);
  const progress = Math.round(totalProgress / phases.length);

  await db
    .update(missionsTable)
    .set({ progress, currentPhase: phases.find(p => p.status === "in_progress")?.id ?? null })
    .where(eq(missionsTable.id, missionId));
}

// ============================================================================
// STATE QUERY HELPERS
// ============================================================================

export async function getMissionState(missionId: string): Promise<{
  mission: typeof missionsTable.$inferSelect | null;
  phases: typeof missionPhasesTable.$inferSelect[];
  tasks: typeof missionTasksTable.$inferSelect[];
}> {
  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));
  
  if (!mission) {
    return { mission: null, phases: [], tasks: [] };
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

  return { mission, phases, tasks };
}

export async function getNextExecutableTask(missionId: string): Promise<typeof missionTasksTable.$inferSelect | null> {
  // Get all pending/in_progress tasks ordered by phase order, then task order
  const tasks = await db
    .select()
    .from(missionTasksTable)
    .where(eq(missionTasksTable.missionId, missionId))
    .orderBy(missionTasksTable.order);

  // Find first pending task whose phase is not blocked/paused
  for (const task of tasks) {
    if (task.status === "pending") {
      const [phase] = await db
        .select()
        .from(missionPhasesTable)
        .where(eq(missionPhasesTable.id, task.phaseId!));
      
      if (phase && !["skipped", "paused"].includes(phase.status)) {
        return task;
      }
    }
  }

  return null;
}
