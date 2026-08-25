/**
 * DEVIL Control Plane - Validation Layer
 * 
 * Four-stage validation system:
 * 1. Pre-Execution Validation - Before any action
 * 2. Continuous Validation - During execution
 * 3. Post-Execution Validation - After completion
 * 4. Resume Validation - After crash recovery
 * 
 * Provides conservative, fail-safe validation with clear error classification.
 */

import { db, missionsTable, missionPhasesTable, missionTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logEvent } from "./eventLog";

// ============================================================================
// VALIDATION SEVERITY LEVELS
// ============================================================================

export const ValidationSeverity = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export type ValidationSeverityType = (typeof ValidationSeverity)[keyof typeof ValidationSeverity];

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  severity: ValidationSeverityType;
  rule: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  canProceed: boolean; // false for ERROR and CRITICAL
}

export interface ValidationReport {
  timestamp: Date;
  target: string;
  targetId: string;
  validationType: string;
  overallPassed: boolean;
  overallSeverity: ValidationSeverityType;
  results: ValidationResult[];
  blocked: boolean;
  blockedReason?: string;
}

// ============================================================================
// PRE-EXECUTION VALIDATION
// ============================================================================

export interface PreExecutionValidationInput {
  target: "mission" | "phase" | "task";
  targetId: string;
  requestedAction?: string;
}

// Mission pre-execution validation
async function validateMissionPreExecution(
  missionId: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));

  if (!mission) {
    results.push({
      passed: false,
      severity: ValidationSeverity.CRITICAL,
      rule: "mission_exists",
      message: "Mission does not exist",
      canProceed: false,
      timestamp: new Date(),
    });
    return results;
  }

  // Check mission has goal
  if (!mission.goal || mission.goal.trim().length < 3) {
    results.push({
      passed: false,
      severity: ValidationSeverity.ERROR,
      rule: "mission_has_goal",
      message: "Mission goal is missing or too short",
      canProceed: false,
      timestamp: new Date(),
    });
  }

  // Check mission state allows execution
  const nonExecutableStates = ["cancelled", "failed", "succeeded"];
  if (nonExecutableStates.includes(mission.status)) {
    results.push({
      passed: false,
      severity: ValidationSeverity.ERROR,
      rule: "mission_state_valid",
      message: `Mission is in non-executable state: ${mission.status}`,
      canProceed: false,
      timestamp: new Date(),
    });
  }

  // Check for pending approvals
  if (mission.status === "awaiting_approval") {
    results.push({
      passed: false,
      severity: ValidationSeverity.WARNING,
      rule: "no_pending_approvals",
      message: "Mission has pending approvals",
      canProceed: true, // Warning, not blocking
      timestamp: new Date(),
    });
  }

  // Check mission is not blocked
  if (mission.status === "blocked") {
    results.push({
      passed: false,
      severity: ValidationSeverity.ERROR,
      rule: "mission_not_blocked",
      message: "Mission is blocked",
      canProceed: false,
      timestamp: new Date(),
    });
  }

  return results;
}

// Phase pre-execution validation
async function validatePhasePreExecution(phaseId: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const [phase] = await db.select().from(missionPhasesTable).where(eq(missionPhasesTable.id, phaseId));

  if (!phase) {
    results.push({
      passed: false,
      severity: ValidationSeverity.CRITICAL,
      rule: "phase_exists",
      message: "Phase does not exist",
      canProceed: false,
      timestamp: new Date(),
    });
    return results;
  }

  // Check phase dependencies
  if (phase.dependencies && Array.isArray(phase.dependencies)) {
    for (const depId of phase.dependencies) {
      const [depPhase] = await db.select().from(missionPhasesTable).where(eq(missionPhasesTable.id, depId));
      if (!depPhase) {
        results.push({
          passed: false,
          severity: ValidationSeverity.ERROR,
          rule: "dependency_exists",
          message: `Dependent phase ${depId} does not exist`,
          canProceed: false,
          timestamp: new Date(),
        });
      } else if (depPhase.status !== "completed") {
        results.push({
          passed: false,
          severity: ValidationSeverity.ERROR,
          rule: "dependency_completed",
          message: `Dependent phase "${depPhase.name}" is not completed (${depPhase.status})`,
          canProceed: false,
          timestamp: new Date(),
        });
      }
    }
  }

  // Check phase is in executable state
  const nonExecutableStates = ["skipped", "paused", "failed"];
  if (nonExecutableStates.includes(phase.status)) {
    results.push({
      passed: false,
      severity: phase.status === "failed" ? ValidationSeverity.ERROR : ValidationSeverity.WARNING,
      rule: "phase_state_valid",
      message: `Phase is in non-executable state: ${phase.status}`,
      canProceed: false,
      timestamp: new Date(),
    });
  }

  // Check approval status
  if (phase.approvalRequired && !phase.autoApproved && phase.status === "pending") {
    results.push({
      passed: false,
      severity: ValidationSeverity.ERROR,
      rule: "phase_approved",
      message: "Phase requires approval before execution",
      canProceed: false,
      timestamp: new Date(),
    });
  }

  return results;
}

