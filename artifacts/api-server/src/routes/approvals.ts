/**
 * DEVIL Control Plane - Approvals Router
 * 
 * API endpoints for approval operations:
 * - GET /approvals - List approvals
 * - POST /approvals - Create approval request
 * - GET /approvals/:id - Get approval
 * - POST /approvals/:id/decision - Process approval decision
 * - GET /approvals/pending - Get pending approvals
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  createApproval,
  processApprovalDecision,
  getPendingApprovals,
  getApprovalHistory,
  getApprovalById,
  getApprovalStatistics,
} from "../server/control-plane/approvalEngine";
import { checkApproval } from "../server/control-plane/approvalEngine";

const router: IRouter = Router();

// Create approval schema
const CreateApprovalSchema = z.object({
  missionId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  type: z.enum([
    "phase_execution",
    "tool_usage",
    "github_write",
    "deployment",
    "secret_access",
    "paid_api",
    "infrastructure",
    "production_action",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  justification: z.string().optional(),
  riskAssessment: z.string().optional(),
  expiresIn: z.number().optional(),
});

// Approval decision schema
const ApprovalDecisionSchema = z.object({
  approved: z.boolean(),
  responderId: z.string().optional(),
  response: z.string().optional(),
});

// Query schema
const QueryApprovalsSchema = z.object({
  missionId: z.string().optional(),
  status: z.enum(["pending", "approved", "denied", "expired"]).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().optional().default(50),
});

// POST /approvals - Create approval request
router.post("/approvals", async (req, res) => {
  try {
    const input = CreateApprovalSchema.parse(req.body);
    const { approval, requiresBlocking } = await createApproval(input);

    res.status(201).json({
      approval: {
        ...approval,
        requestedAt: approval.requestedAt instanceof Date 
          ? approval.requestedAt.toISOString() 
          : approval.requestedAt,
        expiresAt: approval.expiresAt instanceof Date 
          ? approval.expiresAt.toISOString() 
          : approval.expiresAt,
      },
      requiresBlocking,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create approval");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to create approval" 
    });
  }
});

// GET /approvals - List approvals
router.get("/approvals", async (req, res) => {
  try {
    const query = QueryApprovalsSchema.parse(req.query);
    
    let approvals;
    if (query.missionId) {
      approvals = await getApprovalHistory(query.missionId, query.limit);
    } else if (query.status === "pending") {
      approvals = await getPendingApprovals();
    } else {
      // Get all approvals (would need additional implementation)
      approvals = await getApprovalHistory("all", query.limit);
    }

    // Filter by status if specified
    if (query.status) {
      approvals = approvals.filter(a => a.status === query.status);
    }

    res.json({
      approvals: approvals.map(a => ({
        ...a,
        requestedAt: a.requestedAt instanceof Date ? a.requestedAt.toISOString() : a.requestedAt,
        expiresAt: a.expiresAt instanceof Date ? a.expiresAt.toISOString() : a.expiresAt,
        respondedAt: a.respondedAt instanceof Date ? a.respondedAt.toISOString() : a.respondedAt,
      })),
      total: approvals.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to list approvals");
    res.status(500).json({ error: "Failed to list approvals" });
  }
});

// GET /approvals/pending - Get pending approvals
router.get("/approvals/pending", async (req, res) => {
  try {
    const missionId = req.query.missionId as string | undefined;
    const approvals = await getPendingApprovals(missionId);

    res.json({
      approvals: approvals.map(a => ({
        ...a,
        requestedAt: a.requestedAt instanceof Date ? a.requestedAt.toISOString() : a.requestedAt,
        expiresAt: a.expiresAt instanceof Date ? a.expiresAt.toISOString() : a.expiresAt,
      })),
      total: approvals.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get pending approvals");
    res.status(500).json({ error: "Failed to get pending approvals" });
  }
});

// GET /approvals/stats - Get approval statistics
router.get("/approvals/stats", async (req, res) => {
  try {
    const stats = await getApprovalStatistics();
    res.json(stats);
  } catch (error) {
    req.log.error({ err: error }, "Failed to get approval statistics");
    res.status(500).json({ error: "Failed to get approval statistics" });
  }
});

// GET /approvals/:id - Get single approval
router.get("/approvals/:id", async (req, res) => {
  try {
    const approval = await getApprovalById(req.params.id);
    
    if (!approval) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }

    res.json({
      ...approval,
      requestedAt: approval.requestedAt instanceof Date ? approval.requestedAt.toISOString() : approval.requestedAt,
      expiresAt: approval.expiresAt instanceof Date ? approval.expiresAt.toISOString() : approval.expiresAt,
      respondedAt: approval.respondedAt instanceof Date ? approval.respondedAt.toISOString() : approval.respondedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get approval");
    res.status(500).json({ error: "Failed to get approval" });
  }
});

// POST /approvals/:id/decision - Process approval decision
router.post("/approvals/:id/decision", async (req, res) => {
  try {
    const decision = ApprovalDecisionSchema.parse(req.body);
    const result = await processApprovalDecision({
      approvalId: req.params.id,
      ...decision,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      missionResumed: result.missionResumed,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to process approval decision");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to process approval decision" 
    });
  }
});

// POST /approvals/check - Check if approval is needed
router.post("/approvals/check", async (req, res) => {
  try {
    const { missionId, type } = req.body;
    
    if (!missionId || !type) {
      res.status(400).json({ error: "missionId and type are required" });
      return;
    }

    const result = await checkApproval(missionId, type);
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Failed to check approval");
    res.status(500).json({ error: "Failed to check approval" });
  }
});

export default router;
