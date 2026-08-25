/**
 * DEVIL Control Plane - Approval Engine
 * 
 * Manages approval requests and decisions for sensitive operations:
 * - Phase execution
 * - Tool usage
 * - GitHub writes
 * - Deployments
 * - Secret access
 * - Paid APIs
 * - Infrastructure changes
 * - Production actions
 * 
 * Provides action gating based on approval status.
 */

import { db, approvalsTable, missionsTable } from "@workspace/db";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import type { ApprovalType, ApprovalStatus } from "@workspace/db";
import { logEvent } from "./eventLog";
import { transitionMission } from "./stateMachine";

// ============================================================================
// APPROVAL TYPES AND POLICIES
// ============================================================================

// Operations that ALWAYS require approval
export const MANDATORY_APPROVAL_TYPES: ApprovalType[] = [
  "github_write",
  "deployment",
  "secret_access",
  "infrastructure",
  "production_action",
];

// Operations that may require approval based on context
export const CONTEXTUAL_APPROVAL_TYPES: ApprovalType[] = [
  "paid_api",
  "phase_execution",
  "tool_usage",
];

// Default timeout for approvals (in seconds)
const DEFAULT_APPROVAL_TIMEOUT = 3600; // 1 hour

// ============================================================================
// APPROVAL CREATION
// ============================================================================

export interface CreateApprovalInput {
  missionId: string;
  phaseId?: string;
  taskId?: string;
  type: ApprovalType;
  title: string;
  description?: string;
  justification?: string;
  riskAssessment?: string;
  expiresIn?: number; // seconds, default 1 hour
}

