/**
 * DEVIL Autonomous Operations Center - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  autonomousOps,
  MissionStatus,
  SwarmAgentType,
  HighRiskActions,
  type DCLCommand,
} from "../../server/autonomous";

const router = Router();

// Store missions in memory (in production, use database)
const missions = new Map();

// ============================================================================
// MISSION MANAGEMENT
// ============================================================================

// Create mission
router.post("/mission", async (req: Request, res: Response) => {
  try {
    const { objective, constraints, resources, risks } = req.body;

    if (!objective) {
      return res.status(400).json({ error: "objective is required" });
    }

    const mission = autonomousOps.createMission(objective, { constraints, resources, risks });
    missions.set(mission.id, mission);

    return res.status(201).json({
      id: mission.id,
      objective: mission.objective,
      status: mission.status,
      createdAt: mission.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get mission
router.get("/mission/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mission = autonomousOps.getMission(id);

    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    return res.json({
      id: mission.id,
      objective: mission.objective,
      blueprint: mission.blueprint,
      status: mission.status,
      progress: mission.getProgress(),
      milestones: mission.milestones,
      workstreams: mission.getWorkstreams(),
      createdAt: mission.createdAt,
      completedAt: mission.completedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List missions
router.get("/missions", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let allMissions = autonomousOps.getAllMissions();

    if (status) {
      allMissions = allMissions.filter(m => m.status === status);
    }

    return res.json({
      missions: allMissions.map(m => ({
        id: m.id,
        objective: m.objective,
        status: m.status,
        progress: m.getProgress(),
        createdAt: m.createdAt,
      })),
      total: allMissions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Execute mission
router.post("/mission/:id/execute", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    autonomousOps.executeMission(id).then(mission => {
      // Mission completed
    }).catch(error => {
      // Mission failed
    });

    return res.status(202).json({ 
      message: "Mission execution started",
      missionId: id 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PLANNING
// ============================================================================

// Plan mission
router.post("/mission/:id/plan", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = autonomousOps.planMission(id);
    return res.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SWARM MANAGEMENT
// ============================================================================

// Spawn swarm
router.post("/mission/:id/swarm", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agents } = req.body;

    if (!agents || !Array.isArray(agents)) {
      return res.status(400).json({ 
        error: "agents array is required" 
      });
    }

    const swarm = autonomousOps.spawnSwarm(id, agents);

    return res.status(201).json({
      agents: swarm,
      count: swarm.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get swarm
router.get("/mission/:id/swarm", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const swarm = autonomousOps.getSwarm(id);

    return res.json({
      agents: swarm,
      count: swarm.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

// Assign task
router.post("/task", async (req: Request, res: Response) => {
  try {
    const { agentId, missionId, description, priority, dependencies, parallel } = req.body;

    if (!agentId || !missionId || !description) {
      return res.status(400).json({ 
        error: "agentId, missionId, and description are required" 
      });
    }

    const task = autonomousOps.assignTask(agentId, missionId, description, {
      priority,
      dependencies,
      parallel,
    });

    return res.status(201).json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Execute task
router.post("/task/:id/execute", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await autonomousOps.executeTask(id);
    return res.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SELF-HEALING
// ============================================================================

// Report failure
router.post("/failure", async (req: Request, res: Response) => {
  try {
    const { taskId, agentId, error } = req.body;

    if (!taskId || !agentId || !error) {
      return res.status(400).json({ 
        error: "taskId, agentId, and error are required" 
      });
    }

    const failure = autonomousOps.detectFailure(taskId, agentId, error);
    const strategies = autonomousOps.getRecoveryStrategies(error);

    return res.status(201).json({
      failure,
      recoveryStrategies: strategies,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Execute recovery
router.post("/failure/:id/recover", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { strategy } = req.body;

    if (!strategy) {
      return res.status(400).json({ error: "strategy is required" });
    }

    const success = autonomousOps.executeRecovery(id, strategy);

    return res.json({ 
      success,
      message: success ? "Recovery successful" : "Recovery failed, escalation may be needed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// OPTIMIZATION
// ============================================================================

// Optimize mission
router.post("/mission/:id/optimize", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const optimization = autonomousOps.optimizeMission(id);
    return res.json(optimization);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MONITORING
// ============================================================================

// Get mission metrics
router.get("/mission/:id/metrics", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metrics = autonomousOps.getMissionMetrics(id);

    if (!metrics) {
      return res.status(404).json({ error: "Mission not found" });
    }

    return res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get system stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = autonomousOps.getSystemStats();
    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COST INTELLIGENCE
// ============================================================================

// Get optimal model
router.post("/cost/model", async (req: Request, res: Response) => {
  try {
    const { taskType } = req.body;

    if (!taskType) {
      return res.status(400).json({ error: "taskType is required" });
    }

    const model = autonomousOps.selectOptimalModel(taskType);
    return res.json(model);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Track cost
router.post("/cost/track", async (req: Request, res: Response) => {
  try {
    const { missionId, cost } = req.body;

    if (!missionId || cost === undefined) {
      return res.status(400).json({ 
        error: "missionId and cost are required" 
      });
    }

    autonomousOps.trackCost(missionId, cost);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SECURITY
// ============================================================================

// Check action risk
router.post("/security/check", async (req: Request, res: Response) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    const isHighRisk = autonomousOps.isHighRiskAction(action);
    const requirements = autonomousOps.getApprovalRequirements(action);

    return res.json({
      action,
      isHighRisk,
      requiresApproval: requirements.required,
      reason: requirements.reason,
      approvers: requirements.approvers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MISSION REPLAY
// ============================================================================

// Get replay log
router.get("/replay", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query;
    const events = autonomousOps.getReplayLog(missionId as string);

    return res.json({
      events,
      total: events.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get mission timeline
router.get("/mission/:id/timeline", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timeline = autonomousOps.generateMissionTimeline(id);
    return res.json(timeline);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DEVIL COMMAND LANGUAGE
// ============================================================================

// Parse DCL
router.post("/dcl/parse", async (req: Request, res: Response) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: "command is required" });
    }

    const commands = autonomousOps.parseDCL(command);
    return res.json({ commands });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Execute DCL
router.post("/dcl/execute", async (req: Request, res: Response) => {
  try {
    const { commands } = req.body;

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({ error: "commands array is required" });
    }

    const result = autonomousOps.executeDCL(commands);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ENUMS
// ============================================================================

router.get("/enums", async (req: Request, res: Response) => {
  return res.json({
    MissionStatus: Object.values(MissionStatus),
    AgentStatus: Object.values(MissionStatus),
    SwarmAgentType: Object.values(SwarmAgentType),
    HighRiskActions,
  });
});

export default router;
