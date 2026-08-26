/**
 * DEVIL Research & Innovation Lab - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  researchLab,
  ResearchDivision,
  ResearchStatus,
  HypothesisStatus,
  ExperimentStatus,
} from "../../server/research";

const router = Router();

// ============================================================================
// RESEARCH PROJECTS
// ============================================================================

// Create research project
router.post("/project", async (req: Request, res: Response) => {
  try {
    const { title, description, division, problem, objectives, priority, budget } = req.body;

    if (!title || !description || !division) {
      return res.status(400).json({ error: "title, description, and division are required" });
    }

    const project = researchLab.createResearchProject(title, description, division, {
      problem,
      objectives,
      priority,
      budget,
    });

    return res.status(201).json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get research project
router.get("/project/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = researchLab.getResearchProject(id);

    if (!project) {
      return res.status(404).json({ error: "Research project not found" });
    }

    return res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List research projects
router.get("/projects", async (req: Request, res: Response) => {
  try {
    const { division, status } = req.query;

    const projects = researchLab.getAllProjects({
      division: division as any,
      status: status as any,
    });

    return res.json({ projects, total: projects.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update project status
router.patch("/project/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    researchLab.updateProjectStatus(id, status);
    const project = researchLab.getResearchProject(id);

    return res.json({ success: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// HYPOTHESES
// ============================================================================

// Generate hypotheses
router.post("/project/:id/hypotheses", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { problem } = req.body;

    if (!problem) {
      return res.status(400).json({ error: "problem is required" });
    }

    const hypotheses = researchLab.generateHypotheses(id, problem);
    return res.status(201).json({ hypotheses });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get hypothesis
router.get("/hypothesis/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hypothesis = researchLab.getHypothesis(id);

    if (!hypothesis) {
      return res.status(404).json({ error: "Hypothesis not found" });
    }

    return res.json(hypothesis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update hypothesis status
router.patch("/hypothesis/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    researchLab.updateHypothesisStatus(id, status);
    const hypothesis = researchLab.getHypothesis(id);

    return res.json({ success: true, hypothesis });
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
    const { hypothesisId, title, objective, methodology, variables, metrics, successCriteria, risks, resources } = req.body;

    if (!hypothesisId || !title) {
      return res.status(400).json({ error: "hypothesisId and title are required" });
    }

    const experiment = researchLab.createExperiment(hypothesisId, title, {
      objective,
      methodology,
      variables,
      metrics,
      successCriteria,
      risks,
      resources,
    });

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
    const experiment = researchLab.runExperiment(id);
    return res.json({ success: true, experiment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Complete experiment
router.post("/experiment/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({ error: "results are required" });
    }

    const experiment = researchLab.completeExperiment(id, results);
    return res.json({ success: true, experiment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// KNOWLEDGE
// ============================================================================

// Acquire knowledge
router.post("/knowledge", async (req: Request, res: Response) => {
  try {
    const { type, title, content, source, sourceId, tags, applicability } = req.body;

    if (!type || !title || !content || !source) {
      return res.status(400).json({ error: "type, title, content, and source are required" });
    }

    const knowledge = researchLab.acquireKnowledge(type, title, content, source, {
      sourceId,
      tags,
      applicability,
    });

    return res.status(201).json(knowledge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Search knowledge
router.get("/knowledge/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const results = researchLab.searchKnowledge(query as string);
    return res.json({ results, total: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Use knowledge
router.post("/knowledge/:id/use", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    researchLab.useKnowledge(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DISCOVERIES
// ============================================================================

// Get breakthroughs
router.get("/breakthroughs", async (req: Request, res: Response) => {
  try {
    const breakthroughs = researchLab.getDiscovered breakthroughs();
    return res.json({ breakthroughs, total: breakthroughs.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// BENCHMARKING
// ============================================================================

// Set benchmark
router.post("/benchmark", async (req: Request, res: Response) => {
  try {
    const { name, metrics } = req.body;

    if (!name || !metrics) {
      return res.status(400).json({ error: "name and metrics are required" });
    }

    researchLab.setBenchmark(name, metrics);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get benchmark
router.get("/benchmark/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const benchmark = researchLab.getBenchmark(name);

    if (!benchmark) {
      return res.status(404).json({ error: "Benchmark not found" });
    }

    return res.json(benchmark);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Compare against benchmark
router.post("/benchmark/:name/compare", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { current } = req.body;

    if (!current) {
      return res.status(400).json({ error: "current metrics are required" });
    }

    const comparison = researchLab.compareAgainstBenchmark(name, current);
    return res.json({ comparison });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// INTELLECTUAL PROPERTY
// ============================================================================

// Register IP
router.post("/ip", async (req: Request, res: Response) => {
  try {
    const { title, type, description, owner, applications, strategicValue } = req.body;

    if (!title || !type || !description || !owner) {
      return res.status(400).json({ error: "title, type, description, and owner are required" });
    }

    const ip = researchLab.registerIntellectualProperty(title, type, description, owner, {
      applications,
      strategicValue,
    });

    return res.status(201).json(ip);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get research analytics
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const analytics = researchLab.getResearchAnalytics();
    return res.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Generate report
router.get("/report", async (req: Request, res: Response) => {
  try {
    const report = researchLab.generateResearchReport();
    return res.json(report);
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
    ResearchDivision: Object.values(ResearchDivision),
    ResearchStatus: Object.values(ResearchStatus),
    HypothesisStatus: Object.values(HypothesisStatus),
    ExperimentStatus: Object.values(ExperimentStatus),
  });
});

export default router;
