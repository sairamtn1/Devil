/**
 * DEVIL Orchestrator - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  orchestrator, 
  AgentType, 
  AgentState, 
  TaskState, 
  MissionState,
  OrchestrationMode,
  type AgentRegistration,
  type OrchestratedTask
} from "../../server/orchestrator";

const router = Router();

// ============================================================================
// AGENTS
// ============================================================================

// Get all agents
router.get("/agents", async (req: Request, res: Response) => {
  try {
    const { type, state } = req.query;
    
    let agents = orchestrator.getAllAgents();
    
    if (type) {
      agents = agents.filter(a => a.type === type);
    }
    
    if (state) {
      agents = agents.filter(a => a.state === state);
    }
    
    return res.json({ agents, total: agents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Register agent
router.post("/agents", async (req: Request, res: Response) => {
  try {
    const registration: AgentRegistration = req.body;
    
    if (!registration.type || !registration.name) {
      return res.status(400).json({ error: "type and name are required" });
    }
    
    const agent = orchestrator.registerAgent(registration);
    return res.status(201).json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get single agent
router.get("/agents/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = orchestrator.getAgent(id);
    
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    return res.json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Unregister agent
router.delete("/agents/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = orchestrator.unregisterAgent(id);
    
    if (!success) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Agent heartbeat
router.post("/agents/:id/heartbeat", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { health } = req.body;
    
    const success = orchestrator.heartbeat(id);
    
    if (!success) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    if (health !== undefined) {
      orchestrator.updateAgentHealth(id, health);
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MISSIONS
// ============================================================================

// Start mission
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { goal, mode, userId, roadmapId, tasks } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }
    
    const validModes = Object.values(OrchestrationMode);
    const missionMode = mode && validModes.includes(mode) ? mode : orchestrator.getMode();
    
    const mission = orchestrator.createMission(goal, missionMode, {
      userId,
      roadmapId,
      tasks,
    });
    
    // Start workflow execution
    orchestrator.executeWorkflow(mission.id);
    
    return res.status(201).json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get mission
router.get("/mission/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mission = orchestrator.getMission(id);
    
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    
    return res.json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get all missions
router.get("/missions", async (req: Request, res: Response) => {
  try {
    const { state, mode } = req.query;
    
    let missions = orchestrator.getAllMissions();
    
    if (state) {
      missions = missions.filter(m => m.state === state);
    }
    
    if (mode) {
      missions = missions.filter(m => m.mode === mode);
    }
    
    return res.json({ missions, total: missions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Pause mission
router.post("/pause/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = orchestrator.pauseMission(id);
    
    if (!success) {
      return res.status(400).json({ error: "Cannot pause mission" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Resume mission
router.post("/resume/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = orchestrator.resumeMission(id);
    
    if (!success) {
      return res.status(400).json({ error: "Cannot resume mission" });
    }
    
    // Restart workflow
    orchestrator.executeWorkflow(id);
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Cancel mission
router.post("/cancel/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = orchestrator.cancelMission(id);
    
    if (!success) {
      return res.status(400).json({ error: "Cannot cancel mission" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TASKS
// ============================================================================

// Get task
router.get("/task/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mission = orchestrator.getMission(id.split("-")[1] || "");
    
    if (!mission) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const task = mission.tasks.find(t => t.id === id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    return res.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Complete task
router.post("/task/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { output } = req.body;
    
    const success = orchestrator.completeTask(id, output);
    
    if (!success) {
      return res.status(400).json({ error: "Cannot complete task" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Fail task
router.post("/task/:id/fail", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = req.body;
    
    const success = orchestrator.failTask(id, error || "Unknown error");
    
    if (!success) {
      return res.status(400).json({ error: "Cannot fail task" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// WORKFLOWS
// ============================================================================

// Get workflows
router.get("/workflows", async (req: Request, res: Response) => {
  try {
    const missions = orchestrator.getAllMissions();
    
    const workflows = missions.map(m => ({
      id: m.workflow.id,
      name: m.workflow.name,
      type: m.workflow.type,
      missionId: m.id,
      state: m.state,
      stepCount: m.workflow.steps.length,
      createdAt: m.createdAt,
    }));
    
    return res.json({ workflows, total: workflows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MODE
// ============================================================================

// Get mode
router.get("/mode", async (req: Request, res: Response) => {
  try {
    return res.json({
      mode: orchestrator.getMode(),
      config: orchestrator.getModeConfig(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Set mode
router.post("/mode", async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    
    if (!mode || !Object.values(OrchestrationMode).includes(mode)) {
      return res.status(400).json({ 
        error: `Invalid mode. Must be one of: ${Object.values(OrchestrationMode).join(", ")}` 
      });
    }
    
    orchestrator.setMode(mode);
    
    return res.json({ 
      mode: orchestrator.getMode(),
      config: orchestrator.getModeConfig(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVENTS & STATS
// ============================================================================

// Get events
router.get("/events", async (req: Request, res: Response) => {
  try {
    const events = orchestrator.getEvents();
    return res.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = orchestrator.getStats();
    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ENUMS (for frontend)
// ============================================================================

// Get enums
router.get("/enums", async (req: Request, res: Response) => {
  return res.json({
    AgentType: Object.values(AgentType),
    AgentState: Object.values(AgentState),
    TaskState: Object.values(TaskState),
    MissionState: Object.values(MissionState),
    OrchestrationMode: Object.values(OrchestrationMode),
    WorkflowType: ["SEQUENTIAL", "PARALLEL", "CONDITIONAL"],
  });
});

export default router;
