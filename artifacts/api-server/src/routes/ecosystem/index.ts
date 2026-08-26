/**
 * DEVIL Ecosystem & Marketplace Platform - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  ecosystemPlatform,
  AssetType,
  AssetStatus,
  TrustLevel,
  PricingModel,
} from "../../server/ecosystem";

const router = Router();

// ============================================================================
// DEVELOPERS
// ============================================================================

// Register developer
router.post("/developer", async (req: Request, res: Response) => {
  try {
    const { name, email, organization } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const developer = ecosystemPlatform.registerDeveloper(name, email, organization);
    return res.status(201).json(developer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get developer
router.get("/developer/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const developer = ecosystemPlatform.getDeveloper(id);

    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    return res.json(developer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get developers
router.get("/developers", async (req: Request, res: Response) => {
  try {
    const { trustLevel, verified } = req.query;
    const developers = ecosystemPlatform.getDevelopers({
      trustLevel: trustLevel as any,
      verified: verified === "true" ? true : verified === "false" ? false : undefined,
    });
    return res.json({ developers, total: developers.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Verify developer
router.post("/developer/:id/verify", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const developer = ecosystemPlatform.verifyDeveloper(id);
    return res.json({ success: true, developer });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ASSETS
// ============================================================================

// Create asset
router.post("/asset", async (req: Request, res: Response) => {
  try {
    const { name, description, type, developerId, category, tags, pricingModel, price } = req.body;

    if (!name || !description || !type || !developerId || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const asset = ecosystemPlatform.createAsset(
      name, description, type, developerId, category, tags || [],
      pricingModel || PricingModel.FREE, price || 0
    );
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get asset
router.get("/asset/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = ecosystemPlatform.getAsset(id);

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get assets
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const { type, status, category, developerId } = req.query;
    const assets = ecosystemPlatform.getAssets({
      type: type as any,
      status: status as any,
      category: category as string,
      developerId: developerId as string,
    });
    return res.json({ assets, total: assets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Publish asset
router.post("/asset/:id/publish", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = ecosystemPlatform.publishAsset(id);
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Install asset
router.post("/asset/:id/install", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = ecosystemPlatform.installAsset(id);
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Rate asset
router.post("/asset/:id/rate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const asset = ecosystemPlatform.rateAsset(id, rating);
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Submit for review
router.post("/asset/:id/submit-review", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = ecosystemPlatform.submitForReview(id);
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Approve asset
router.post("/asset/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = ecosystemPlatform.approveAsset(id);
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Reject asset
router.post("/asset/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const asset = ecosystemPlatform.rejectAsset(id, reason || "Not approved");
    return res.json({ success: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// REVIEWS
// ============================================================================

// Create review
router.post("/review", async (req: Request, res: Response) => {
  try {
    const { assetId, developerId, rating, comment } = req.body;

    if (!assetId || !developerId || !rating) {
      return res.status(400).json({ error: "assetId, developerId, and rating are required" });
    }

    const review = ecosystemPlatform.createReview(assetId, developerId, rating, comment || "");
    return res.status(201).json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get reviews for asset
router.get("/asset/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviews = ecosystemPlatform.getReviews(id);
    return res.json({ reviews, total: reviews.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

// Search assets
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, type, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const assets = ecosystemPlatform.searchAssets(q as string, {
      type: type as any,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return res.json({ assets, total: assets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get trending assets
router.get("/trending", async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const assets = ecosystemPlatform.getTrendingAssets(limit ? parseInt(limit as string) : 10);
    return res.json({ assets, total: assets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get recommended assets
router.get("/recommended/:developerId", async (req: Request, res: Response) => {
  try {
    const { developerId } = req.params;
    const { limit } = req.query;
    const assets = ecosystemPlatform.getRecommendedAssets(
      developerId,
      limit ? parseInt(limit as string) : 5
    );
    return res.json({ assets, total: assets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// INTEGRATIONS
// ============================================================================

// Get integrations
router.get("/integrations", async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const integrations = ecosystemPlatform.getIntegrations({
      type: type as string,
      status: status as string,
    });
    return res.json({ integrations, total: integrations.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Enable integration
router.post("/integration/:id/enable", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const integration = ecosystemPlatform.enableIntegration(id);
    return res.json({ success: true, integration });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Disable integration
router.post("/integration/:id/disable", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const integration = ecosystemPlatform.disableIntegration(id);
    return res.json({ success: true, integration });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TRUST & SECURITY
// ============================================================================

// Calculate trust score
router.get("/asset/:id/trust", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const score = ecosystemPlatform.calculateTrustScore(id);
    return res.json({ assetId: id, trustScore: score });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Evaluate security
router.get("/asset/:id/security", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const evaluation = ecosystemPlatform.evaluateSecurity(id);
    return res.json({ assetId: id, ...evaluation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// REVENUE
// ============================================================================

// Get revenue
router.get("/revenue", async (req: Request, res: Response) => {
  try {
    const { assetId, developerId } = req.query;
    const revenue = ecosystemPlatform.getRevenue({
      assetId: assetId as string,
      developerId: developerId as string,
    });
    return res.json(revenue);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// METRICS & DASHBOARD
// ============================================================================

// Get ecosystem metrics
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = ecosystemPlatform.getEcosystemMetrics();
    return res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = ecosystemPlatform.getDashboard();
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
    AssetType: Object.values(AssetType),
    AssetStatus: Object.values(AssetStatus),
    TrustLevel: Object.values(TrustLevel),
    PricingModel: Object.values(PricingModel),
  });
});

export default router;