// Task pre-execution validation
async function validateTaskPreExecution(taskId: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const [task] = await db.select().from(missionTasksTable).where(eq(missionTasksTable.id, taskId));

  if (!task) {
    results.push({
      passed: false,
      severity: ValidationSeverity.CRITICAL,
      rule: "task_exists",
      message: "Task does not exist",
      canProceed: false,
      timestamp: new Date(),
    });
    return results;
  }

  // Check task dependencies (other tasks in same phase)
  if (task.phaseId) {
    const phaseTasks = await db
      .select()
      .from(missionTasksTable)
      .where(eq(missionTasksTable.phaseId, task.phaseId));

    for (const phaseTask of phaseTasks) {
      if (phaseTask.id !== taskId && phaseTask.order < task.order) {
        if (phaseTask.status !== "completed" && phaseTask.status !== "skipped") {
          results.push({
            passed: false,
            severity: ValidationSeverity.WARNING,
            rule: "task_dependency_met",
            message: `Previous task "${phaseTask.name}" not completed`,
            canProceed: true, // Warning only
            timestamp: new Date(),
          });
        }
      }
    }
  }

  // Check task is in pending state
  if (task.status !== "pending") {
    results.push({
      passed: task.status === "in_progress", // Allow resuming
      severity: task.status === "completed" ? ValidationSeverity.ERROR : ValidationSeverity.WARNING,
      rule: "task_state_valid",
      message: `Task is in state: ${task.status}`,
      canProceed: task.status === "in_progress",
      timestamp: new Date(),
    });
  }

  return results;
}

export async function preExecutionValidation(
  input: PreExecutionValidationInput
): Promise<ValidationReport> {
  let results: ValidationResult[] = [];

  switch (input.target) {
    case "mission":
      results = await validateMissionPreExecution(input.targetId);
      break;
    case "phase":
      results = await validatePhasePreExecution(input.targetId);
      break;
    case "task":
      results = await validateTaskPreExecution(input.targetId);
      break;
  }

  const blocked = results.some(r => !r.canProceed);
  const criticalErrors = results.filter(r => r.severity === ValidationSeverity.CRITICAL);
  const errors = results.filter(r => r.severity === ValidationSeverity.ERROR);

  let overallSeverity: ValidationSeverityType = ValidationSeverity.INFO;
  if (criticalErrors.length > 0) overallSeverity = ValidationSeverity.CRITICAL;
  else if (errors.length > 0) overallSeverity = ValidationSeverity.ERROR;
  else if (results.some(r => r.severity === ValidationSeverity.WARNING)) {
    overallSeverity = ValidationSeverity.WARNING;
  }

  const report: ValidationReport = {
    timestamp: new Date(),
    target: input.target,
    targetId: input.targetId,
    validationType: "pre_execution",
    overallPassed: !blocked,
    overallSeverity,
    results,
    blocked,
    blockedReason: blocked ? "One or more validation rules failed" : undefined,
  };

  // Log validation result
  await logEvent({
    missionId: input.target === "mission" ? input.targetId : undefined,
    eventType: blocked ? "validation_failed" : "validation_passed",
    severity: overallSeverity,
    message: `Pre-execution validation ${blocked ? "FAILED" : "passed"} for ${input.target} ${input.targetId}`,
    details: { report },
    actor: "system",
  });

  return report;
}

// ============================================================================
// CONTINUOUS VALIDATION
// ============================================================================

export interface ContinuousValidationInput {
  missionId: string;
  checks: Array<"runtime_errors" | "resource_usage" | "timeout" | "cost_threshold" | "tool_behavior">;
}

export interface ContinuousValidationResult {
  passed: boolean;
  checks: Array<{
    check: string;
    passed: boolean;
    details?: Record<string, unknown>;
  }>;
}

