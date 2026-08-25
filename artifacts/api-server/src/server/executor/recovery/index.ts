/**
 * DEVIL Executor Foundation - Recovery Engine
 * 
 * Handles tool failures, timeouts, validation failures, and sandbox crashes.
 * Implements recovery actions: RETRY, SKIP, PAUSE, REQUEST_APPROVAL, FAIL_MISSION
 */

import { logEvent } from "../../control-plane/eventLog";
import { 
  ExecutorState, 
  ExecutorStateType, 
  transitionExecutorState,
  getExecutorByMission,
  getExecutor 
} from "../stateMachine";
import { executionQueue } from "../queue";

// ============================================================================
// RECOVERY TYPES
// ============================================================================

export const RecoveryAction = {
  RETRY: "retry",
  SKIP: "skip",
  PAUSE: "pause",
  REQUEST_APPROVAL: "request_approval",
  FAIL_MISSION: "fail_mission",
  CONTINUE: "continue",
} as const;

export type RecoveryActionType = (typeof RecoveryAction)[keyof typeof RecoveryAction];

export const FailureType = {
  TOOL_FAILURE: "tool_failure",
  TIMEOUT: "timeout",
  VALIDATION_FAILURE: "validation_failure",
  SANDBOX_CRASH: "sandbox_crash",
  RESOURCE_EXHAUSTED: "resource_exhausted",
  DEPENDENCY_FAILURE: "dependency_failure",
  UNKNOWN: "unknown",
} as const;

export type FailureTypeType = (typeof FailureType)[keyof typeof FailureType];

export interface RecoveryContext {
  missionId: string;
  taskId: string;
  executorId?: string;
  phaseId?: string;
  failureType: FailureTypeType;
  error: string;
  attempt: number;
  maxRetries: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface RecoveryResult {
  action: RecoveryActionType;
  reason: string;
  retryDelay?: number;      // ms to wait before retry
  canProceed?: boolean;
  blocked?: boolean;
  blockedReason?: string;
}

// ============================================================================
// RECOVERY RULES
// ============================================================================

export interface RecoveryRule {
  failureType: FailureTypeType | "*";
  condition?: (context: RecoveryContext) => boolean;
  maxRetries?: number;
  retryDelay?: number;
  action: RecoveryActionType;
  priority: number;  // Higher priority rules evaluated first
}

export const DEFAULT_RECOVERY_RULES: RecoveryRule[] = [
  // Timeout failures - retry with backoff
  {
    failureType: FailureType.TIMEOUT,
    condition: (ctx) => ctx.attempt < 3,
    retryDelay: 5000,
    action: RecoveryAction.RETRY,
    priority: 100,
  },
  {
    failureType: FailureType.TIMEOUT,
    condition: (ctx) => ctx.attempt >= 3,
    action: RecoveryAction.PAUSE,
    priority: 90,
  },

  // Tool failures - retry a few times then skip
  {
    failureType: FailureType.TOOL_FAILURE,
    condition: (ctx) => ctx.attempt < 2,
    retryDelay: 2000,
    action: RecoveryAction.RETRY,
    priority: 100,
  },
  {
    failureType: FailureType.TOOL_FAILURE,
    condition: (ctx) => ctx.attempt >= 2 && ctx.attempt < 5,
    action: RecoveryAction.SKIP,
    priority: 80,
  },
  {
    failureType: FailureType.TOOL_FAILURE,
    condition: (ctx) => ctx.attempt >= 5,
    action: RecoveryAction.FAIL_MISSION,
    priority: 70,
  },

  // Validation failures - pause for review
  {
    failureType: FailureType.VALIDATION_FAILURE,
    action: RecoveryAction.PAUSE,
    priority: 95,
  },

  // Sandbox crashes - retry or pause
  {
    failureType: FailureType.SANDBOX_CRASH,
    condition: (ctx) => ctx.attempt < 2,
    retryDelay: 3000,
    action: RecoveryAction.RETRY,
    priority: 90,
  },
  {
    failureType: FailureType.SANDBOX_CRASH,
    condition: (ctx) => ctx.attempt >= 2,
    action: RecoveryAction.PAUSE,
    priority: 85,
  },

  // Resource exhaustion - pause immediately
  {
    failureType: FailureType.RESOURCE_EXHAUSTED,
    action: RecoveryAction.PAUSE,
    priority: 100,
  },

  // Dependency failures - skip if possible
  {
    failureType: FailureType.DEPENDENCY_FAILURE,
    action: RecoveryAction.SKIP,
    priority: 70,
  },

  // Unknown failures - pause by default
  {
    failureType: FailureType.UNKNOWN,
    condition: (ctx) => ctx.attempt < 3,
    retryDelay: 1000,
    action: RecoveryAction.RETRY,
    priority: 50,
  },
  {
    failureType: FailureType.UNKNOWN,
    action: RecoveryAction.PAUSE,
    priority: 40,
  },
];

// ============================================================================
// RECOVERY ENGINE
// ============================================================================

export class RecoveryEngine {
  private rules: RecoveryRule[];
  private history: Map<string, RecoveryContext[]> = new Map();

