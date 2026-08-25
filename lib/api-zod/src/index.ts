/**
 * DEVIL Control Plane - API Zod Schemas
 * 
 * These schemas are generated from the OpenAPI spec and provide
 * type-safe validation for all API requests and responses.
 */

import { z } from "zod";

// ============================================================================
// MISSION STATE MACHINE SCHEMAS
// ============================================================================

export const MissionStatusSchema = z.enum([
  "queued",
  "running",
  "blocked",
  "awaiting_approval",
  "succeeded",
  "failed",
  "cancelled",
]);

export const PhaseStatusSchema = z.enum([
  "pending",
  "approved",
  "queued",
  "in_progress",
  "completed",
  "failed",
  "skipped",
  "paused",
]);

export const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "skipped",
]);

export const TaskCategorySchema = z.enum([
  "frontend",
  "backend",
  "database",
  "deployment",
  "general",
]);

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);

// Mission schemas
export const MissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().nullable(),
  goal: z.string(),
  status: MissionStatusSchema,
  progress: z.number().min(0).max(100),
  currentPhase: z.string().nullable(),
  complexity: z.number().min(1).max(10).nullable(),
  timelineEstimate: z.string().nullable(),
  riskLevel: RiskLevelSchema.nullable(),
  plan: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
});

export const MissionCreateSchema = z.object({
  goal: z.string().min(3, "Goal must be at least 3 characters"),
  projectId: z.string().optional(),
  complexity: z.number().min(1).max(10).optional(),
  timelineEstimate: z.string().optional(),
  riskLevel: RiskLevelSchema.optional(),
});

