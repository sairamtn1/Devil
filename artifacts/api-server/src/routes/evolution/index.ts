/**
 * DEVIL Self-Evolution Engine - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  selfEvolution,
  EvolutionStatus,
  ComponentType,
  type OptimizationOpportunity,
  type EvolutionProposal,
} from "../../server/evolution";

const router = Router();

// ============================================================================
// SELF EVALUATION
// ============================================================================

// Perform self-evaluation
router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const evaluation = selfEvolution.performSelfEvaluation();
    return res.status(201).json(evaluation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get latest evaluation
router.get("/evaluation", async (req: Request, res: Response) => {
  try {
    const evaluation = selfEvolution.getLatestEvaluation();
    if (!evaluation) {
      return res.status(404).json({ error: "No evaluations found" });
    }
    return res.json(evaluation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get evaluation history
router.get("/evaluations", async (req: Request, res: Response) => {
  try {
    const history = selfEvolution.getEvaluationHistory();
    return res.json({ evaluations: history, total: history.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COMPONENTS
// ============================================================================

// Get components
router.get("/components", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const components = selfEvolution.getComponents(type as any);
    return res.json({ components, total: components.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Register component
router.post("/component", async (req: Request, res: Response) => {
  try {
    const { name, type, version } = req.body;

    if (!name || !type || !version) {
      return res.status(400).json({ error: "name, type, and version are required" });
    }

    const component = selfEvolution.registerComponent(name, type, version);
    return res.status(201).json(component);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// OPTIMIZATION OPPORTUNITIES
// ============================================================================

// Identify opportunities
router.post("/opportunities/identify", async (req: Request, res: Response) => {
  try {
    const opportunities = selfEvolution.identifyOptimizationOpportunities();
    return res.json({ opportunities, total: opportunities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get opportunities
router.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const opportunities = selfEvolution.getOpportunities(category as any);
    return res.json({ opportunities, total: opportunities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SIMULATION
// ============================================================================

// Simulate change
router.post("/simulate/:opportunityId", async (req: Request, res: Response) => {
  try {
    const { opportunityId } = req.params;
    const result = selfEvolution.simulateChange(opportunityId);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get simulation
router.get("/simulation/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const simulation = selfEvolution.getSimulation(id);

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
// CAPABILITIES
// ============================================================================

// Get capabilities
router.get("/capabilities", async (req: Request, res: Response) => {
  try {
    const capabilities = selfEvolution.getCapabilities();
    return res.json({ capabilities, total: capabilities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Detect capability gaps
router.get("/capabilities/gaps", async (req: Request, res: Response) => {
  try {
    const gaps = selfEvolution.detectCapabilityGaps();
    return res.json({ gaps, total: gaps.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVOLUTION PROPOSALS
// ============================================================================

// Create proposal
router.post("/proposal", async (req: Request, res: Response) => {
  try {
    const { title, description, category, impact, expectedBenefits, potentialRisks } = req.body;

    if (!title || !description || !category || !impact) {
      return res.status(400).json({ error: "title, description, category, and impact are required" });
    }

    const proposal = selfEvolution.createProposal(
      title, description, category, impact, expectedBenefits || [], potentialRisks || []
    );
    return res.status(201).json(proposal);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get proposals
router.get("/proposals", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const proposals = selfEvolution.getProposals(status as any);
    return res.json({ proposals, total: proposals.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Approve proposal
router.post("/proposal/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approver } = req.body;

    if (!approver) {
      return res.status(400).json({ error: "approver is required" });
    }

    selfEvolution.approveProposal(id, approver);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Reject proposal
router.post("/proposal/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    selfEvolution.rejectProposal(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Implement proposal
router.post("/proposal/:id/implement", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    selfEvolution.implementProposal(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// META LEARNING
// ============================================================================

// Record meta learning
router.post("/meta-learning", async (req: Request, res: Response) => {
  try {
    const { category, pattern, context, outcome, lessons, improvement } = req.body;

    if (!category || !pattern || !outcome) {
      return res.status(400).json({ error: "category, pattern, and outcome are required" });
    }

    const learning = selfEvolution.recordMetaLearning(
      category, pattern, context || "", outcome, lessons || [], improvement || ""
    );
    return res.status(201).json(learning);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get meta learnings
router.get("/meta-learnings", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const learnings = selfEvolution.getMetaLearnings(category as string);
    return res.json({ learnings, total: learnings.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Apply meta learning
router.post("/meta-learning/:id/apply", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    selfEvolution.applyMetaLearning(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GOVERNANCE
// ============================================================================

// Get governance policy
router.get("/governance", async (req: Request, res: Response) => {
  try {
    const policy = selfEvolution.getGovernancePolicy();
    return res.json(policy);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Check approval requirement
router.post("/governance/check", async (req: Request, res: Response) => {
  try {
    const { impact } = req.body;

    if (!impact) {
      return res.status(400).json({ error: "impact is required" });
    }

    const requiresApproval = selfEvolution.requiresApproval(impact);
    return res.json({ requiresApproval, impact });
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
    const dashboard = selfEvolution.getEvolutionDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Generate self-analysis report
router.get("/report", async (req: Request, res: Response) => {
  try {
    const report = selfEvolution.generateSelfAnalysisReport();
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
    ComponentType: Object.values(ComponentType),
    EvolutionStatus: Object.values(EvolutionStatus),
    ImprovementPriority: Object.values(ImprovementPriority),
  });
});

export default router;
