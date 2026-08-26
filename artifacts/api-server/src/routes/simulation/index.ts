/**
 * DEVIL World Simulation Engine - API Routes
 */

import { Router, Request, Response } from "express";
import { worldSimulation } from "../../server/simulation";

const router = Router();

// ============================================================================
// MISSION SIMULATION
// ============================================================================

router.post("/mission", async (req: Request, res: Response) => {
  try {
    const { type, complexity, resources, team, timeline } = req.body;

    if (!type || complexity === undefined || resources === undefined) {
      return res.status(400).json({ error: "type, complexity, and resources are required" });
    }

    const simulation = worldSimulation.simulateMission({
      type,
      complexity,
      resources,
      team: team || [],
      timeline,
    });

    return res.status(201).json(simulation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// BUSINESS SIMULATION
// ============================================================================

router.post("/business", async (req: Request, res: Response) => {
  try {
    const { type, investment, marketSize, competition, teamQuality } = req.body;

    if (!type || investment === undefined) {
      return res.status(400).json({ error: "type and investment are required" });
    }

    const simulation = worldSimulation.simulateBusiness({
      type,
      investment,
      marketSize: marketSize || 1000000,
      competition: competition || 50,
      teamQuality: teamQuality || 70,
    });

    return res.status(201).json(simulation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SCENARIO GENERATION
// ============================================================================

router.post("/scenario", async (req: Request, res: Response) => {
  try {
    const { baseSuccess, variables } = req.body;

    const scenarios = worldSimulation.generateScenarios({
      baseSuccess: baseSuccess || 70,
      variables: variables || [],
    });

    return res.json({ scenarios, total: scenarios.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DECISION SIMULATION
// ============================================================================

router.post("/decision", async (req: Request, res: Response) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: "question and at least 2 options are required" });
    }

    const decision = worldSimulation.simulateDecision(question, options);
    return res.status(201).json(decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SIMULATION MANAGEMENT
// ============================================================================

router.get("/simulations", async (req: Request, res: Response) => {
  try {
    const simulations = worldSimulation.getSimulations();
    return res.json({ simulations, total: simulations.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/simulation/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const simulation = worldSimulation.getSimulation(id);

    if (!simulation) {
      return res.status(404).json({ error: "Simulation not found" });
    }

    return res.json(simulation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PREDICTION VALIDATION
// ============================================================================

router.post("/simulation/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualOutcome } = req.body;

    if (!actualOutcome) {
      return res.status(400).json({ error: "actualOutcome is required" });
    }

    worldSimulation.validatePrediction(id, actualOutcome);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ACCURACY
// ============================================================================

router.get("/accuracy", async (req: Request, res: Response) => {
  try {
    const accuracy = worldSimulation.getPredictionAccuracy();
    return res.json(accuracy);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = worldSimulation.getDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