export const MissionUpdateSchema = z.object({
  status: MissionStatusSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  currentPhase: z.string().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Phase schemas
export const PhaseSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  status: PhaseStatusSchema,
  progress: z.number().min(0).max(100),
  dependencies: z.array(z.string()).nullable(),
  deliverables: z.array(z.string()).nullable(),
  approvalRequired: z.boolean(),
  autoApproved: z.boolean(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const PhaseCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  dependencies: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  approvalRequired: z.boolean().default(false),
  autoApproved: z.boolean().default(false),
});

export const PhaseUpdateSchema = z.object({
  status: PhaseStatusSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Task schemas
export const TaskSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  phaseId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  status: TaskStatusSchema,
  category: TaskCategorySchema.nullable(),
  toolCapabilities: z.array(z.string()).nullable(),
  effort: z.number().nullable(),
  result: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const TaskCreateSchema = z.object({
  phaseId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  category: TaskCategorySchema.optional(),
  toolCapabilities: z.array(z.string()).optional(),
  effort: z.number().optional(),
});

export const TaskUpdateSchema = z.object({
  status: TaskStatusSchema.optional(),
  result: z.string().optional(),
  errorMessage: z.string().optional(),
});

// ============================================================================
// EVENT LOG SCHEMAS
// ============================================================================

export const EventTypeSchema = z.enum([
  "mission_created",
  "mission_started",
  "mission_progress",
  "mission_blocked",
  "mission_paused",
  "mission_resumed",
  "mission_completed",
  "mission_failed",
  "mission_cancelled",
  "mission_approved",
  "phase_started",
  "phase_completed",
  "phase_failed",
  "phase_skipped",
  "task_started",
  "task_completed",
  "task_failed",
  "task_skipped",
  "approval_requested",
  "approval_granted",
  "approval_denied",
  "approval_timeout",
  "validation_passed",
  "validation_failed",
  "validation_warning",
  "tool_invoked",
  "tool_completed",
  "tool_failed",
  "tool_timeout",
  "system_error",
  "system_recovery",
  "checkpoint_created",
]);

export const EventSeveritySchema = z.enum(["info", "warning", "error", "critical"]);

export const EventSchema = z.object({
  id: z.string(),
  missionId: z.string().nullable(),
  phaseId: z.string().nullable(),
  taskId: z.string().nullable(),
  eventType: EventTypeSchema,
  severity: EventSeveritySchema,
  message: z.string(),
  details: z.record(z.unknown()).nullable(),
  actor: z.string().nullable(),
  timestamp: z.string(),
});

export const EventCreateSchema = z.object({
  missionId: z.string().optional(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  eventType: EventTypeSchema,
  severity: EventSeveritySchema.optional().default("info"),
  message: z.string().min(1),
  details: z.record(z.unknown()).optional(),
  actor: z.string().optional(),
});

// ============================================================================
// APPROVAL ENGINE SCHEMAS
// ============================================================================

export const ApprovalTypeSchema = z.enum([
  "phase_execution",
  "tool_usage",
  "github_write",
  "deployment",
  "secret_access",
  "paid_api",
  "infrastructure",
  "production_action",
]);

export const ApprovalStatusSchema = z.enum(["pending", "approved", "denied", "expired"]);

export const ApprovalSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  phaseId: z.string().nullable(),
  taskId: z.string().nullable(),
  type: ApprovalTypeSchema,
  status: ApprovalStatusSchema,
  title: z.string(),
  description: z.string().nullable(),
  justification: z.string().nullable(),
  riskAssessment: z.string().nullable(),
  requestedAt: z.string(),
  expiresAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  responderId: z.string().nullable(),
  response: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
});

export const ApprovalCreateSchema = z.object({
  missionId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  type: ApprovalTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  justification: z.string().optional(),
  riskAssessment: z.string().optional(),
  expiresIn: z.number().optional(), // seconds
});

export const ApprovalDecisionSchema = z.object({
  approved: z.boolean(),
  response: z.string().optional(),
});

// ============================================================================
// TOOL REGISTRY SCHEMAS
// ============================================================================

export const PermissionLevelSchema = z.enum(["safe", "standard", "privileged", "critical"]);

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  category: z.string(),
  capabilities: z.array(z.string()),
  permissionLevel: PermissionLevelSchema,
  approvalRequired: z.boolean(),
  approvalType: ApprovalTypeSchema.nullable(),
  timeout: z.number(),
  retryLimit: z.number(),
  resourceLimits: z.record(z.unknown()).nullable(),
  supportedMissions: z.array(z.string()).nullable(),
  validationRules: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ToolCreateSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional().default("v1"),
  category: z.string(),
  capabilities: z.array(z.string()).min(1),
  permissionLevel: PermissionLevelSchema.optional().default("standard"),
  approvalRequired: z.boolean().optional().default(false),
  approvalType: ApprovalTypeSchema.optional(),
  timeout: z.number().optional().default(300),
  retryLimit: z.number().optional().default(3),
  resourceLimits: z.record(z.unknown()).optional(),
  supportedMissions: z.array(z.string()).optional(),
  validationRules: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const ToolExecutionSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  missionId: z.string().nullable(),
  taskId: z.string().nullable(),
  status: z.enum(["started", "completed", "failed", "timeout"]),
  input: z.record(z.unknown()).nullable(),
  output: z.record(z.unknown()).nullable(),
  error: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  duration: z.number().nullable(),
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ValidationSeveritySchema = z.enum(["info", "warning", "error", "critical"]);

export const ValidationResultSchema = z.object({
  passed: z.boolean(),
  severity: ValidationSeveritySchema,
  rule: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).nullable(),
  timestamp: z.string(),
});

export const ValidationRequestSchema = z.object({
  target: z.enum(["mission", "phase", "task", "tool", "approval"]),
  targetId: z.string(),
  validationType: z.string(),
});

// ============================================================================
// DASHBOARD SCHEMAS
// ============================================================================

export const DashboardSchema = z.object({
  aiCore: z.enum(["online", "offline"]),
  memory: z.enum(["optimal", "indexing", "limited"]),
  speed: z.string(),
  connections: z.enum(["secure", "warning"]),
  devilMode: z.boolean(),
  uptime: z.string(),
  tasksCompleted: z.number(),
  filesProcessed: z.string(),
  thoughtsPerSecond: z.string(),
  activeMissions: z.number(),
  pendingApprovals: z.number(),
  recentEvents: z.array(EventSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MissionStatus = z.infer<typeof MissionStatusSchema>;
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type MissionCreate = z.infer<typeof MissionCreateSchema>;
export type MissionUpdate = z.infer<typeof MissionUpdateSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type PhaseCreate = z.infer<typeof PhaseCreateSchema>;
export type PhaseUpdate = z.infer<typeof PhaseUpdateSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type EventSeverity = z.infer<typeof EventSeveritySchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventCreate = z.infer<typeof EventCreateSchema>;
export type ApprovalType = z.infer<typeof ApprovalTypeSchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type ApprovalCreate = z.infer<typeof ApprovalCreateSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type ToolCreate = z.infer<typeof ToolCreateSchema>;
export type ToolExecution = z.infer<typeof ToolExecutionSchema>;
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ValidationRequest = z.infer<typeof ValidationRequestSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
