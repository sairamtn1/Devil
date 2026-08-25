/**
 * DEVIL Video Studio - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  videoStudio, 
  VideoProvider, 
  VideoType,
  AspectRatio,
  type StoryboardScene
} from "../../server/video";

const router = Router();

// ============================================================================
// GENERATION
// ============================================================================

// Generate video
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      prompt, 
      provider, 
      brandId,
      negativePrompt,
      duration,
      aspectRatio,
      style,
      storyboardId 
    } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ error: "type and prompt are required" });
    }

    if (!Object.values(VideoType).includes(type)) {
      return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${Object.values(VideoType).join(", ")}` 
      });
    }

    if (provider && !Object.values(VideoProvider).includes(provider)) {
      return res.status(400).json({ 
        error: `Invalid provider. Must be one of: ${Object.values(VideoProvider).join(", ")}` 
      });
    }

    const asset = await videoStudio.generate(type, prompt, {
      provider,
      brandId,
      negativePrompt,
      duration,
      aspectRatio,
      style,
      storyboardId,
    });

    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Image to video
router.post("/image-to-video", async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt, provider, duration, aspectRatio } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({ error: "imageUrl and prompt are required" });
    }

    const asset = await videoStudio.generateFromImage(imageUrl, prompt, {
      provider,
      duration,
      aspectRatio,
    });

    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Commercial generator
router.post("/commercial", async (req: Request, res: Response) => {
  try {
    const { 
      commercialType, 
      productName, 
      description, 
      brandId,
      provider 
    } = req.body;

    if (!commercialType || !productName || !description) {
      return res.status(400).json({ 
        error: "commercialType, productName, and description are required" 
      });
    }

    const validTypes = ["technology", "startup", "product_reveal", "os_intro"];
    if (!validTypes.includes(commercialType)) {
      return res.status(400).json({ 
        error: `Invalid commercialType. Must be one of: ${validTypes.join(", ")}` 
      });
    }

    const asset = await videoStudio.generateCommercial(
      commercialType,
      productName,
      description,
      { brandId, provider }
    );

    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STORYBOARD
// ============================================================================

// Create storyboard
router.post("/storyboard", async (req: Request, res: Response) => {
  try {
    const { name, type, brandId, aspectRatio } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "name and type are required" });
    }

    const storyboard = videoStudio.createStoryboard(name, type, {
      brandId,
      aspectRatio,
    });

    return res.status(201).json(storyboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add scene to storyboard
router.post("/storyboard/:id/scene", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scene = req.body;

    if (!scene.description || !scene.duration) {
      return res.status(400).json({ error: "description and duration are required" });
    }

    const storyboard = videoStudio.addScene(id, scene);

    if (!storyboard) {
      return res.status(404).json({ error: "Storyboard not found" });
    }

    return res.json(storyboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Generate from storyboard
router.post("/storyboard/:id/generate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { provider } = req.body;

    const asset = await videoStudio.generateFromStoryboard(id, provider);
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get storyboard
router.get("/storyboard/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const storyboard = videoStudio.getStoryboard(id);

    if (!storyboard) {
      return res.status(404).json({ error: "Storyboard not found" });
    }

    return res.json(storyboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List storyboards
router.get("/storyboards", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;
    const storyboards = videoStudio.getAllStoryboards({
      brandId: brandId as string,
    });

    return res.json({ storyboards, total: storyboards.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// VIDEOS
// ============================================================================

// List videos
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const { brandId, type, status, provider, tags, limit } = req.query;

    const videos = videoStudio.getVideos({
      brandId: brandId as string,
      type: type as any,
      status: status as any,
      provider: provider as any,
      tags: tags ? (tags as string).split(",") : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return res.json({ videos, total: videos.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get single video
router.get("/video/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = videoStudio.getVideo(id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json(video);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create variation
router.post("/video/:id/variation", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { provider } = req.body;

    const asset = await videoStudio.createVariation(id, { provider });
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Edit video
router.post("/video/:id/edit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operation, params } = req.body;

    if (!operation) {
      return res.status(400).json({ error: "operation is required" });
    }

    const validOperations = ["trim", "extend", "upscale", "aspect_ratio"];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        error: `Invalid operation. Must be one of: ${validOperations.join(", ")}` 
      });
    }

    const asset = await videoStudio.edit(id, operation, params || {});
    return res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update tags
router.patch("/video/:id/tags", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "tags must be an array" });
    }

    const success = videoStudio.addTags(id, tags);

    if (!success) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete video
router.delete("/video/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = videoStudio.deleteVideo(id);

    if (!success) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PROVIDERS & STATS
// ============================================================================

// Get providers
router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = videoStudio.getProviders();
    return res.json({ providers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = videoStudio.getStats();
    return res.json(stats);
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
    VideoProvider: Object.values(VideoProvider),
    VideoType: Object.values(VideoType),
    VideoStatus: ["pending", "generating", "processing", "completed", "failed"],
    AspectRatio: Object.values(AspectRatio),
  });
});

export default router;
