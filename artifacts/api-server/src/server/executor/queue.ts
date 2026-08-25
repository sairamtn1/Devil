/**
 * DEVIL Executor Foundation - Execution Queue
 * 
 * Manages task execution queue with priorities and dependencies.
 */

import { logEvent } from "../control-plane/eventLog";
import { ExecutorState, ExecutorStateType } from "./stateMachine";

// ============================================================================
// QUEUE TYPES
// ============================================================================

export const QueuePriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export type QueuePriorityType = (typeof QueuePriority)[keyof typeof QueuePriority];

export interface QueuedTask {
  id: string;
  missionId: string;
  phaseId: string;
  taskId: string;
  priority: QueuePriorityType;
  status: "pending" | "queued" | "executing" | "completed" | "failed" | "skipped";
  dependencies: string[];  // Task IDs that must complete first
  result?: unknown;
  error?: string;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retries: number;
  maxRetries: number;
}

export interface QueueStats {
  total: number;
  pending: number;
  executing: number;
  completed: number;
  failed: number;
  byPriority: Record<QueuePriorityType, number>;
}

// ============================================================================
// EXECUTION QUEUE
// ============================================================================

export class ExecutionQueue {
  private tasks: Map<string, QueuedTask> = new Map();
  private pendingQueue: string[] = [];  // Queue of task IDs (ordered by priority)
  private missionQueues: Map<string, string[]> = new Map();  // missionId -> taskIds

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  enqueue(task: Omit<QueuedTask, "status" | "queuedAt" | "retries">): QueuedTask {
    const queuedTask: QueuedTask = {
      ...task,
      status: "pending",
      queuedAt: new Date(),
      retries: 0,
    };

    this.tasks.set(task.taskId, queuedTask);
    this.pendingQueue.push(task.taskId);
    
    // Add to mission queue
    if (!this.missionQueues.has(task.missionId)) {
      this.missionQueues.set(task.missionId, []);
    }
    this.missionQueues.get(task.missionId)!.push(task.taskId);

    // Sort by priority (higher priority first)
    this.sortQueue();

    return queuedTask;
  }

  dequeue(): QueuedTask | null {
    // Find next task whose dependencies are satisfied
    for (let i = 0; i < this.pendingQueue.length; i++) {
      const taskId = this.pendingQueue[i];
      const task = this.tasks.get(taskId);
      
      if (task && this.areDependenciesSatisfied(task)) {
        // Remove from pending queue
        this.pendingQueue.splice(i, 1);
        
        // Update task status
        task.status = "queued";
        
        return task;
      }
    }
    
    return null;
  }

  getTask(taskId: string): QueuedTask | undefined {
    return this.tasks.get(taskId);
  }

  getTasksByMission(missionId: string): QueuedTask[] {
    const taskIds = this.missionQueues.get(missionId) ?? [];
    return taskIds
      .map(id => this.tasks.get(id))
      .filter((t): t is QueuedTask => t !== undefined);
  }

  getNextExecutableTask(missionId?: string): QueuedTask | null {
    for (const taskId of this.pendingQueue) {
      const task = this.tasks.get(taskId);
      
      if (task && (!missionId || task.missionId === missionId)) {
        if (this.areDependenciesSatisfied(task)) {
          return task;
        }
      }
    }
    
    return null;
  }

  // ============================================================================
  // TASK STATE UPDATES
  // ============================================================================

  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (task && task.status === "queued") {
      task.status = "executing";
      task.startedAt = new Date();
      return true;
    }
    
