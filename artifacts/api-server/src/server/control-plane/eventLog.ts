/**
 * DEVIL Control Plane - Event Log
 * 
 * Append-only audit trail for all mission, phase, task, approval, and system events.
 * Provides complete traceability for debugging, compliance, and recovery.
 */

import { db, eventsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import type { EventType, EventSeverity } from "@workspace/db";
import { z } from "zod";

// ============================================================================
// EVENT CREATION
// ============================================================================

export interface CreateEventInput {
  missionId?: string;
  phaseId?: string;
  taskId?: string;
  eventType: EventType;
  severity?: EventSeverity;
  message: string;
  details?: Record<string, unknown>;
  actor?: string;
}

export async function logEvent(input: CreateEventInput): Promise<string> {
  const id = `evt-${crypto.randomUUID()}`;
  
  await db.insert(eventsTable).values({
    id,
    missionId: input.missionId ?? null,
    phaseId: input.phaseId ?? null,
    taskId: input.taskId ?? null,
    eventType: input.eventType,
    severity: input.severity ?? "info",
    message: input.message,
    details: input.details ?? null,
    actor: input.actor ?? "system",
  });

  return id;
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export interface EventFilter {
  missionId?: string;
  phaseId?: string;
  taskId?: string;
  eventType?: EventType | EventType[];
  severity?: EventSeverity;
  actor?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export async function queryEvents(filters: EventFilter = {}): Promise<typeof eventsTable.$inferSelect[]> {
  const conditions: ReturnType<typeof eq>[] = [];
  const now = Date.now();

  if (filters.missionId) {
    conditions.push(eq(eventsTable.missionId, filters.missionId));
  }
  if (filters.phaseId) {
    conditions.push(eq(eventsTable.phaseId, filters.phaseId));
  }
  if (filters.taskId) {
    conditions.push(eq(eventsTable.taskId, filters.taskId));
  }
  if (filters.severity) {
    conditions.push(eq(eventsTable.severity, filters.severity));
  }
  if (filters.actor) {
    conditions.push(eq(eventsTable.actor, filters.actor));
  }
  if (filters.startTime) {
    conditions.push(gte(eventsTable.timestamp, filters.startTime));
  }
  if (filters.endTime) {
    conditions.push(lte(eventsTable.timestamp, filters.endTime));
  }

  let query = db.select().from(eventsTable);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  query = query.orderBy(desc(eventsTable.timestamp)) as typeof query;

  if (filters.limit) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters.offset) {
    query = query.offset(filters.offset) as typeof query;
  }

  return query;
}

// ============================================================================
// MISSION EVENT HISTORY
// ============================================================================

export interface MissionEventSummary {
  totalEvents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  timeline: Array<{
    timestamp: string;
    eventType: EventType;
    message: string;
    severity: EventSeverity;
  }>;
}

export async function getMissionEventHistory(missionId: string): Promise<MissionEventSummary> {
  const events = await queryEvents({ missionId, limit: 1000 });

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const timeline: MissionEventSummary["timeline"] = [];

  for (const event of events) {
    // Count by type
    byType[event.eventType] = (byType[event.eventType] ?? 0) + 1;
    
    // Count by severity
    bySeverity[event.severity] = (bySeverity[event.severity] ?? 0) + 1;
    
    // Timeline entry
    timeline.push({
      timestamp: event.timestamp instanceof Date 
        ? event.timestamp.toISOString() 
        : String(event.timestamp),
      eventType: event.eventType,
      message: event.message,
      severity: event.severity,
    });
  }

  return {
    totalEvents: events.length,
    byType,
    bySeverity,
    timeline,
  };
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

export async function getRecentActivity(limit: number = 50): Promise<typeof eventsTable.$inferSelect[]> {
  return queryEvents({ limit });
}

// ============================================================================
// EVENT STATISTICS
// ============================================================================

export interface EventStatistics {
  totalEvents: number;
  eventsLast24Hours: number;
  eventsLastWeek: number;
  criticalEvents: number;
  failedOperations: number;
  topEventTypes: Array<{ type: EventType; count: number }>;
}

export async function getEventStatistics(): Promise<EventStatistics> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const allEvents = await queryEvents({ limit: 10000 });
  const recentEvents = await queryEvents({ 
    startTime: oneDayAgo, 
    limit: 1000 
  });
  const weekEvents = await queryEvents({ 
    startTime: oneWeekAgo, 
    limit: 5000 
  });

  // Count critical events
  const criticalEvents = allEvents.filter(e => e.severity === "critical").length;
  
  // Count failed operations
  const failedOperations = allEvents.filter(e => 
    e.eventType.includes("failed") || e.severity === "error"
  ).length;

  // Top event types
  const typeCounts: Record<string, number> = {};
  for (const event of allEvents) {
    typeCounts[event.eventType] = (typeCounts[event.eventType] ?? 0) + 1;
  }
  const topEventTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type: type as EventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: allEvents.length,
    eventsLast24Hours: recentEvents.length,
    eventsLastWeek: weekEvents.length,
    criticalEvents,
    failedOperations,
    topEventTypes,
  };
}

// ============================================================================
// CHECKPOINT EVENTS
// ============================================================================

export async function createCheckpoint(
  missionId: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  return logEvent({
    missionId,
    eventType: "checkpoint_created",
    severity: "info",
    message: `Checkpoint: ${description}`,
    details: metadata,
    actor: "system",
  });
}

// ============================================================================
// SYSTEM ERROR LOGGING
// ============================================================================

export async function logSystemError(
  error: Error | string,
  context?: {
    missionId?: string;
    phaseId?: string;
    taskId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  return logEvent({
    missionId: context?.missionId,
    phaseId: context?.phaseId,
    taskId: context?.taskId,
    eventType: "system_error",
    severity: "error",
    message: `System error: ${message}`,
    details: {
      ...context?.metadata,
      stack,
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
    },
    actor: "system",
  });
}

// ============================================================================
// AUDIT EXPORT
// ============================================================================

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: EventType;
  severity: EventSeverity;
  message: string;
  actor: string | null;
  missionId: string | null;
  phaseId: string | null;
  taskId: string | null;
  details: Record<string, unknown> | null;
}

export async function exportAuditLog(
  filters: EventFilter & { startTime: Date; endTime: Date }
): Promise<AuditEntry[]> {
  const events = await queryEvents(filters);
  
  return events.map(event => ({
    id: event.id,
    timestamp: event.timestamp instanceof Date 
      ? event.timestamp.toISOString() 
      : String(event.timestamp),
    eventType: event.eventType,
    severity: event.severity,
    message: event.message,
    actor: event.actor,
    missionId: event.missionId,
    phaseId: event.phaseId,
    taskId: event.taskId,
    details: event.details,
  }));
}
