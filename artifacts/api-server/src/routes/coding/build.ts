/**
 * DEVIL Coding Agent - Build & Test API Routes
 */

import { Router, Request, Response } from "express";
import { buildRunner, testRunner, lintRunner } from "../../server/coding/runners";

const router = Router();

// Run build
router.post("/:workspaceId/build", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { command, cwd } = req.body;

    const result = await buildRunner.runBuild(workspaceId, command, cwd);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Install dependencies
router.post("/:workspaceId/install", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { manager } = req.body;

    const result = await buildRunner.installDependencies(workspaceId, manager);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Run tests
router.post("/:workspaceId/test", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { command, testPath, coverage, watch } = req.body;

    const result = await testRunner.runTests(workspaceId, {
      command,
      testPath,
      coverage,
      watch
    });
    
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Run linter
router.post("/:workspaceId/lint", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { linter, fix, files } = req.body;

    const result = await lintRunner.runLint(workspaceId, { linter, fix, files });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Check TypeScript
router.post("/:workspaceId/types", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const result = await lintRunner.checkTypeScript(workspaceId);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
