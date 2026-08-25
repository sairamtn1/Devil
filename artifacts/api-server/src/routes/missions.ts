/**
 * DEVIL API Server - Missions Router
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, missionsTable, missionPhasesTable, missionTasksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  transitionMission,
  getMissionState,
  transitionPhase,
  transitionTask,
  getNextExecutableTask,
} from "../server/control-plane/stateMachine";
import { logEvent } from "../server/control-plane/eventLog";

const router: IRouter = Router();

// Mission schemas
const MissionCreateSchema = z.object({
  goal: z.string().min(3),
  projectId: z.string().optional(),
});

const MissionUpdateSchema = z.object({
  status: z.enum(["queued", "running", "blocked", "awaiting_approval", "succeeded", "failed", "cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const PhaseUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "queued", "in_progress", "completed", "failed", "skipped", "paused"]).optional(),
  progress: z.number().min(0).max(100).optional(),
});

const TaskUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "failed", "skipped"]).optional(),
  result: z.string().optional(),
  errorMessage: z.string().optional(),
});

// GET /missions - List missions
router.get("/missions", async (req, res) => {
  try {
    const missions = await db
      .select()
      .from(missionsTable)
      .orderBy(desc(missionsTable.createdAt))
      .limit(50);

    res.json({
      missions: missions.map(m => ({
        ...m,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
        startedAt: m.startedAt instanceof Date ? m.startedAt.toISOString() : m.startedAt,
        completedAt: m.completedAt instanceof Date ? m.completedAt.toISOString() : m.completedAt,
      })),
      total: missions.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to list missions");
    res.status(500).json({ error: "Failed to list missions" });
  }
});

// POST /missions - Create mission
router.post("/missions", async (req, res) => {
  try {
    const input = MissionCreateSchema.parse(req.body);
    const userId = req.header("x-devil-user-id") ?? "anonymous";
    
    const id = `mission-${crypto.randomUUID()}`;
    
    const [mission] = await db.insert(missionsTable).values({
      id,
      userId,
      goal: input.goal,
      status: "queued",
      progress: 0,
      projectId: input.projectId ?? null,
    }).returning();

    // Log event
    await logEvent({
      missionId: id,
      eventType: "mission_created",
      severity: "info",
      message: `Mission created: ${input.goal}`,
      actor: userId,
    });

    res.status(201).json({
      ...mission,
      createdAt: mission.createdAt instanceof Date ? mission.createdAt.toISOString() : mission.createdAt,
      updatedAt: mission.updatedAt instanceof Date ? mission.updatedAt.toISOString() : mission.updatedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create mission");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to create mission" 
    });
  }
});

// GET /missions/:id - Get mission with state
router.get("/missions/:id", async (req, res) => {
  try {
    const { mission, phases, tasks } = await getMissionState(req.params.id);
    
    if (!mission) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    // Get next executable task
    const nextTask = await getNextExecutableTask(req.params.id);

    res.json({
      mission: {
        ...mission,
        createdAt: mission.createdAt instanceof Date ? mission.createdAt.toISOString() : mission.createdAt,
        updatedAt: mission.updatedAt instanceof Date ? mission.updatedAt.toISOString() : mission.updatedAt,
        startedAt: mission.startedAt instanceof Date ? mission.startedAt.toISOString() : mission.startedAt,
        completedAt: mission.completedAt instanceof Date ? mission.completedAt.toISOString() : mission.completedAt,
      },
      phases: phases.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        startedAt: p.startedAt instanceof Date ? p.startedAt.toISOString() : p.startedAt,
        completedAt: p.completedAt instanceof Date ? p.completedAt.toISOString() : p.completedAt,
      })),
      tasks: tasks.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        startedAt: t.startedAt instanceof Date ? t.startedAt.toISOString() : t.startedAt,
        completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt,
      })),
      nextTask,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get mission");
    res.status(500).json({ error: "Failed to get mission" });
  }
});

// PATCH /missions/:id - Update mission state
router.patch("/missions/:id", async (req, res) => {
  try {
    const input = MissionUpdateSchema.parse(req.body);
    
    if (input.status) {
      const result = await transitionMission(req.params.id, input.status, "api");
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
    }

    const { mission } = await getMissionState(req.params.id);
    if (!mission) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    res.json({
      ...mission,
      createdAt: mission.createdAt instanceof Date ? mission.createdAt.toISOString() : mission.createdAt,
      updatedAt: mission.updatedAt instanceof Date ? mission.updatedAt.toISOString() : mission.updatedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to update mission");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to update mission" 
    });
  }
});

// GET /missions/:id/phases - Get mission phases
router.get("/missions/:id/phases", async (req, res) => {
  try {
    const phases = await db
      .select()
      .from(missionPhasesTable)
      .where(eq(missionPhasesTable.missionId, req.params.id))
      .orderBy(missionPhasesTable.order);

    res.json({
      phases: phases.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        startedAt: p.startedAt instanceof Date ? p.startedAt.toISOString() : p.startedAt,
        completedAt: p.completedAt instanceof Date ? p.completedAt.toISOString() : p.completedAt,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get phases");
    res.status(500).json({ error: "Failed to get phases" });
  }
});

// PATCH /missions/:id/phases/:phaseId - Update phase state
router.patch("/missions/:id/phases/:phaseId", async (req, res) => {
  try {
    const input = PhaseUpdateSchema.parse(req.body);
    
    if (input.status) {
      const result = await transitionPhase(req.params.phaseId, input.status, "api");
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
    }

    const [phase] = await db
      .select()
      .from(missionPhasesTable)
      .where(eq(missionPhasesTable.id, req.params.phaseId));

    if (!phase) {
      res.status(404).json({ error: "Phase not found" });
      return;
    }

    res.json({
      ...phase,
      createdAt: phase.createdAt instanceof Date ? phase.createdAt.toISOString() : phase.createdAt,
      startedAt: phase.startedAt instanceof Date ? phase.startedAt.toISOString() : phase.startedAt,
      completedAt: phase.completedAt instanceof Date ? phase.completedAt.toISOString() : phase.completedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to update phase");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to update phase" 
    });
  }
});

// GET /missions/:id/tasks - Get mission tasks
router.get("/missions/:id/tasks", async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(missionTasksTable)
      .where(eq(missionTasksTable.missionId, req.params.id))
      .orderBy(missionTasksTable.order);

    res.json({
      tasks: tasks.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        startedAt: t.startedAt instanceof Date ? t.startedAt.toISOString() : t.startedAt,
        completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get tasks");
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

// PATCH /missions/:id/tasks/:taskId - Update task state
router.patch("/missions/:id/tasks/:taskId", async (req, res) => {
  try {
    const input = TaskUpdateSchema.parse(req.body);
    
    if (input.status) {
      const result = await transitionTask(
        req.params.taskId, 
        input.status, 
        "api",
        { result: input.result, error: input.errorMessage }
      );
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
    }

    const [task] = await db
      .select()
      .from(missionTasksTable)
      .where(eq(missionTasksTable.id, req.params.taskId));

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({
      ...task,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      startedAt: task.startedAt instanceof Date ? task.startedAt.toISOString() : task.startedAt,
      completedAt: task.completedAt instanceof Date ? task.completedAt.toISOString() : task.completedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to update task");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to update task" 
    });
  }
});

export default router;
