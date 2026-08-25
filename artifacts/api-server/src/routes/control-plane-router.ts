/**
 * DEVIL Control Plane - Control Plane Router
 * 
 * Unified router for control plane dashboard and status endpoints.
 */

import { Router, type IRouter } from "express";
import { db, missionsTable, approvalsTable, eventsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { getEventStatistics } from "../server/control-plane/eventLog";
import { getApprovalStatistics } from "../server/control-plane/approvalEngine";
import { initializeToolRegistry, getEnabledTools } from "../server/control-plane/toolRegistry";

const router: IRouter = Router();

// GET /control-plane/status - Get overall control plane status
router.get("/control-plane/status", async (req, res) => {
  try {
    // Get mission stats
    const allMissions = await db.select().from(missionsTable);
    const activeMissions = allMissions.filter(m => 
      ["running", "queued", "awaiting_approval"].includes(m.status)
    ).length;
    const completedMissions = allMissions.filter(m => m.status === "succeeded").length;
    const failedMissions = allMissions.filter(m => m.status === "failed").length;

    // Get pending approvals
    const pendingApprovals = await db
      .select()
      .from(approvalsTable)
      .where(eq(approvalsTable.status, "pending"));
    
    // Get event stats
    const eventStats = await getEventStatistics();
    
    // Get tool stats
    const tools = await getEnabledTools();

    res.json({
      status: "operational",
      version: "1.0.0",
      mission: {
        total: allMissions.length,
        active: activeMissions,
        completed: completedMissions,
        failed: failedMissions,
      },
      approvals: {
        pending: pendingApprovals.length,
      },
      events: {
        total: eventStats.totalEvents,
        last24Hours: eventStats.eventsLast24Hours,
        critical: eventStats.criticalEvents,
      },
      tools: {
        registered: tools.length,
        enabled: tools.filter(t => t.enabled).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get control plane status");
    res.status(500).json({ error: "Failed to get control plane status" });
  }
});

// POST /control-plane/initialize - Initialize control plane
router.post("/control-plane/initialize", async (req, res) => {
  try {
    // Initialize tool registry
    await initializeToolRegistry();
    
    const tools = await getEnabledTools();

    res.json({
      message: "Control plane initialized successfully",
      initialized: {
        toolRegistry: true,
        toolCount: tools.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to initialize control plane");
    res.status(500).json({ error: "Failed to initialize control plane" });
  }
});

// GET /control-plane/dashboard - Get dashboard data
router.get("/control-plane/dashboard", async (req, res) => {
  try {
    // Get recent missions
    const recentMissions = await db
      .select()
      .from(missionsTable)
      .orderBy(desc(missionsTable.createdAt))
      .limit(10);

    // Get recent events
    const recentEvents = await db
      .select()
      .from(eventsTable)
      .orderBy(desc(eventsTable.timestamp))
      .limit(20);

    // Get pending approvals
    const pendingApprovals = await db
      .select()
      .from(approvalsTable)
      .where(eq(approvalsTable.status, "pending"))
      .orderBy(desc(approvalsTable.requestedAt))
      .limit(10);

    // Get event stats
    const eventStats = await getEventStatistics();
    
    // Get approval stats
    const approvalStats = await getApprovalStatistics();

    res.json({
      summary: {
        activeMissions: recentMissions.filter(m => ["running", "queued"].includes(m.status)).length,
        pendingApprovals: pendingApprovals.length,
        eventsToday: eventStats.eventsLast24Hours,
        criticalEvents: eventStats.criticalEvents,
      },
      recentMissions: recentMissions.map(m => ({
        id: m.id,
        goal: m.goal,
        status: m.status,
        progress: m.progress,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      })),
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        message: e.message,
        missionId: e.missionId,
        timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
      })),
      pendingApprovals: pendingApprovals.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        missionId: a.missionId,
        requestedAt: a.requestedAt instanceof Date ? a.requestedAt.toISOString() : a.requestedAt,
      })),
      statistics: {
        events: eventStats,
        approvals: approvalStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get dashboard data");
    res.status(500).json({ error: "Failed to get dashboard data" });
  }
});

export default router;
