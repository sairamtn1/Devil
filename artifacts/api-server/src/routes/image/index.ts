/**
 * DEVIL Image Studio - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  imageStudio, 
  ImageProvider, 
  ImageType,
  type Brand,
  type BrandColor,
  type BrandTypography
} from "../../server/image";

const router = Router();

// ============================================================================
// GENERATION
// ============================================================================

// Generate image
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      prompt, 
      provider, 
      brandId,
      negativePrompt,
      width,
      height,
      style,
      userId 
    } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ error: "type and prompt are required" });
    }

    if (!Object.values(ImageType).includes(type)) {
      return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${Object.values(ImageType).join(", ")}` 
      });
    }

    if (provider && !Object.values(ImageProvider).includes(provider)) {
      return res.status(400).json({ 
        error: `Invalid provider. Must be one of: ${Object.values(ImageProvider).join(", ")}` 
      });
    }

    const asset = await imageStudio.generate(type, prompt, {
      provider,
      brandId,
      negativePrompt,
      width,
      height,
      style,
      userId,
    });

    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Edit image
router.post("/edit", async (req: Request, res: Response) => {
  try {
    const { assetId, prompt, provider } = req.body;

    if (!assetId || !prompt) {
      return res.status(400).json({ error: "assetId and prompt are required" });
    }

    const asset = await imageStudio.edit(assetId, prompt, { provider });
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create variation
router.post("/variation", async (req: Request, res: Response) => {
  try {
    const { assetId, provider } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: "assetId is required" });
    }

    const asset = await imageStudio.createVariation(assetId, { provider });
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ASSETS
// ============================================================================

// List assets
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const { brandId, type, status, tags, limit } = req.query;

    const assets = imageStudio.getAssets({
      brandId: brandId as string,
      type: type as any,
      status: status as any,
      tags: tags ? (tags as string).split(",") : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return res.json({ assets, total: assets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get single asset
router.get("/asset/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = imageStudio.getAsset(id);

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update asset tags
router.patch("/asset/:id/tags", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "tags must be an array" });
    }

    const success = imageStudio.addTags(id, tags);

    if (!success) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete asset
router.delete("/asset/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = imageStudio.deleteAsset(id);

    if (!success) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// BRANDS
// ============================================================================

// Create brand
router.post("/brand", async (req: Request, res: Response) => {
  try {
    const { name, userId, colors, typography, visualStyle } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const brand = imageStudio.createBrand({
      name,
      userId,
      colors,
      typography,
      visualStyle,
    });

    return res.status(201).json(brand);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List brands
router.get("/brands", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const brands = imageStudio.getBrands(userId as string);
    return res.json({ brands, total: brands.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get brand
router.get("/brand/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = imageStudio.getBrand(id);

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    return res.json(brand);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update brand
router.patch("/brand/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { colors, typography, visualStyle } = req.body;

    const brand = imageStudio.updateBrand(id, { colors, typography, visualStyle });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    return res.json(brand);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add brand asset
router.post("/brand/:id/asset", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assetId, type, prompt, imageUrl } = req.body;

    if (!assetId || !type || !imageUrl) {
      return res.status(400).json({ error: "assetId, type, and imageUrl are required" });
    }

    const success = imageStudio.addBrandAsset(id, assetId, type, prompt || "", imageUrl);

    if (!success) {
      return res.status(404).json({ error: "Brand not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Approve brand asset
router.post("/brand/:id/approve/:assetId", async (req: Request, res: Response) => {
  try {
    const { id, assetId } = req.params;
    const success = imageStudio.approveBrandAsset(id, assetId);

    if (!success) {
      return res.status(404).json({ error: "Brand or asset not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PROMPT BUILDER
// ============================================================================

// Build prompt
router.post("/prompt/build", async (req: Request, res: Response) => {
  try {
    const { type, description, brandId, style, colors, mood } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: "type and description are required" });
    }

    const prompt = imageStudio.buildPrompt(type, description, {
      brandId,
      style,
      colors,
      mood,
    });

    return res.json({ prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STATS
// ============================================================================

// Get stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = imageStudio.getStats();
    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ENUMS
// ============================================================================

// Get enums
router.get("/enums", async (req: Request, res: Response) => {
  return res.json({
    ImageProvider: Object.values(ImageProvider),
    ImageType: Object.values(ImageType),
    ImageStatus: ["pending", "generating", "completed", "failed"],
  });
});

export default router;
