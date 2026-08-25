/**
 * DEVIL Executor Foundation - API Routes
 * 
 * Executor endpoints for mission execution control.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { defaultExecutorEngine, ExecutionMode, ExecutorState } from "../server/executor";
import { getMissionQueueSummary } from "../server/executor/queue";

const app = new Hono();

// CORS for API
app.use("/*", cors());

// ============================================================================
// EXECUTOR LIFECYCLE
// ============================================================================

/**
 * POST /api/executor/start
 * Start a new executor for a mission
 */
app.post("/start", async (c) => {
  try {
    const body = await c.req.json();
    const { missionId, mode = "auto_pilot", userId, sandboxLimits } = body;

    if (!missionId) {
      return c.json({ error: "missionId is required" }, 400);
    }

    const status = await defaultExecutorEngine.start({
      missionId,
      mode: mode === "dry_run" 
        ? ExecutionMode.DRY_RUN 
        : mode === "step_by_step"
          ? ExecutionMode.STEP_BY_STEP
          : ExecutionMode.AUTO_PILOT,
      userId,
      sandboxLimits,
      autoStart: mode !== "dry_run",
    });

    return c.json(status, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * POST /api/executor/:executorId/pause
 * Pause execution
 */
app.post("/:executorId/pause", async (c) => {
  try {
    const { executorId } = c.req.param();
    const userId = c.req.header("x-user-id");

    const status = await defaultExecutorEngine.pause(executorId, userId);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * POST /api/executor/:executorId/resume
 * Resume execution
 */
app.post("/:executorId/resume", async (c) => {
  try {
    const { executorId } = c.req.param();
    const userId = c.req.header("x-user-id");

    const status = await defaultExecutorEngine.resume(executorId, userId);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * POST /api/executor/:executorId/cancel
 * Cancel execution
 */
app.post("/:executorId/cancel", async (c) => {
  try {
    const { executorId } = c.req.param();
    const userId = c.req.header("x-user-id");

    const status = await defaultExecutorEngine.cancel(executorId, userId);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

// ============================================================================
// EXECUTOR STATUS
// ============================================================================

/**
 * GET /api/executor/:executorId
 * Get executor status
 */
app.get("/:executorId", async (c) => {
  try {
    const { executorId } = c.req.param();

    const status = defaultExecutorEngine.getStatus(executorId);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 404);
  }
});

/**
 * GET /api/executor/mission/:missionId
 * Get executor status by mission ID
 */
app.get("/mission/:missionId", async (c) => {
  try {
    const { missionId } = c.req.param();

    const status = defaultExecutorEngine.getStatusByMission(missionId);
    
    if (!status) {
      return c.json({ error: "No executor found for mission" }, 404);
    }

    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * GET /api/executor/mission/:missionId/full
 * Get full executor status with queue summary
 */
app.get("/mission/:missionId/full", async (c) => {
  try {
    const { missionId } = c.req.param();

    const [status, queue] = await Promise.all([
      defaultExecutorEngine.getStatusByMission(missionId),
      getMissionQueueSummary(missionId),
    ]);

    return c.json({ executor: status, queue });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

// ============================================================================
// EXECUTOR EVENTS
// ============================================================================

/**
 * GET /api/executor/:executorId/events
 * Get executor events
 */
app.get("/:executorId/events", async (c) => {
  try {
    const { executorId } = c.req.param();
    const limit = parseInt(c.req.query("limit") ?? "100");

    const events = defaultExecutorEngine.getEvents(executorId, limit);
    return c.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * GET /api/executor/mission/:missionId/events
 * Get executor events by mission ID
 */
app.get("/mission/:missionId/events", async (c) => {
  try {
    const { missionId } = c.req.param();
    const limit = parseInt(c.req.query("limit") ?? "100");

    const events = defaultExecutorEngine.getEventsByMission(missionId, limit);
    return c.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

// ============================================================================
// APPROVAL
// ============================================================================

/**
 * POST /api/executor/:executorId/approve/:taskId
 * Approve a task and continue execution
 */
app.post("/:executorId/approve/:taskId", async (c) => {
  try {
    const { executorId, taskId } = c.req.param();
    const userId = c.req.header("x-user-id") ?? "unknown";

    const status = await defaultExecutorEngine.approveAndContinue(executorId, taskId, userId);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

/**
 * POST /api/executor/:executorId/deny/:taskId
 * Deny a task and skip it
 */
app.post("/:executorId/deny/:taskId", async (c) => {
  try {
    const { executorId, taskId } = c.req.param();
    const userId = c.req.header("x-user-id") ?? "unknown";
    const body = await c.req.json().catch(() => ({}));
    const { reason } = body;

    const status = await defaultExecutorEngine.denyAndSkip(executorId, taskId, userId, reason);
    return c.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

// ============================================================================
// DRY RUN
// ============================================================================

/**
 * POST /api/executor/dry-run
 * Generate a dry run plan for a mission
 */
app.post("/dry-run", async (c) => {
  try {
    const body = await c.req.json();
    const { missionId, userId } = body;

    if (!missionId) {
      return c.json({ error: "missionId is required" }, 400);
    }

    const { plan, executor } = await defaultExecutorEngine.generateDryRunPlan(missionId, userId);
    return c.json({ plan, executor });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 400);
  }
});

// ============================================================================
// HEALTH & METRICS
// ============================================================================

/**
 * GET /api/executor/health
 * Check executor health
 */
app.get("/health", async (c) => {
  try {
    const { defaultSandboxManager } = await import("../server/executor/sandbox");
    
    const sandboxHealthy = await defaultSandboxManager.health();
    
    return c.json({
      status: sandboxHealthy ? "healthy" : "degraded",
      components: {
        sandbox: sandboxHealthy ? "up" : "down",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /api/executor/metrics
 * Get executor metrics
 */
app.get("/metrics", async (c) => {
  try {
    const { executorState } = await import("../server/executor/stateMachine");
    const { executionQueue } = await import("../server/executor/queue");
    const { defaultRecoveryEngine } = await import("../server/executor/recovery");

    const executors = Array.from(executorState.values());
    const recoveryStats = defaultRecoveryEngine.getStats();

    const byState: Record<string, number> = {};
    for (const executor of executors) {
      byState[executor.state] = (byState[executor.state] ?? 0) + 1;
    }

    return c.json({
      executors: {
        total: executors.length,
        byState,
      },
      queue: executionQueue.getStats(),
      recovery: recoveryStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

export default app;
