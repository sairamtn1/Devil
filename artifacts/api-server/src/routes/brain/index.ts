/**
 * DEVIL Brain - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  devilBrain,
  OperatingMode,
  ModelProvider,
  TaskDomain,
  type MissionAnalysis,
  type ReasoningTrace,
  type WorkflowPlan,
  type ContextSource,
  type Decision,
} from "../../server/brain";

const router = Router();

// Store analyses temporarily
const analyses: Map<string, MissionAnalysis> = new Map();
const workflows: Map<string, WorkflowPlan> = new Map();
const reasoningTraces: Map<string, ReasoningTrace> = new Map();

// ============================================================================
// MISSION ANALYSIS
// ============================================================================

// Analyze mission
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { goal, urgency, risk } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const analysis = devilBrain.analyzeMission(goal, { urgency, risk });
    analyses.set(analysis.id, analysis);

    return res.status(201).json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get mission analysis
router.get("/mission/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = analyses.get(id);

    if (!analysis) {
      return res.status(404).json({ error: "Mission analysis not found" });
    }

    return res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ROUTING
// ============================================================================

// Route task to model
router.post("/route", async (req: Request, res: Response) => {
  try {
    const { taskType, reasoning, speed, cost } = req.body;

    if (!taskType) {
      return res.status(400).json({ error: "taskType is required" });
    }

    if (!Object.values(TaskDomain).includes(taskType)) {
      return res.status(400).json({
        error: `Invalid taskType. Must be one of: ${Object.values(TaskDomain).join(", ")}`
      });
    }

    const selection = devilBrain.selectModel(taskType, { reasoning, speed, cost });
    return res.json(selection);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get available models
router.get("/models", async (req: Request, res: Response) => {
  try {
    const configs = devilBrain.getModelConfigs();
    return res.json({ models: configs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// REASONING
// ============================================================================

// Reason about mission
router.post("/reason", async (req: Request, res: Response) => {
  try {
    const { missionId, goal } = req.body;

    if (!missionId && !goal) {
      return res.status(400).json({ error: "missionId or goal is required" });
    }

    let mission: MissionAnalysis;

    if (missionId) {
      mission = analyses.get(missionId);
      if (!mission) {
        return res.status(404).json({ error: "Mission analysis not found" });
      }
    } else {
      mission = devilBrain.analyzeMission(goal!);
      analyses.set(mission.id, mission);
    }

    const trace = devilBrain.reason(mission, goal || mission.goal);
    reasoningTraces.set(trace.id, trace);

    return res.status(201).json(trace);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DECISION MAKING
// ============================================================================

// Make decision
router.post("/decide", async (req: Request, res: Response) => {
  try {
    const { missionId, type, options, reasoning } = req.body;

    if (!type || !options) {
      return res.status(400).json({ error: "type and options are required" });
    }

    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ error: "options must be a non-empty array" });
    }

    const decision = devilBrain.makeDecision(
      missionId || "unknown",
      type,
      options,
      reasoning || ""
    );

    return res.status(201).json(decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get decisions
router.get("/decisions", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query;
    const decisions = devilBrain.getDecisions(missionId as string);
    return res.json({ decisions, total: decisions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// WORKFLOW PLANNING
// ============================================================================

// Plan workflow
router.post("/workflow", async (req: Request, res: Response) => {
  try {
    const { missionId, goal, urgency, risk } = req.body;

    let mission: MissionAnalysis;

    if (missionId) {
      mission = analyses.get(missionId);
      if (!mission) {
        return res.status(404).json({ error: "Mission analysis not found" });
      }
    } else if (goal) {
      mission = devilBrain.analyzeMission(goal, { urgency, risk });
      analyses.set(mission.id, mission);
    } else {
      return res.status(400).json({ error: "missionId or goal is required" });
    }

    const workflow = devilBrain.planWorkflow(mission);
    workflows.set(workflow.id, workflow);

    return res.status(201).json(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get workflow
router.get("/workflow/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = workflows.get(id);

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    return res.json(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CONTEXT
// ============================================================================

// Build context
router.post("/context", async (req: Request, res: Response) => {
  try {
    const { missionId, sources, maxTokens } = req.body;

    if (!sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: "sources array is required" });
    }

    const contextSources: ContextSource[] = sources.map((s: any) => ({
      type: s.type || "mission",
      id: s.id || "unknown",
      relevance: s.relevance || 0.5,
      content: s.content || "",
    }));

    const context = devilBrain.buildContext(
      missionId || "unknown",
      contextSources,
      maxTokens || 128000
    );

    return res.json(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MODE MANAGEMENT
// ============================================================================

// Get/set operating mode
router.get("/mode", async (req: Request, res: Response) => {
  try {
    const characteristics = devilBrain.getModeCharacteristics();
    return res.json(characteristics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/mode", async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;

    if (!mode) {
      return res.status(400).json({ error: "mode is required" });
    }

    if (!Object.values(OperatingMode).includes(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Must be one of: ${Object.values(OperatingMode).join(", ")}`
      });
    }

    devilBrain.setMode(mode);
    const characteristics = devilBrain.getModeCharacteristics();

    return res.json(characteristics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

// Get recommendations
router.get("/recommendations", async (req: Request, res: Response) => {
  try {
    const { agentType, taskDomain } = req.query;

    if (!agentType || !taskDomain) {
      return res.status(400).json({ 
        error: "agentType and taskDomain query parameters are required" 
      });
    }

    const recommendations = devilBrain.getRecommendations(
      agentType as string,
      taskDomain as string
    );

    return res.json({ recommendations });
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
    OperatingMode: Object.values(OperatingMode),
    ModelProvider: Object.values(ModelProvider),
    AgentType: Object.values(AgentType),
    TaskDomain: Object.values(TaskDomain),
    ComplexityLevel: ["trivial", "low", "medium", "high", "critical"],
    UrgencyLevel: ["low", "normal", "high", "critical"],
    RiskLevel: ["low", "medium", "high", "critical"],
  });
});

export default router;
