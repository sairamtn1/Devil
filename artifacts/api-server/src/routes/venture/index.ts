/**
 * DEVIL Autonomous Venture Factory - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  ventureFactory,
  VentureStatus,
  OpportunityStatus,
  ProductStatus,
} from "../../server/venture";

const router = Router();

// ============================================================================
// OPPORTUNITIES
// ============================================================================

// Get opportunities
router.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const opportunities = ventureFactory.getOpportunities(status as any);
    return res.json({ opportunities, total: opportunities.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create opportunity
router.post("/opportunity", async (req: Request, res: Response) => {
  try {
    const { title, description, category, strategicValue, marketSize, feasibility, competition, risk, expectedROI } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "title, description, and category are required" });
    }

    const opportunity = ventureFactory.addOpportunity(
      title, description, category,
      strategicValue || 50, marketSize || 1000000, feasibility || 50,
      competition || 50, risk || 50, expectedROI || 1.0
    );
    return res.status(201).json(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Evaluate opportunity
router.post("/opportunity/:id/evaluate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const opportunity = ventureFactory.evaluateOpportunity(id);
    return res.json(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Validate opportunity
router.post("/opportunity/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const opportunity = ventureFactory.validateOpportunity(id);
    return res.json(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// VENTURES
// ============================================================================

// Get ventures
router.get("/ventures", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const ventures = ventureFactory.getVentures(status as any);
    return res.json({ ventures, total: ventures.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create venture
router.post("/venture", async (req: Request, res: Response) => {
  try {
    const { name, description, opportunityId } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "name and description are required" });
    }

    const venture = ventureFactory.createVenture(name, description, opportunityId);
    return res.status(201).json(venture);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get venture
router.get("/venture/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const venture = ventureFactory.getVenture(id);

    if (!venture) {
      return res.status(404).json({ error: "Venture not found" });
    }

    return res.json(venture);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update venture status
router.patch("/venture/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    ventureFactory.updateVentureStatus(id, status);
    const venture = ventureFactory.getVenture(id);
    return res.json({ success: true, venture });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Validate venture
router.post("/venture/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = ventureFactory.validateVenture(id);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Simulate venture
router.post("/venture/:id/simulate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const simulation = ventureFactory.simulateVenture(id);
    return res.json(simulation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get venture intelligence
router.get("/venture/:id/intelligence", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intelligence = ventureFactory.getVentureIntelligence(id);
    return res.json(intelligence);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PRODUCTS
// ============================================================================

// Get products
router.get("/products", async (req: Request, res: Response) => {
  try {
    const { ventureId } = req.query;
    const products = ventureFactory.getProducts(ventureId as string);
    return res.json({ products, total: products.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create product
router.post("/product", async (req: Request, res: Response) => {
  try {
    const { ventureId, name, description, type } = req.body;

    if (!ventureId || !name || !description || !type) {
      return res.status(400).json({ error: "ventureId, name, description, and type are required" });
    }

    const product = ventureFactory.createProduct(ventureId, name, description, type);
    return res.status(201).json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update product status
router.patch("/product/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    ventureFactory.updateProductStatus(id, status);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GROWTH
// ============================================================================

// Update growth metrics
router.post("/venture/:id/growth", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metrics = req.body;

    ventureFactory.updateGrowthMetrics(id, metrics);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get growth metrics
router.get("/venture/:id/growth", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metrics = ventureFactory.getGrowthMetrics(id);

    if (!metrics) {
      return res.status(404).json({ error: "No metrics found" });
    }

    return res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PORTFOLIO
// ============================================================================

// Get portfolio summary
router.get("/portfolio", async (req: Request, res: Response) => {
  try {
    const summary = ventureFactory.getPortfolioSummary();
    return res.json(summary);
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
    const dashboard = ventureFactory.getDashboard();
    return res.json(dashboard);
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
    VentureStatus: Object.values(VentureStatus),
    OpportunityStatus: Object.values(OpportunityStatus),
    ProductStatus: Object.values(ProductStatus),
  });
});

export default router;
