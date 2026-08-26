/**
 * DEVIL Autonomous Evolution & Self-Improvement - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  autonomousEvolution,
} from "../../server/evolution/evolution-plus";

const router = Router();

// ============================================================================
// LEARNING ENGINE
// ============================================================================

// Record mission outcome
router.post("/learn/outcome", async (req: Request, res: Response) => {
  try {
    const outcome = req.body;
    const recorded = autonomousEvolution.recordMissionOutcome(outcome);
    return res.status(201).json(recorded);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get learning history
router.get("/learn/history", async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const history = autonomousEvolution.getLearningHistory(
      limit ? parseInt(limit as string) : 100
    );
    return res.json({ history, total: history.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get patterns
router.get("/learn/patterns", async (req: Request, res: Response) => {
  try {
    const patterns = autonomousEvolution.getPatterns();
    return res.json({ patterns, total: patterns.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get agent performances
router.get("/learn/agents", async (req: Request, res: Response) => {
  try {
    const performances = autonomousEvolution.getAgentPerformances();
    return res.json({ performances, total: performances.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CAPABILITY ANALYZER
// ============================================================================

// Analyze capabilities
router.get("/capabilities/analyze", async (req: Request, res: Response) => {
  try {
    const analysis = autonomousEvolution.analyzeCapabilities();
    return res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// WEAKNESS DETECTOR
// ============================================================================

// Detect weaknesses
router.get("/weaknesses", async (req: Request, res: Response) => {
  try {
    const weaknesses = autonomousEvolution.detectWeaknesses();
    return res.json({ weaknesses, total: weaknesses.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update weakness status
router.patch("/weakness/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    autonomousEvolution.updateWeaknessStatus(id, status);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STRATEGY ENGINE
// ============================================================================

// Generate improvement proposals
router.post("/optimize/generate", async (req: Request, res: Response) => {
  try {
    const proposals = autonomousEvolution.generateImprovementProposals();
    return res.json({ proposals, total: proposals.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get all proposals
router.get("/optimize/proposals", async (req: Request, res: Response) => {
  try {
    const proposals = autonomousEvolution.getProposals();
    return res.json({ proposals, total: proposals.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Approve proposal
router.post("/optimize/proposal/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = autonomousEvolution.approveProposal(id);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Implement proposal
router.post("/optimize/proposal/:id/implement", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = autonomousEvolution.implementProposal(id);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EXPERIMENTATION ENGINE
// ============================================================================

// Create experiment
router.post("/experiment", async (req: Request, res: Response) => {
  try {
    const { name, type, hypothesis, control, variant } = req.body;

    if (!name || !type || !hypothesis) {
      return res.status(400).json({ error: "name, type, and hypothesis are required" });
    }

    const experiment = autonomousEvolution.createExperiment(
      name, type, hypothesis, control || {}, variant || {}
    );
    return res.status(201).json(experiment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Start experiment
router.post("/experiment/:id/start", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = autonomousEvolution.startExperiment(id);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Complete experiment
router.post("/experiment/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { controlMetric, variantMetric, recommendation } = req.body;

    const experiment = autonomousEvolution.completeExperiment(
      id, controlMetric || 0, variantMetric || 0, recommendation || ""
    );
    
    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found or not running" });
    }
    
    return res.json(experiment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get experiments
router.get("/experiments", async (req: Request, res: Response) => {
  try {
    const experiments = autonomousEvolution.getExperiments();
    return res.json({ experiments, total: experiments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GENOME
// ============================================================================

// Get DEVIL Genome
router.get("/genome", async (req: Request, res: Response) => {
  try {
    const genome = autonomousEvolution.getGenome();
    return res.json(genome);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MISSION RETROSPECTIVE
// ============================================================================

// Generate retrospective
router.get("/retrospective/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;
    const retrospective = autonomousEvolution.generateRetrospective(missionId);
    return res.json(retrospective);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVOLUTION SCORE
// ============================================================================

// Get evolution score
router.get("/score", async (req: Request, res: Response) => {
  try {
    const score = autonomousEvolution.getEvolutionScore();
    return res.json(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get score history
router.get("/scores", async (req: Request, res: Response) => {
  try {
    const scores = autonomousEvolution.getScoreHistory();
    return res.json({ scores, total: scores.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVOLUTION MEMORY
// ============================================================================

// Get evolution memory
router.get("/memory", async (req: Request, res: Response) => {
  try {
    const memory = autonomousEvolution.getEvolutionMemory();
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

// Get evolution dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = autonomousEvolution.getEvolutionDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
