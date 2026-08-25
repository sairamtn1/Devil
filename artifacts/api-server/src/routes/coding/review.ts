/**
 * DEVIL Coding Agent - Review & Diff API Routes
 */

import { Router, Request, Response } from "express";
import { codeReviewEngine } from "../../server/coding/review";
import { diffEngine } from "../../server/coding/diff";

const router = Router();

// Review workspace
router.post("/:workspaceId/review", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const review = await codeReviewEngine.reviewWorkspace(workspaceId);
    return res.json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Review single file
router.post("/:workspaceId/review/:file", async (req: Request, res: Response) => {
  try {
    const { workspaceId, file } = req.params;

    const report = await codeReviewEngine.reviewFile(workspaceId, file);
    return res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Syntax check
router.post("/:workspaceId/syntax", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const check = await codeReviewEngine.syntaxCheck(workspaceId);
    return res.json(check);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Workspace diff
router.get("/:workspaceId/diff", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { snapshot } = req.query;

    const diff = await diffEngine.diffWorkspace(workspaceId, snapshot as string);
    return res.json(diff);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// File diff
router.get("/:workspaceId/diff/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const paths = req.params[0]?.split("/vs/");

    if (!paths || paths.length !== 2) {
      return res.status(400).json({ error: "Provide oldPath/newPath with /vs/ separator" });
    }

    const [oldPath, newPath] = paths;
    const diff = await diffEngine.diffFiles(workspaceId, oldPath, newPath);
    
    if (!diff) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.json(diff);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// New file diff
router.get("/:workspaceId/diff-new/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];

    const diff = await diffEngine.diffNewFile(workspaceId, filePath);
    
    if (!diff) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.json(diff);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Generate unified diff
router.get("/:workspaceId/unified/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const paths = req.params[0]?.split("/vs/");

    if (!paths || paths.length !== 2) {
      return res.status(400).json({ error: "Provide oldPath/newPath with /vs/ separator" });
    }

    const [oldPath, newPath] = paths;
    const diff = await diffEngine.generateUnifiedDiff(workspaceId, oldPath, newPath);
    return res.json({ diff });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
