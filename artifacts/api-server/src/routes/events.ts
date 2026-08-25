/**
 * DEVIL Control Plane - Events Router
 * 
 * API endpoints for event log operations:
 * - GET /events - List events with filters
 * - GET /events/:id - Get single event
 * - GET /missions/:id/events - Get mission event history
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { queryEvents, getMissionEventHistory, getEventStatistics } from "../server/control-plane/eventLog";

const router: IRouter = Router();

// Query schema
const QueryEventsSchema = z.object({
  missionId: z.string().optional(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.enum(["info", "warning", "error", "critical"]).optional(),
  actor: z.string().optional(),
  startTime: z.string().optional().transform(s => s ? new Date(s) : undefined),
  endTime: z.string().optional().transform(s => s ? new Date(s) : undefined),
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
});

// GET /events - List events
router.get("/events", async (req, res) => {
  try {
    const query = QueryEventsSchema.parse(req.query);
    
    const events = await queryEvents({
      missionId: query.missionId,
      phaseId: query.phaseId,
      taskId: query.taskId,
      eventType: query.eventType as any,
      severity: query.severity,
      actor: query.actor,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({
      events: events.map(e => ({
        ...e,
        timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
      })),
      total: events.length,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to query events");
    res.status(400).json({ error: "Invalid query parameters" });
  }
});

// GET /events/:id - Get single event
router.get("/events/:id", async (req, res) => {
  try {
    const events = await queryEvents({ limit: 1 });
    const event = events.find(e => e.id === req.params.id);
    
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.json({
      ...event,
      timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get event");
    res.status(500).json({ error: "Failed to get event" });
  }
});

// GET /missions/:id/events - Get mission event history
router.get("/missions/:id/events", async (req, res) => {
  try {
    const history = await getMissionEventHistory(req.params.id);
    res.json(history);
  } catch (error) {
    req.log.error({ err: error }, "Failed to get mission event history");
    res.status(500).json({ error: "Failed to get mission event history" });
  }
});

// GET /events/stats - Get event statistics
router.get("/events/stats", async (req, res) => {
  try {
    const stats = await getEventStatistics();
    res.json(stats);
  } catch (error) {
    req.log.error({ err: error }, "Failed to get event statistics");
    res.status(500).json({ error: "Failed to get event statistics" });
  }
});

export default router;
