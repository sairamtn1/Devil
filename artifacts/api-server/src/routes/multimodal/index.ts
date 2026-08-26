/**
 * DEVIL Unified Multimodal Cognitive Engine - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  multimodalEngine,
  ModalityType,
  EntityType,
} from "../../server/multimodal";

const router = Router();

// ============================================================================
// COGNITIVE GRAPH
// ============================================================================

// Get cognitive graph
router.get("/graph", async (req: Request, res: Response) => {
  try {
    const graph = multimodalEngine.getCognitiveGraph();
    return res.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add node to graph
router.post("/graph/node", async (req: Request, res: Response) => {
  try {
    const { id, label, type, properties, modalities } = req.body;

    if (!id || !label || !type) {
      return res.status(400).json({ error: "id, label, and type are required" });
    }

    const node = multimodalEngine.addToCognitiveGraph(id, label, type, properties || {}, modalities || []);
    return res.status(201).json(node);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add edge to graph
router.post("/graph/edge", async (req: Request, res: Response) => {
  try {
    const { source, target, relationship, weight } = req.body;

    if (!source || !target || !relationship) {
      return res.status(400).json({ error: "source, target, and relationship are required" });
    }

    const edge = multimodalEngine.addEdge(source, target, relationship, weight || 0.5);
    return res.status(201).json(edge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// UNIFIED KNOWLEDGE
// ============================================================================

// Create unified knowledge
router.post("/knowledge", async (req: Request, res: Response) => {
  try {
    const { concept, definition, modalities } = req.body;

    if (!concept || !definition) {
      return res.status(400).json({ error: "concept and definition are required" });
    }

    const knowledge = multimodalEngine.createUnifiedKnowledge(concept, definition, modalities || {});
    return res.status(201).json(knowledge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get unified knowledge
router.get("/knowledge", async (req: Request, res: Response) => {
  try {
    const knowledge = multimodalEngine.getUnifiedKnowledge();
    return res.json({ knowledge, total: knowledge.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CROSS-MODAL ANALYSIS
// ============================================================================

// Analyze cross-modal content
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { text, code, image, video, audio, document, diagram, data } = req.body;

    const insight = multimodalEngine.analyzeCrossModal({
      text,
      code,
      image,
      video,
      audio,
      document,
      diagram,
      data,
    });

    return res.status(201).json(insight);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get cross-modal insights
router.get("/insights", async (req: Request, res: Response) => {
  try {
    const insights = multimodalEngine.getCrossModalInsights();
    return res.json({ insights, total: insights.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SEMANTIC FUSION
// ============================================================================

// Fuse knowledge
router.post("/fuse", async (req: Request, res: Response) => {
  try {
    const { entities } = req.body;

    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({ error: "entities array is required" });
    }

    const fused = multimodalEngine.fuseKnowledge(entities);
    return res.status(201).json(fused);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CONSISTENCY
// ============================================================================

// Check consistency
router.get("/consistency", async (req: Request, res: Response) => {
  try {
    const report = multimodalEngine.checkConsistency();
    return res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// UNDERSTANDING SCORE
// ============================================================================

// Calculate understanding score
router.post("/understanding", async (req: Request, res: Response) => {
  try {
    const { modality } = req.body;
    const score = multimodalEngine.calculateUnderstandingScore(modality);
    return res.status(201).json(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get understanding scores
router.get("/understanding", async (req: Request, res: Response) => {
  try {
    const scores = multimodalEngine.getUnderstandingScores();
    return res.json({ scores, total: scores.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SIMULATION
// ============================================================================

// Simulate outcome
router.post("/simulate", async (req: Request, res: Response) => {
  try {
    const { text, code, diagram, data } = req.body;

    const result = multimodalEngine.simulateOutcome({ text, code, diagram, data });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// METRICS
// ============================================================================

// Get metrics
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = multimodalEngine.getMetrics();
    return res.json(metrics);
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
    ModalityType: Object.values(ModalityType),
    EntityType: Object.values(EntityType),
  });
});

export default router;
