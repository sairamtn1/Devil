/**
 * DEVIL Coding Agent - Workspace API Routes
 */

import { Router, Request, Response } from "express";
import { workspaceManager } from "../../server/coding/workspace";

const router = Router();

// Create workspace
router.post("/", async (req: Request, res: Response) => {
  try {
    const { missionId, projectType, name } = req.body;

    if (!projectType) {
      return res.status(400).json({ error: "projectType is required" });
    }

    const workspace = await workspaceManager.createWorkspace({
      missionId,
      projectType,
      name
    });

    return res.status(201).json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List workspaces
router.get("/", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query;
    const workspaces = await workspaceManager.listWorkspaces(missionId as string);
    return res.json({ workspaces, total: workspaces.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get workspace
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const workspace = await workspaceManager.getWorkspace(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update workspace
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const workspace = await workspaceManager.updateWorkspace(req.params.id, req.body);
    
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete workspace
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await workspaceManager.deleteWorkspace(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List workspace files
router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const { recursive } = req.query;
    const files = await workspaceManager.getWorkspaceFiles(req.params.id, recursive === "true");
    return res.json({ files, total: files.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get workspace stats
router.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const stats = await workspaceManager.getWorkspaceStats(req.params.id);
    
    if (!stats) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create snapshot
router.post("/:id/snapshots", async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    const snapshot = await workspaceManager.createSnapshot(req.params.id, description);
    
    if (!snapshot) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.status(201).json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List snapshots
router.get("/:id/snapshots", async (req: Request, res: Response) => {
  try {
    const snapshots = await workspaceManager.listSnapshots(req.params.id);
    return res.json({ snapshots, total: snapshots.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Restore snapshot
router.post("/:id/snapshots/:snapshotId/restore", async (req: Request, res: Response) => {
  try {
    const restored = await workspaceManager.restoreSnapshot(req.params.id, req.params.snapshotId);
    
    if (!restored) {
      return res.status(404).json({ error: "Workspace or snapshot not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete snapshot
router.delete("/:id/snapshots/:snapshotId", async (req: Request, res: Response) => {
  try {
    const deleted = await workspaceManager.deleteSnapshot(req.params.id, req.params.snapshotId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Snapshot not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