  constructor(rules?: RecoveryRule[]) {
    this.rules = rules ?? [...DEFAULT_RECOVERY_RULES];
    // Sort by priority (descending)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add a custom recovery rule
   */
  addRule(rule: RecoveryRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Handle a task failure and determine recovery action
   */
  async handleFailure(
    missionId: string,
    taskId: string,
    error: string,
    options?: {
      failureType?: FailureTypeType;
      executorId?: string;
      phaseId?: string;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<RecoveryResult> {
    const executor = options?.executorId 
      ? getExecutor(options.executorId)
      : getExecutorByMission(missionId);

    // Determine failure type from error message
    const failureType = options?.failureType ?? this.classifyError(error);

    // Get recovery attempts for this task
    const history = this.history.get(taskId) ?? [];
    const attempt = history.length + 1;
    const maxRetries = options?.maxRetries ?? 5;

    // Create recovery context
    const context: RecoveryContext = {
      missionId,
      taskId,
      executorId: executor?.id,
      phaseId: options?.phaseId ?? executor?.currentPhaseId ?? undefined,
      failureType,
      error,
      attempt,
      maxRetries,
      timestamp: new Date(),
      metadata: options?.metadata,
    };

    // Add to history
    history.push(context);
    this.history.set(taskId, history);

    // Log the failure
    await logEvent({
      missionId,
      taskId,
      eventType: "task_failed",
      severity: "error",
      message: `Task failed: ${taskId}`,
      actor: "system",
      details: {
        failureType,
        error,
        attempt,
        maxRetries,
      },
    });

    // Determine recovery action
    const result = this.determineRecoveryAction(context);

    // Log the recovery decision
    await logEvent({
      missionId,
      taskId,
      eventType: result.action === RecoveryAction.PAUSE ? "mission_blocked" : "validation_warning",
      severity: result.action === RecoveryAction.FAIL_MISSION ? "critical" : "warning",
      message: `Recovery action: ${result.action}`,
      actor: "system",
      details: {
        action: result.action,
        reason: result.reason,
        failureType,
        attempt,
      },
    });

    // Execute the recovery action
    await this.executeRecoveryAction(context, result);

    return result;
  }

  /**
   * Classify error into failure type
   */
  private classifyError(error: string): FailureTypeType {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("timeout") || errorLower.includes("timed out")) {
      return FailureType.TIMEOUT;
    }
    
    if (errorLower.includes("validation") || errorLower.includes("invalid")) {
      return FailureType.VALIDATION_FAILURE;
    }
    
    if (errorLower.includes("sandbox") || errorLower.includes("container")) {
      return FailureType.SANDBOX_CRASH;
    }
    
    if (errorLower.includes("memory") || errorLower.includes("cpu") || errorLower.includes("disk") || errorLower.includes("resource")) {
      return FailureType.RESOURCE_EXHAUSTED;
    }
    
    if (errorLower.includes("dependency") || errorLower.includes("import") || errorLower.includes("module")) {
      return FailureType.DEPENDENCY_FAILURE;
    }
    
    if (errorLower.includes("tool") || errorLower.includes("command") || errorLower.includes("failed")) {
      return FailureType.TOOL_FAILURE;
    }

    return FailureType.UNKNOWN;
  }

  /**
   * Determine recovery action based on rules
   */
  private determineRecoveryAction(context: RecoveryContext): RecoveryResult {
    for (const rule of this.rules) {
      // Check if rule matches failure type
      if (rule.failureType !== "*" && rule.failureType !== context.failureType) {
        continue;
      }

      // Check if condition is met
      if (rule.condition && !rule.condition(context)) {
        continue;
      }

      // Check retry limit
      if (rule.action === RecoveryAction.RETRY && rule.maxRetries !== undefined) {
        if (context.attempt > rule.maxRetries) {
          // Find fallback rule
          continue;
        }
      }

      // Return the matching rule's action
      return {
        action: rule.action,
        reason: `Rule matched: ${rule.failureType} (priority: ${rule.priority})`,
        retryDelay: rule.retryDelay,
        canProceed: rule.action !== RecoveryAction.PAUSE && rule.action !== RecoveryAction.FAIL_MISSION,
        blocked: rule.action === RecoveryAction.PAUSE || rule.action === RecoveryAction.REQUEST_APPROVAL,
        blockedReason: rule.action === RecoveryAction.PAUSE 
          ? `Paused due to ${context.failureType} after ${context.attempt} attempts`
          : rule.action === RecoveryAction.REQUEST_APPROVAL
            ? "Approval required to continue"
            : undefined,
      };
    }

    // Default fallback
    return {
      action: RecoveryAction.PAUSE,
      reason: "No matching rule, defaulting to pause",
      blocked: true,
      blockedReason: "No recovery rule matched, manual intervention required",
    };
  }

  /**
   * Execute the recovery action
   */
  private async executeRecoveryAction(context: RecoveryContext, result: RecoveryResult): Promise<void> {
    switch (result.action) {
      case RecoveryAction.RETRY:
        // Task will be re-queued by the queue manager
        // Add delay if specified
        if (result.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, result.retryDelay!));
        }
        break;

      case RecoveryAction.SKIP:
        // Mark task as skipped in queue
        executionQueue.skipTask(context.taskId, `Skipped due to recovery: ${context.error}`);
        break;

      case RecoveryAction.PAUSE:
        // Transition executor to paused state
        const executor = context.executorId 
          ? getExecutor(context.executorId)
          : getExecutorByMission(context.missionId);
        
        if (executor) {
          await transitionExecutorState(
            executor.id,
            ExecutorState.PAUSED,
            "system",
            { reason: result.blockedReason ?? "Recovery pause" }
          );
        }
        break;

      case RecoveryAction.REQUEST_APPROVAL:
        // Transition to awaiting approval
        const exec = context.executorId 
          ? getExecutor(context.executorId)
          : getExecutorByMission(context.missionId);
        
        if (exec) {
          await transitionExecutorState(
            exec.id,
            ExecutorState.AWAITING_APPROVAL,
            "system",
            { reason: "Approval required for recovery" }
          );
        }
        break;

      case RecoveryAction.FAIL_MISSION:
        // Mark mission as failed
        const executor2 = context.executorId 
          ? getExecutor(context.executorId)
          : getExecutorByMission(context.missionId);
        
        if (executor2) {
          await transitionExecutorState(
            executor2.id,
            ExecutorState.FAILED,
            "system",
            { error: `Mission failed: ${context.error}` }
          );
        }
        break;

      case RecoveryAction.CONTINUE:
        // No action needed
        break;
    }
  }

  /**
   * Get recovery history for a task
   */
  getHistory(taskId: string): RecoveryContext[] {
    return this.history.get(taskId) ?? [];
  }

  /**
   * Get recovery statistics
   */
  getStats(): {
    totalFailures: number;
    byType: Record<FailureTypeType, number>;
    byAction: Record<RecoveryActionType, number>;
    averageAttempts: number;
  } {
    const allContexts = Array.from(this.history.values()).flat();
    
    const byType: Record<FailureTypeType, number> = {} as any;
    const byAction: Record<RecoveryActionType, number> = {} as any;
    let totalAttempts = 0;

    for (const ctx of allContexts) {
      byType[ctx.failureType] = (byType[ctx.failureType] ?? 0) + 1;
      totalAttempts += ctx.attempt;

      // Determine what action was taken (simplified)
      if (ctx.attempt <= 2) {
        byAction[RecoveryAction.RETRY] = (byAction[RecoveryAction.RETRY] ?? 0) + 1;
      } else if (ctx.attempt <= 5) {
        byAction[RecoveryAction.SKIP] = (byAction[RecoveryAction.SKIP] ?? 0) + 1;
      } else {
        byAction[RecoveryAction.PAUSE] = (byAction[RecoveryAction.PAUSE] ?? 0) + 1;
      }
    }

    return {
      totalFailures: allContexts.length,
      byType,
      byAction,
      averageAttempts: allContexts.length > 0 ? totalAttempts / allContexts.length : 0,
    };
  }

  /**
   * Clear recovery history
   */
  clearHistory(taskId?: string): void {
    if (taskId) {
      this.history.delete(taskId);
    } else {
      this.history.clear();
    }
  }
}

// ============================================================================
// DEFAULT RECOVERY ENGINE INSTANCE
// ============================================================================

export const defaultRecoveryEngine = new RecoveryEngine();

// ============================================================================
// VALIDATION FAILURE HANDLER
// ============================================================================

export interface ValidationFailure {
  rule: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  canProceed: boolean;
}

export async function handleValidationFailure(
  missionId: string,
  taskId: string,
  failures: ValidationFailure[]
): Promise<RecoveryResult> {
  const criticalFailures = failures.filter(f => f.severity === "critical" && !f.canProceed);
  const errorFailures = failures.filter(f => f.severity === "error" && !f.canProceed);

  // Log all failures
  for (const failure of failures) {
    await logEvent({
      missionId,
      taskId,
      eventType: "validation_failed",
      severity: failure.severity,
      message: `Validation failed: ${failure.rule}`,
      actor: "system",
      details: { rule: failure.rule, message: failure.message },
    });
  }

  if (criticalFailures.length > 0) {
    return {
      action: RecoveryAction.FAIL_MISSION,
      reason: `Critical validation failures: ${criticalFailures.map(f => f.rule).join(", ")}`,
      blocked: true,
    };
  }

  if (errorFailures.length > 0) {
    return {
      action: RecoveryAction.PAUSE,
      reason: `Validation errors require review: ${errorFailures.map(f => f.rule).join(", ")}`,
      blocked: true,
      blockedReason: "Validation errors detected, manual review required",
    };
  }

  // Warnings can proceed
  return {
    action: RecoveryAction.CONTINUE,
    reason: "Only warnings, proceeding",
    canProceed: true,
  };
}
