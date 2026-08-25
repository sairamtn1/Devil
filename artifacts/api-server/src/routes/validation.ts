/**
 * DEVIL Control Plane - Validation Router
 * 
 * API endpoints for validation operations:
 * - POST /validation/pre-execution - Validate before execution
 * - POST /validation/continuous - Continuous validation during execution
 * - POST /validation/post-execution - Validate after execution
 * - POST /validation/resume - Validate before resuming
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  preExecutionValidation,
  continuousValidation,
  postExecutionValidation,
  resumeValidation,
} from "../server/control-plane/validationLayer";

const router: IRouter = Router();

// Pre-execution validation schema
const PreExecutionSchema = z.object({
  target: z.enum(["mission", "phase", "task"]),
  targetId: z.string(),
  requestedAction: z.string().optional(),
});

// Continuous validation schema
const ContinuousValidationSchema = z.object({
  missionId: z.string(),
  checks: z.array(z.enum([
    "runtime_errors",
    "resource_usage",
    "timeout",
    "cost_threshold",
    "tool_behavior",
  ])).optional().default(["runtime_errors", "tool_behavior"]),
});

// Post-execution validation schema
const PostExecutionSchema = z.object({
  target: z.enum(["mission", "phase", "task"]),
  targetId: z.string(),
  executionResult: z.object({
    success: z.boolean(),
    output: z.unknown().optional(),
    error: z.string().optional(),
  }).optional(),
});

// Resume validation schema
const ResumeValidationSchema = z.object({
  missionId: z.string(),
});

// POST /validation/pre-execution - Pre-execution validation
router.post("/validation/pre-execution", async (req, res) => {
  try {
    const input = PreExecutionSchema.parse(req.body);
    const report = await preExecutionValidation(input);

    res.json({
      ...report,
      timestamp: report.timestamp.toISOString(),
      blocked: report.blocked,
      blockedReason: report.blockedReason,
    });
  } catch (error) {
    req.log.error({ err: error }, "Pre-execution validation failed");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Pre-execution validation failed" 
    });
  }
});

// POST /validation/continuous - Continuous validation
router.post("/validation/continuous", async (req, res) => {
  try {
    const input = ContinuousValidationSchema.parse(req.body);
    const result = continuousValidation(input);

    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Continuous validation failed");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Continuous validation failed" 
    });
  }
});

// POST /validation/post-execution - Post-execution validation
router.post("/validation/post-execution", async (req, res) => {
  try {
    const input = PostExecutionSchema.parse(req.body);
    const report = await postExecutionValidation(input);

    res.json({
      ...report,
      timestamp: report.timestamp.toISOString(),
      blocked: report.blocked,
      blockedReason: report.blockedReason,
    });
  } catch (error) {
    req.log.error({ err: error }, "Post-execution validation failed");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Post-execution validation failed" 
    });
  }
});

// POST /validation/resume - Resume validation
router.post("/validation/resume", async (req, res) => {
  try {
    const input = ResumeValidationSchema.parse(req.body);
    const report = await resumeValidation(input);

    res.json({
      ...report,
      timestamp: report.timestamp.toISOString(),
      blocked: report.blocked,
      blockedReason: report.blockedReason,
    });
  } catch (error) {
    req.log.error({ err: error }, "Resume validation failed");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Resume validation failed" 
    });
  }
});

export default router;