export async function createApproval(input: CreateApprovalInput): Promise<{
  approval: typeof approvalsTable.$inferSelect;
  requiresBlocking: boolean;
}> {
  const id = `approval-${crypto.randomUUID()}`;
  
  // Check if this type requires mandatory approval
  const requiresBlocking = MANDATORY_APPROVAL_TYPES.includes(input.type);

  // Set expiration time
  const expiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000)
    : new Date(Date.now() + DEFAULT_APPROVAL_TIMEOUT * 1000);

  const [approval] = await db.insert(approvalsTable).values({
    id,
    missionId: input.missionId,
    phaseId: input.phaseId ?? null,
    taskId: input.taskId ?? null,
    type: input.type,
    status: "pending",
    title: input.title,
    description: input.description ?? null,
    justification: input.justification ?? null,
    riskAssessment: input.riskAssessment ?? null,
    requestedAt: new Date(),
    expiresAt,
  }).returning();

  // Log the approval request
  await logEvent({
    missionId: input.missionId,
    phaseId: input.phaseId,
    taskId: input.taskId,
    eventType: "approval_requested",
    severity: "info",
    message: `Approval requested: ${input.title}`,
    actor: "system",
    details: {
      approvalId: id,
      approvalType: input.type,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // If this is a mandatory approval, transition mission to awaiting_approval
  if (requiresBlocking) {
    await transitionMission(input.missionId, "awaiting_approval", "system", {
      pendingApprovalId: id,
    });
  }

  return { approval, requiresBlocking };
}

// ============================================================================
// APPROVAL DECISIONS
// ============================================================================

export interface ApprovalDecisionInput {
  approvalId: string;
  approved: boolean;
  responderId?: string;
  response?: string;
}

export async function processApprovalDecision(input: ApprovalDecisionInput): Promise<{
  success: boolean;
  error?: string;
  missionResumed?: boolean;
}> {
  const [approval] = await db
    .select()
    .from(approvalsTable)
    .where(eq(approvalsTable.id, input.approvalId));

  if (!approval) {
    return { success: false, error: "Approval not found" };
  }

  if (approval.status !== "pending") {
    return { success: false, error: `Approval already ${approval.status}` };
  }

  // Check if approval has expired
  if (approval.expiresAt && new Date(approval.expiresAt) < new Date()) {
    await db
      .update(approvalsTable)
      .set({ status: "expired", respondedAt: new Date() })
      .where(eq(approvalsTable.id, input.approvalId));

    await logEvent({
      missionId: approval.missionId,
      eventType: "approval_timeout",
      severity: "warning",
      message: `Approval expired: ${approval.title}`,
      actor: input.responderId ?? "system",
    });

    return { success: false, error: "Approval has expired" };
  }

  const newStatus: ApprovalStatus = input.approved ? "approved" : "denied";

  // Update approval status
  await db
    .update(approvalsTable)
    .set({
      status: newStatus,
      respondedAt: new Date(),
      responderId: input.responderId ?? null,
      response: input.response ?? null,
    })
    .where(eq(approvalsTable.id, input.approvalId));

  // Log the decision
  await logEvent({
    missionId: approval.missionId,
    eventType: input.approved ? "approval_granted" : "approval_denied",
    severity: input.approved ? "info" : "warning",
    message: `Approval ${input.approved ? "granted" : "denied"}: ${approval.title}`,
    actor: input.responderId ?? "system",
    details: {
      approvalId: input.approvalId,
      response: input.response,
    },
  });

  // If approved and was blocking, resume the mission
  let missionResumed = false;
  if (input.approved && MANDATORY_APPROVAL_TYPES.includes(approval.type)) {
    const mission = await db
      .select()
      .from(missionsTable)
      .where(eq(missionsTable.id, approval.missionId));

    if (mission[0]?.status === "awaiting_approval") {
      await transitionMission(approval.missionId, "running", "system", {
        approvedBy: input.responderId,
      });
      missionResumed = true;
    }
  }

  return { success: true, missionResumed };
}

// ============================================================================
// APPROVAL QUERIES
// ============================================================================

export async function getPendingApprovals(missionId?: string): Promise<typeof approvalsTable.$inferSelect[]> {
  let query = db
    .select()
    .from(approvalsTable)
    .where(
      and(
        eq(approvalsTable.status, "pending"),
        missionId ? eq(approvalsTable.missionId, missionId) : undefined
      )
    )
    .orderBy(desc(approvalsTable.requestedAt));

  return query;
}

export async function getApprovalHistory(
  missionId: string,
  limit: number = 50
): Promise<typeof approvalsTable.$inferSelect[]> {
  return db
    .select()
    .from(approvalsTable)
    .where(eq(approvalsTable.missionId, missionId))
    .orderBy(desc(approvalsTable.requestedAt))
    .limit(limit);
}

export async function getApprovalById(approvalId: string): Promise<typeof approvalsTable.$inferSelect | null> {
  const [approval] = await db
    .select()
    .from(approvalsTable)
    .where(eq(approvalsTable.id, approvalId));
  return approval ?? null;
}

// ============================================================================
// APPROVAL CHECKS
// ============================================================================

export interface ApprovalCheckResult {
  approved: boolean;
  approvalId?: string;
  reason?: string;
}

export async function checkApproval(
  missionId: string,
  type: ApprovalType
): Promise<ApprovalCheckResult> {
  // Check for pending approval of this type
  const pending = await db
    .select()
    .from(approvalsTable)
    .where(
      and(
        eq(approvalsTable.missionId, missionId),
        eq(approvalsTable.type, type),
        eq(approvalsTable.status, "pending")
      )
    );

  if (pending.length > 0) {
    return {
      approved: false,
      approvalId: pending[0].id,
      reason: "Pending approval required",
    };
  }

  // Check for recent approved approval
  const approved = await db
    .select()
    .from(approvalsTable)
    .where(
      and(
        eq(approvalsTable.missionId, missionId),
        eq(approvalsTable.type, type),
        eq(approvalsTable.status, "approved")
      )
    )
    .orderBy(desc(approvalsTable.respondedAt))
    .limit(1);

  if (approved.length > 0) {
    const approval = approved[0];
    // Check if still valid (not expired)
    if (approval.expiresAt && new Date(approval.expiresAt) < new Date()) {
      return {
        approved: false,
        reason: "Previous approval has expired",
      };
    }
    return { approved: true };
  }

  // No approval found - check if required
  if (MANDATORY_APPROVAL_TYPES.includes(type)) {
    return {
      approved: false,
      reason: `Approval type ${type} requires explicit approval`,
    };
  }

  // No approval found and not required - allow by default
  return { approved: true };
}

// ============================================================================
// APPROVAL EXPIRATION HANDLER
// ============================================================================

export async function expireOldApprovals(): Promise<number> {
  const now = new Date();
  
  const expired = await db
    .select()
    .from(approvalsTable)
    .where(
      and(
        eq(approvalsTable.status, "pending"),
        isNotNull(approvalsTable.expiresAt)
      )
    );

  let count = 0;
  for (const approval of expired) {
    if (approval.expiresAt && new Date(approval.expiresAt) < now) {
      await db
        .update(approvalsTable)
        .set({ status: "expired" })
        .where(eq(approvalsTable.id, approval.id));

      await logEvent({
        missionId: approval.missionId,
        eventType: "approval_timeout",
        severity: "warning",
        message: `Approval expired: ${approval.title}`,
        actor: "system",
      });

      count++;
    }
  }

  return count;
}

// ============================================================================
// APPROVAL STATISTICS
// ============================================================================

export interface ApprovalStatistics {
  totalApprovals: number;
  pendingApprovals: number;
  approvedApprovals: number;
  deniedApprovals: number;
  expiredApprovals: number;
  averageResponseTime: number; // seconds
  byType: Record<string, number>;
}

export async function getApprovalStatistics(): Promise<ApprovalStatistics> {
  const allApprovals = await db.select().from(approvalsTable);

  const stats: ApprovalStatistics = {
    totalApprovals: allApprovals.length,
    pendingApprovals: 0,
    approvedApprovals: 0,
    deniedApprovals: 0,
    expiredApprovals: 0,
    averageResponseTime: 0,
    byType: {},
  };

  let totalResponseTime = 0;
  let responseCount = 0;

  for (const approval of allApprovals) {
    // Count by status
    switch (approval.status) {
      case "pending":
        stats.pendingApprovals++;
        break;
      case "approved":
        stats.approvedApprovals++;
        break;
      case "denied":
        stats.deniedApprovals++;
        break;
      case "expired":
        stats.expiredApprovals++;
        break;
    }

    // Calculate response time
    if (approval.respondedAt && approval.requestedAt) {
      const responseTime =
        new Date(approval.respondedAt).getTime() -
        new Date(approval.requestedAt).getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }

    // Count by type
    stats.byType[approval.type] = (stats.byType[approval.type] ?? 0) + 1;
  }

  if (responseCount > 0) {
    stats.averageResponseTime = Math.round(totalResponseTime / responseCount / 1000);
  }

  return stats;
}