export function continuousValidation(input: ContinuousValidationInput): ContinuousValidationResult {
  const checks: ContinuousValidationResult["checks"] = [];

  // Placeholder implementations - these would integrate with actual monitoring
  for (const check of input.checks) {
    switch (check) {
      case "runtime_errors":
        checks.push({ check, passed: true, details: { errorCount: 0 } });
        break;
      case "resource_usage":
        checks.push({ check, passed: true, details: { cpu: "30%", memory: "45%" } });
        break;
      case "timeout":
        checks.push({ check, passed: true, details: { withinLimits: true } });
        break;
      case "cost_threshold":
        checks.push({ check, passed: true, details: { currentCost: 0, threshold: 100 } });
        break;
      case "tool_behavior":
        checks.push({ check, passed: true, details: { toolsExecuting: 0 } });
        break;
    }
  }

  return {
    passed: checks.every(c => c.passed),
    checks,
  };
}

// ============================================================================
// POST-EXECUTION VALIDATION
// ============================================================================

export interface PostExecutionValidationInput {
  target: "mission" | "phase" | "task";
  targetId: string;
  executionResult?: {
    success: boolean;
    output?: unknown;
    error?: string;
  };
}

export async function postExecutionValidation(
  input: PostExecutionValidationInput
): Promise<ValidationReport> {
  const results: ValidationResult[] = [];

  // Check execution result
  if (input.executionResult) {
    if (!input.executionResult.success) {
      results.push({
        passed: false,
        severity: ValidationSeverity.ERROR,
        rule: "execution_success",
        message: `Execution failed: ${input.executionResult.error ?? "Unknown error"}`,
        canProceed: false,
        timestamp: new Date(),
      });
    } else {
      results.push({
        passed: true,
        severity: ValidationSeverity.INFO,
        rule: "execution_success",
        message: "Execution completed successfully",
        canProceed: true,
        timestamp: new Date(),
      });
    }
  }

  // Additional validations based on target type
  if (input.target === "task") {
    const [task] = await db.select().from(missionTasksTable).where(eq(missionTasksTable.id, input.targetId));
    if (task) {
      // Check task has result or completed status
      if (task.status === "completed" && !task.result && !task.errorMessage) {
        results.push({
          passed: false,
          severity: ValidationSeverity.WARNING,
          rule: "task_has_result",
          message: "Task marked completed but has no result or error",
          canProceed: true,
          timestamp: new Date(),
        });
      }
    }
  }

  const blocked = results.some(r => !r.canProceed);

  return {
    timestamp: new Date(),
    target: input.target,
    targetId: input.targetId,
    validationType: "post_execution",
    overallPassed: !blocked,
    overallSeverity: blocked ? ValidationSeverity.ERROR : ValidationSeverity.INFO,
    results,
    blocked,
  };
}

// ============================================================================
// RESUME VALIDATION
// ============================================================================

export interface ResumeValidationInput {
  missionId: string;
}

export async function resumeValidation(input: ResumeValidationInput): Promise<ValidationReport> {
  const results: ValidationResult[] = [];
  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, input.missionId));

  if (!mission) {
    results.push({
      passed: false,
      severity: ValidationSeverity.CRITICAL,
      rule: "mission_exists",
      message: "Mission does not exist",
      canProceed: false,
      timestamp: new Date(),
    });
  } else {
    // Mission state check
    if (!["paused", "failed", "blocked"].includes(mission.status)) {
      results.push({
        passed: false,
        severity: ValidationSeverity.WARNING,
        rule: "mission_state_valid_for_resume",
        message: `Mission state ${mission.status} is not typical for resume`,
        canProceed: true,
        timestamp: new Date(),
      });
    }

    // Check phases and tasks are consistent
    const phases = await db
      .select()
      .from(missionPhasesTable)
      .where(eq(missionPhasesTable.missionId, input.missionId));

    if (phases.length === 0) {
      results.push({
        passed: false,
        severity: ValidationSeverity.WARNING,
        rule: "mission_has_phases",
        message: "Mission has no phases defined",
        canProceed: true,
        timestamp: new Date(),
      });
    }

    // Check workspace/artifacts exist
    results.push({
      passed: true,
      severity: ValidationSeverity.INFO,
      rule: "workspace_available",
      message: "Workspace validation placeholder - implement actual check",
      canProceed: true,
      details: { workspaceCheck: "pending" },
      timestamp: new Date(),
    });
  }

  const blocked = results.some(r => !r.canProceed && r.severity === ValidationSeverity.CRITICAL);

  return {
    timestamp: new Date(),
    target: "mission",
    targetId: input.missionId,
    validationType: "resume",
    overallPassed: !blocked,
    overallSeverity: blocked ? ValidationSeverity.CRITICAL : ValidationSeverity.INFO,
    results,
    blocked,
    blockedReason: blocked ? "Critical validation failure" : undefined,
  };
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `${context}: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      };
    }
    return { success: false, error: `${context}: Invalid data` };
  }
}
