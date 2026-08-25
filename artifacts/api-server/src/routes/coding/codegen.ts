/**
 * DEVIL Coding Agent - Code Generator API Routes
 */

import { Router, Request, Response } from "express";
import { codeGenerator } from "../../server/coding/codeGenerator";
import { runMissionLoop } from "../../server/coding/missionLoop";

const router = Router();

// List available templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const templates = codeGenerator.getTemplates();
    return res.json({ templates, total: templates.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get template by type
router.get("/templates/:type", async (req: Request, res: Response) => {
  try {
    const template = codeGenerator.getTemplate(req.params.type as any);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Generate project
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectName, projectType, options } = req.body;

    if (!workspaceId || !projectName || !projectType) {
      return res.status(400).json({ 
        error: "workspaceId, projectName, and projectType are required" 
      });
    }

    const result = await codeGenerator.generate({
      workspaceId,
      projectName,
      projectType,
      options
    });

    return res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Run full mission loop
router.post("/mission", async (req: Request, res: Response) => {
  try {
    const { missionId, goal, projectType, options } = req.body;

    if (!missionId || !goal || !projectType) {
      return res.status(400).json({ 
        error: "missionId, goal, and projectType are required" 
      });
    }

    const result = await runMissionLoop({
      missionId,
      goal,
      projectType,
      options
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