    return false;
  }

  completeTask(taskId: string, result?: unknown): boolean {
    const task = this.tasks.get(taskId);
    
    if (task && task.status === "executing") {
      task.status = "completed";
      task.completedAt = new Date();
      task.result = result;

      logEvent({
        missionId: task.missionId,
        taskId: task.taskId,
        eventType: "task_completed",
        severity: "info",
        message: `Task completed: ${taskId}`,
        details: { taskId, result },
      });

      return true;
    }
    
    return false;
  }

  failTask(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }

    task.retries++;
    task.error = error;

    if (task.retries < task.maxRetries) {
      // Re-queue for retry
      task.status = "pending";
      this.pendingQueue.push(taskId);
      this.sortQueue();

      logEvent({
        missionId: task.missionId,
        taskId: task.taskId,
        eventType: "validation_warning",
        severity: "warning",
        message: `Task failed, retrying (${task.retries}/${task.maxRetries}): ${taskId}`,
        details: { taskId, error, retry: task.retries },
      });
    } else {
      // Max retries reached
      task.status = "failed";
      task.completedAt = new Date();

      logEvent({
        missionId: task.missionId,
        taskId: task.taskId,
        eventType: "task_failed",
        severity: "error",
        message: `Task failed after ${task.maxRetries} retries: ${taskId}`,
        details: { taskId, error },
      });
    }
    
    return true;
  }

  skipTask(taskId: string, reason?: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (task && (task.status === "pending" || task.status === "queued")) {
      task.status = "skipped";
      task.completedAt = new Date();
      task.error = reason ?? "Skipped";

      logEvent({
        missionId: task.missionId,
        taskId: task.taskId,
        eventType: "task_skipped",
        severity: "info",
        message: `Task skipped: ${taskId}`,
        details: { taskId, reason },
      });

      return true;
    }
    
    return false;
  }

  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }

    // Remove from pending queue
    const idx = this.pendingQueue.indexOf(taskId);
    if (idx > -1) {
      this.pendingQueue.splice(idx, 1);
    }

    // Remove from mission queue
    const missionTasks = this.missionQueues.get(task.missionId);
    if (missionTasks) {
      const mIdx = missionTasks.indexOf(taskId);
      if (mIdx > -1) {
        missionTasks.splice(mIdx, 1);
      }
    }

    return this.tasks.delete(taskId);
  }

  // ============================================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================================

  areDependenciesSatisfied(task: QueuedTask): boolean {
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      
      if (!depTask) {
        continue;  // Dependency not found, assume satisfied
      }
      
      if (depTask.status !== "completed" && depTask.status !== "skipped") {
        return false;
      }
    }
    
    return true;
  }

  getBlockedTasks(missionId?: string): QueuedTask[] {
    const blocked: QueuedTask[] = [];
    
    for (const taskId of this.pendingQueue) {
      const task = this.tasks.get(taskId);
      
      if (task && (!missionId || task.missionId === missionId)) {
        if (!this.areDependenciesSatisfied(task)) {
          blocked.push(task);
        }
      }
    }
    
    return blocked;
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  private sortQueue(): void {
    this.pendingQueue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);
      
      if (!taskA || !taskB) return 0;
      
      // Sort by priority (higher first)
      if (taskA.priority !== taskB.priority) {
        return taskB.priority - taskA.priority;
      }
      
      // Then by queue order (FIFO)
      return taskA.queuedAt.getTime() - taskB.queuedAt.getTime();
    });
  }

  clear(missionId?: string): number {
    let count = 0;
    
    if (missionId) {
      const taskIds = this.missionQueues.get(missionId) ?? [];
      
      for (const taskId of taskIds) {
        if (this.removeTask(taskId)) {
          count++;
        }
      }
      
      this.missionQueues.delete(missionId);
    } else {
      count = this.tasks.size;
      this.tasks.clear();
      this.pendingQueue = [];
      this.missionQueues.clear();
    }
    
    return count;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getStats(missionId?: string): QueueStats {
    const tasks = missionId 
      ? this.getTasksByMission(missionId)
      : Array.from(this.tasks.values());

    const stats: QueueStats = {
      total: tasks.length,
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      byPriority: {
        [QueuePriority.LOW]: 0,
        [QueuePriority.NORMAL]: 0,
        [QueuePriority.HIGH]: 0,
        [QueuePriority.CRITICAL]: 0,
      },
    };

    for (const task of tasks) {
      switch (task.status) {
        case "pending":
        case "queued":
          stats.pending++;
          break;
        case "executing":
          stats.executing++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "failed":
        case "skipped":
          stats.failed++;
          break;
      }
      
      if (task.status === "pending" || task.status === "queued") {
        stats.byPriority[task.priority]++;
      }
    }

    return stats;
  }

  isEmpty(missionId?: string): boolean {
    if (missionId) {
      const taskIds = this.missionQueues.get(missionId) ?? [];
      return taskIds.every(id => {
        const task = this.tasks.get(id);
        return !task || task.status !== "pending";
      });
    }
    
    return this.pendingQueue.length === 0;
  }

  getQueueLength(missionId?: string): number {
    if (missionId) {
      const taskIds = this.missionQueues.get(missionId) ?? [];
      return taskIds.filter(id => {
        const task = this.tasks.get(id);
        return task && (task.status === "pending" || task.status === "queued");
      }).length;
    }
    
    return this.pendingQueue.length;
  }
}

// ============================================================================
// DEFAULT QUEUE INSTANCE
// ============================================================================

export const executionQueue = new ExecutionQueue();

// ============================================================================
// MISSION QUEUE HELPERS
// ============================================================================

export interface MissionQueueSummary {
  missionId: string;
  totalTasks: number;
  pendingTasks: number;
  executingTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  progress: number;
}

export async function getMissionQueueSummary(missionId: string): Promise<MissionQueueSummary> {
  const tasks = executionQueue.getTasksByMission(missionId);
  const stats = executionQueue.getStats(missionId);
  const blocked = executionQueue.getBlockedTasks(missionId);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    missionId,
    totalTasks,
    pendingTasks: stats.pending,
    executingTasks: stats.executing,
    completedTasks,
    failedTasks: tasks.filter(t => t.status === "failed").length,
    blockedTasks: blocked.length,
    progress,
  };
}
