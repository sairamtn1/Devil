/**
 * DEVIL Control Plane - Database Schema
 * 
 * This schema defines the core data models for:
 * - Missions (with extended state machine)
 * - Event Log (append-only audit trail)
 * - Approvals (approval requests and decisions)
 * - Tools (registry and execution tracking)
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================================
// MISSION STATE MACHINE
// ============================================================================

export const missionStatusEnum = [
  "queued",
  "running",
  "blocked",
  "awaiting_approval",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type MissionStatus = (typeof missionStatusEnum)[number];

export const phaseStatusEnum = [
  "pending",
  "approved",
  "queued",
  "in_progress",
  "completed",
  "failed",
  "skipped",
  "paused",
] as const;

export type PhaseStatus = (typeof phaseStatusEnum)[number];

export const taskStatusEnum = [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "skipped",
] as const;

export type TaskStatus = (typeof taskStatusEnum)[number];

// Main missions table
export const missionsTable = sqliteTable("missions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: text("project_id").references(() => projectsTable.id),
  goal: text("goal").notNull(),
  status: text("status", { enum: missionStatusEnum }).notNull().default("queued"),
  progress: real("progress").notNull().default(0),
  currentPhase: text("current_phase"),
  complexity: integer("complexity"), // 1-10 scale
  timelineEstimate: text("timeline_estimate"), // "2-4 hours", "1-3 days", etc.
  riskLevel: text("risk_level", { enum: ["low", "medium", "high"] }),
  plan: text("plan", { mode: "json" }), // JSON blob for architect plan
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  metadata: text("metadata", { mode: "json" }),
});

// Mission phases
export const missionPhasesTable = sqliteTable("mission_phases", {
  id: text("id").primaryKey(),
  missionId: text("mission_id")
    .notNull()
    .references(() => missionsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  status: text("status", { enum: phaseStatusEnum }).notNull().default("pending"),
  progress: real("progress").notNull().default(0),
  dependencies: text("dependencies", { mode: "json" }).$type<string[]>(),
  deliverables: text("deliverables", { mode: "json" }).$type<string[]>(),
  approvalRequired: integer("approval_required", { mode: "boolean" }).notNull().default(false),
  autoApproved: integer("auto_approved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Mission tasks
export const missionTasksTable = sqliteTable("mission_tasks", {
  id: text("id").primaryKey(),
  missionId: text("mission_id")
    .notNull()
    .references(() => missionsTable.id, { onDelete: "cascade" }),
  phaseId: text("phase_id").references(() => missionPhasesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  status: text("status", { enum: taskStatusEnum }).notNull().default("pending"),
  category: text("category", {
    enum: ["frontend", "backend", "database", "deployment", "general"],
  }),
  toolCapabilities: text("tool_capabilities", { mode: "json" }).$type<string[]>(),
  effort: integer("effort"), // in minutes
  result: text("result"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ============================================================================
// EVENT LOG (Append-Only Audit Trail)
// ============================================================================

export const eventTypeEnum = [
  // Mission events
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
  
  // Phase events
  "phase_started",
  "phase_completed",
  "phase_failed",
  "phase_skipped",
  
  // Task events
  "task_started",
  "task_completed",
  "task_failed",
  "task_skipped",
  
  // Approval events
  "approval_requested",
  "approval_granted",
  "approval_denied",
  "approval_timeout",
  
  // Validation events
  "validation_passed",
  "validation_failed",
  "validation_warning",
  
  // Tool events
  "tool_invoked",
  "tool_completed",
  "tool_failed",
  "tool_timeout",
  
  // System events
  "system_error",
  "system_recovery",
  "checkpoint_created",
] as const;

export type EventType = (typeof eventTypeEnum)[number];

export const eventSeverityEnum = ["info", "warning", "error", "critical"] as const;
export type EventSeverity = (typeof eventSeverityEnum)[number];

export const eventsTable = sqliteTable("events", {
  id: text("id").primaryKey(),
  missionId: text("mission_id").references(() => missionsTable.id, { onDelete: "cascade" }),
  phaseId: text("phase_id"),
  taskId: text("task_id"),
  eventType: text("event_type", { enum: eventTypeEnum }).notNull(),
  severity: text("severity", { enum: eventSeverityEnum }).notNull().default("info"),
  message: text("message").notNull(),
  details: text("details", { mode: "json" }),
  actor: text("actor"), // "system", "user", or user ID
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Index for efficient event queries
// Note: Drizzle doesn't support index creation in schema, but you should create:
// CREATE INDEX idx_events_mission ON events(mission_id);
// CREATE INDEX idx_events_timestamp ON events(timestamp);

// ============================================================================
// APPROVAL ENGINE
// ============================================================================

export const approvalTypeEnum = [
  "phase_execution",
  "tool_usage",
  "github_write",
  "deployment",
  "secret_access",
  "paid_api",
  "infrastructure",
  "production_action",
] as const;

export type ApprovalType = (typeof approvalTypeEnum)[number];

export const approvalStatusEnum = ["pending", "approved", "denied", "expired"] as const;
export type ApprovalStatus = (typeof approvalStatusEnum)[number];

export const approvalsTable = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  missionId: text("mission_id")
    .notNull()
    .references(() => missionsTable.id, { onDelete: "cascade" }),
  phaseId: text("phase_id"),
  taskId: text("task_id"),
  type: text("type", { enum: approvalTypeEnum }).notNull(),
  status: text("status", { enum: approvalStatusEnum }).notNull().default("pending"),
  title: text("title").notNull(),
  description: text("description"),
  justification: text("justification"), // Why DEVIL needs this approval
  riskAssessment: text("risk_assessment"),
  requestedAt: integer("requested_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  responderId: text("responder_id"),
  response: text("response"), // User's response/notes
  metadata: text("metadata", { mode: "json" }),
});

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export const permissionLevelEnum = ["safe", "standard", "privileged", "critical"] as const;
export type PermissionLevel = (typeof permissionLevelEnum)[number];

export const toolsTable = sqliteTable("tools", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  version: text("version").notNull().default("v1"),
  category: text("category").notNull(),
  capabilities: text("capabilities", { mode: "json" }).$type<string[]>().notNull(),
  permissionLevel: text("permission_level", { enum: permissionLevelEnum })
    .notNull()
    .default("standard"),
  approvalRequired: integer("approval_required", { mode: "boolean" }).notNull().default(false),
  approvalType: text("approval_type", { enum: approvalTypeEnum }),
  timeout: integer("timeout").notNull().default(300), // seconds
  retryLimit: integer("retry_limit").notNull().default(3),
  resourceLimits: text("resource_limits", { mode: "json" }),
  supportedMissions: text("supported_missions", { mode: "json" }).$type<string[]>(),
  validationRules: text("validation_rules", { mode: "json" }).$type<string[]>(),
  description: text("description"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Tool execution log
export const toolExecutionsTable = sqliteTable("tool_executions", {
  id: text("id").primaryKey(),
  toolId: text("tool_id")
    .notNull()
    .references(() => toolsTable.id),
  missionId: text("mission_id").references(() => missionsTable.id, { onDelete: "cascade" }),
  taskId: text("task_id"),
  status: text("status", { enum: ["started", "completed", "failed", "timeout"] }).notNull(),
  input: text("input", { mode: "json" }),
  output: text("output", { mode: "json" }),
  error: text("error"),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  duration: integer("duration"), // milliseconds
});

// ============================================================================
// PROJECTS TABLE (Required by missionsTable)
// ============================================================================

export const projectsTable = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  context: text("context", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// USERS TABLE (Required by projectsTable)
// ============================================================================

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Mission = typeof missionsTable.$inferSelect;
export type NewMission = typeof missionsTable.$inferInsert;
export type Phase = typeof missionPhasesTable.$inferSelect;
export type NewPhase = typeof missionPhasesTable.$inferInsert;
export type Task = typeof missionTasksTable.$inferSelect;
export type NewTask = typeof missionTasksTable.$inferInsert;
export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;
export type Approval = typeof approvalsTable.$inferSelect;
export type NewApproval = typeof approvalsTable.$inferInsert;
export type Tool = typeof toolsTable.$inferSelect;
export type NewTool = typeof toolsTable.$inferInsert;
export type ToolExecution = typeof toolExecutionsTable.$inferSelect;
export type NewToolExecution = typeof toolExecutionsTable.$inferInsert;
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
