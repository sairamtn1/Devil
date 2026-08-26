/**
 * DEVIL World Model & Strategic Intelligence - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  strategicIntelligence,
  ModelType,
  TrendDirection,
  RiskLevel,
  type Entity,
  type Trend,
  type Opportunity,
  type Risk,
  type Scenario,
  type Forecast,
  type Decision,
} from "../../server/worldmodel";

const router = Router();

// ============================================================================
// WORLD STATE
// ============================================================================

// Get world state summary
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const summary = strategicIntelligence.getWorldStateSummary();
    return res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get strategic metrics
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = strategicIntelligence.getStrategicMetrics();
    return res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ENTITIES
// ============================================================================

// Create entity
router.post("/entity", async (req: Request, res: Response) => {
  try {
    const { name, type, properties } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "name and type are required" });
    }

    const entity = strategicIntelligence.addEntity(name, type, properties || {});
    return res.status(201).json(entity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get entities
router.get("/entities", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const entities = strategicIntelligence.getEntities({ type: type as any });
    return res.json({ entities, total: entities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TRENDS
// ============================================================================

// Get trends
router.get("/trends", async (req: Request, res: Response) => {
  try {
    const { direction } = req.query;
    const trends = strategicIntelligence.getTrends(direction as any);
    return res.json({ trends, total: trends.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add trend
router.post("/trend", async (req: Request, res: Response) => {
  try {
    const { name, description, direction, velocity, impact } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "name and description are required" });
    }

    const trend = strategicIntelligence.addTrend(
      name, description, direction || TrendDirection.STABLE,
      velocity || 0, impact || 0.5
    );
    return res.status(201).json(trend);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SCENARIOS
// ============================================================================

// Generate scenarios
router.post("/scenarios", async (req: Request, res: Response) => {
  try {
    const { subject, conditions } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    const scenarios = strategicIntelligence.generateScenarios(subject, conditions || []);
    return res.status(201).json({ scenarios });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get scenarios
router.get("/scenarios", async (req: Request, res: Response) => {
  try {
    const scenarios = strategicIntelligence.getScenarios();
    return res.json({ scenarios, total: scenarios.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// OPPORTUNITIES
// ============================================================================

// Get opportunities
router.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const opportunities = strategicIntelligence.getOpportunities(status as any);
    return res.json({ opportunities, total: opportunities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add opportunity
router.post("/opportunity", async (req: Request, res: Response) => {
  try {
    const { title, description, type, strategicValue, effort, risk, roi } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const opportunity = strategicIntelligence.addOpportunity(
      title, description, type || "process",
      strategicValue || 50, effort || 50, risk || 50, roi || 1.0
    );
    return res.status(201).json(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Analyze opportunities
router.get("/opportunities/analyze", async (req: Request, res: Response) => {
  try {
    const analysis = strategicIntelligence.analyzeOpportunities();
    return res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// RISKS
// ============================================================================

// Get risks
router.get("/risks", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const risks = strategicIntelligence.getRisks(status as any);
    return res.json({ risks, total: risks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add risk
router.post("/risk", async (req: Request, res: Response) => {
  try {
    const { title, description, type, severity, probability, impact } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const risk = strategicIntelligence.addRisk(
      title, description, type || "execution",
      severity || RiskLevel.MEDIUM, probability || 0.5, impact || 0.5
    );
    return res.status(201).json(risk);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Predict risks
router.get("/risks/predict", async (req: Request, res: Response) => {
  try {
    const predictedRisks = strategicIntelligence.predictRisks();
    return res.json({ risks: predictedRisks, total: predictedRisks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// FORECASTS
// ============================================================================

// Get forecasts
router.get("/forecasts", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const forecasts = strategicIntelligence.getForecasts(category as string);
    return res.json({ forecasts, total: forecasts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create forecast
router.post("/forecast", async (req: Request, res: Response) => {
  try {
    const { subject, category, prediction, confidence, timeframe } = req.body;

    if (!subject || !prediction) {
      return res.status(400).json({ error: "subject and prediction are required" });
    }

    const forecast = strategicIntelligence.createForecast(
      subject, category || "general", prediction,
      confidence || 0.8, timeframe || "12 months"
    );
    return res.status(201).json(forecast);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Evaluate forecast
router.post("/forecast/:id/evaluate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualOutcome } = req.body;

    if (!actualOutcome) {
      return res.status(400).json({ error: "actualOutcome is required" });
    }

    const accuracy = strategicIntelligence.evaluateForecast(id, actualOutcome);
    return res.json({ accuracy });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get forecast accuracy
router.get("/forecasts/accuracy", async (req: Request, res: Response) => {
  try {
    const accuracy = strategicIntelligence.getForecastAccuracy();
    return res.json({ accuracy });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DECISIONS
// ============================================================================

// Make decision
router.post("/decision", async (req: Request, res: Response) => {
  try {
    const { title, description, options } = req.body;

    if (!title || !description || !options) {
      return res.status(400).json({ error: "title, description, and options are required" });
    }

    const decision = strategicIntelligence.makeStrategicDecision(title, description, options);
    return res.status(201).json(decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get decisions
router.get("/decisions", async (req: Request, res: Response) => {
  try {
    const decisions = strategicIntelligence.getDecisions();
    return res.json({ decisions, total: decisions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// KNOWLEDGE GRAPH
// ============================================================================

// Add knowledge node
router.post("/knowledge", async (req: Request, res: Response) => {
  try {
    const { label, type, properties } = req.body;

    if (!label || !type) {
      return res.status(400).json({ error: "label and type are required" });
    }

    const node = strategicIntelligence.addKnowledgeNode(label, type, properties || {});
    return res.status(201).json(node);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get related knowledge
router.get("/knowledge/:id/related", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const related = strategicIntelligence.getRelatedKnowledge(id);
    return res.json({ nodes: related, total: related.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CAUSAL REASONING
// ============================================================================

// Analyze cause-effect
router.get("/causal/:cause", async (req: Request, res: Response) => {
  try {
    const { cause } = req.params;
    const chains = strategicIntelligence.analyzeCauseEffect(cause);
    return res.json({ chains, total: chains.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STRATEGIC REPORT
// ============================================================================

// Generate strategic report
router.get("/report", async (req: Request, res: Response) => {
  try {
    const report = strategicIntelligence.generateStrategicReport();
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
    ModelType: Object.values(ModelType),
    TrendDirection: Object.values(TrendDirection),
    RiskLevel: Object.values(RiskLevel),
  });
});

export default router;
