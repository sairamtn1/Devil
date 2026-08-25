/**
 * DEVIL Architect 2.0 - API Routes
 */

import { Router, Request, Response } from "express";
import { architect, ComplexityLevel } from "../../server/architect";

const router = Router();

// Store generated roadmaps in memory (in production, use a database)
const roadmaps = new Map<string, ReturnType<typeof architect.generateRoadmap>>();

// ============================================================================
// ANALYSIS
// ============================================================================

// Analyze goal
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { goal, repositoryUrl, userPreferences, projectId } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const analysis = await architect.analyzeGoal(goal, {
      repositoryUrl,
      userPreferences,
      projectId
    });

    return res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ROADMAP
// ============================================================================

// Generate roadmap
router.post("/roadmap", async (req: Request, res: Response) => {
  try {
    const { goal, missionId, repositoryUrl, userPreferences, projectId } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const roadmap = architect.generateRoadmap(goal, {
      repositoryUrl,
      userPreferences,
      projectId
    });

    if (missionId) {
      roadmap.missionId = missionId;
    }

    // Store roadmap
    roadmaps.set(roadmap.id, roadmap);

    return res.status(201).json(roadmap);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Replan
router.post("/replan", async (req: Request, res: Response) => {
  try {
    const { roadmapId, failedTaskId, reason } = req.body;

    if (!roadmapId || !failedTaskId) {
      return res.status(400).json({ error: "roadmapId and failedTaskId are required" });
    }

    const roadmap = roadmaps.get(roadmapId);
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    const updated = architect.replan(roadmap, failedTaskId, reason || "Unknown failure");
    
    // Update stored roadmap
    roadmaps.set(roadmapId, updated);

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GETTERS
// ============================================================================

// Get roadmap
router.get("/roadmap/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roadmap = roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    return res.json(roadmap);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get mission roadmap
router.get("/mission/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;

    // Find roadmap by missionId
    let roadmap: ReturnType<typeof architect.generateRoadmap> | null = null;
    
    for (const r of roadmaps.values()) {
      if (r.missionId === missionId) {
        roadmap = r;
        break;
      }
    }

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found for mission" });
    }

    return res.json(roadmap);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// RISKS
// ============================================================================

// Get risks for roadmap
router.get("/risks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roadmap = roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    return res.json({
      risks: roadmap.analysis.risk,
      summary: {
        overallRisk: roadmap.analysis.risk.overallRisk,
        score: roadmap.analysis.risk.score,
        riskCount: roadmap.analysis.risk.risks.length,
        mitigationCount: roadmap.analysis.risk.mitigationPlan.length
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TIMELINE
// ============================================================================

// Get timeline for roadmap
router.get("/timeline/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roadmap = roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    return res.json({
      timeline: roadmap.analysis.timeline,
      phases: roadmap.analysis.timeline.phaseDurations,
      milestones: roadmap.analysis.timeline.milestoneDates,
      confidence: roadmap.analysis.timeline.confidence
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COMPLEXITY
// ============================================================================

// Get complexity for roadmap
router.get("/complexity/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roadmap = roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    return res.json({
      complexity: roadmap.analysis.complexity,
      scores: roadmap.scores
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STACK
// ============================================================================

// Recommend stack
router.post("/stack/recommend", async (req: Request, res: Response) => {
  try {
    const { goal, userPreferences, existingStack } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const analysis = await architect.analyzeGoal(goal);
    const recommendation = architect.recommendStack(analysis, userPreferences, { existingStack });

    return res.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get stack recommendation for roadmap
router.get("/stack/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roadmap = roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    return res.json(roadmap.analysis.stack);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// LEARNING
// ============================================================================

// Record mission results
router.post("/learn", async (req: Request, res: Response) => {
  try {
    const { missionId, plannedDuration, actualDuration, plannedComplexity, actualComplexity, risksOccurred, recoveriesSuccessful } = req.body;

    if (!missionId) {
      return res.status(400).json({ error: "missionId is required" });
    }

    const lessons = architect.learnFromMission(missionId, {
      plannedDuration: plannedDuration || 0,
      actualDuration: actualDuration || 0,
      plannedComplexity: plannedComplexity || ComplexityLevel.MEDIUM,
      actualComplexity: actualComplexity || ComplexityLevel.MEDIUM,
      risksOccurred: risksOccurred || [],
      recoveriesSuccessful: recoveriesSuccessful ?? true
    });

    return res.json(lessons);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVENTS & STATS
// ============================================================================

// Get architect events
router.get("/events", async (req: Request, res: Response) => {
  try {
    const events = architect.getEvents();
    return res.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get all roadmaps
router.get("/roadmaps", async (req: Request, res: Response) => {
  try {
    const all = Array.from(roadmaps.values());
    return res.json({ 
      roadmaps: all, 
      total: all.length,
      byVersion: all.reduce((acc, r) => {
        acc[r.id] = r.version;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ANALYZE SPECIFIC
// ============================================================================

// Analyze complexity
router.post("/complexity", async (req: Request, res: Response) => {
  try {
    const { goal, architecture } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const analysis = await architect.analyzeGoal(goal);
    const complexity = architect.estimateComplexity(analysis, architecture);

    return res.json(complexity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Analyze risk
router.post("/risk", async (req: Request, res: Response) => {
  try {
    const { goal, complexity, stack } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    const goalAnalysis = await architect.analyzeGoal(goal);
    const complexityEstimate = complexity || architect.estimateComplexity(goalAnalysis);
    const risk = architect.analyzeRisk(goalAnalysis, complexityEstimate, stack);

    return res.json(risk);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
