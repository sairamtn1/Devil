/**
 * DEVIL Self Modification Engine - API Routes
 */

import { Router, Request, Response } from "express";
import { selfModificationEngine } from "../../server/self-modify";

const router = Router();

// ============================================================================
// SELF MODIFICATION CORE
// ============================================================================

// Analyze weaknesses
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const improvements = selfModificationEngine.analyzeWeaknesses();
    return res.json({ improvements, total: improvements.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// IMPROVEMENT PLANNER
// ============================================================================

// Plan improvement
router.post("/plan", async (req: Request, res: Response) => {
  try {
    const { type, target, description, proposedChange } = req.body;

    if (!type || !target || !description || !proposedChange) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const improvement = selfModificationEngine.planImprovement(type, target, description, proposedChange);
    return res.status(201).json(improvement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get improvements
router.get("/improvements", async (req: Request, res: Response) => {
  try {
    const improvements = selfModificationEngine.getImprovements();
    return res.json({ improvements, total: improvements.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SANDBOX
// ============================================================================

// Create sandbox
router.post("/sandbox", async (req: Request, res: Response) => {
  try {
    const { improvementId } = req.body;

    if (!improvementId) {
      return res.status(400).json({ error: "improvementId is required" });
    }

    const sandbox = selfModificationEngine.createSandbox(improvementId);
    return res.status(201).json(sandbox);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Run sandbox tests
router.post("/sandbox/:id/test", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sandbox = selfModificationEngine.runSandboxTests(id);
    return res.json(sandbox);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Destroy sandbox
router.delete("/sandbox/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    selfModificationEngine.destroySandbox(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// VALIDATION
// ============================================================================

// Validate modification
router.post("/validate/:improvementId", async (req: Request, res: Response) => {
  try {
    const { improvementId } = req.params;
    const result = selfModificationEngine.validateModification(improvementId);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// APPLY & ROLLBACK
// ============================================================================

// Apply modification
router.post("/apply/:improvementId", async (req: Request, res: Response) => {
  try {
    const { improvementId } = req.params;
    const modification = selfModificationEngine.applyModification(improvementId);
    return res.json(modification);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Rollback modification
router.post("/rollback/:modificationId", async (req: Request, res: Response) => {
  try {
    const { modificationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "reason is required" });
    }

    const record = selfModificationEngine.rollbackModification(modificationId, reason);
    return res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get rollback history
router.get("/rollback/history", async (req: Request, res: Response) => {
  try {
    const history = selfModificationEngine.getRollbackHistory();
    return res.json({ history, total: history.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EXPERIMENTS
// ============================================================================

// Create experiment
router.post("/experiment", async (req: Request, res: Response) => {
  try {
    const { name, type, hypothesis } = req.body;

    if (!name || !type || !hypothesis) {
      return res.status(400).json({ error: "name, type, and hypothesis are required" });
    }

    const experiment = selfModificationEngine.createExperiment(name, type, hypothesis);
    return res.status(201).json(experiment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Run experiment
router.post("/experiment/:id/run", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const experiment = selfModificationEngine.runExperiment(id);
    return res.json(experiment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get experiments
router.get("/experiments", async (req: Request, res: Response) => {
  try {
    const experiments = selfModificationEngine.getExperiments();
    return res.json({ experiments, total: experiments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GENOME
// ============================================================================

// Get genome V2
router.get("/genome", async (req: Request, res: Response) => {
  try {
    const genome = selfModificationEngine.getGenome();
    return res.json(genome);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SELF IMPROVEMENT LOOP
// ============================================================================

// Run self improvement loop
router.post("/loop", async (req: Request, res: Response) => {
  try {
    const result = selfModificationEngine.runSelfImprovementLoop();
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

// Get dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = selfModificationEngine.getDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
