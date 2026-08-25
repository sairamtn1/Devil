/**
 * DEVIL Coding Agent - File Operations API Routes
 */

import { Router, Request, Response } from "express";
import { fileOperationsEngine } from "../../server/coding/fileOperations";

const router = Router({ mergeParams: true });

// Read file
router.get("/:workspaceId/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];

    const content = await fileOperationsEngine.readFile(workspaceId, filePath);
    
    if (!content) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Write file
router.put("/:workspaceId/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const success = await fileOperationsEngine.writeFile(workspaceId, filePath, content);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to write file" });
    }

    return res.json({ success: true, path: filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Edit file (search & replace)
router.patch("/:workspaceId/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];
    const { search, replace, replaceAll, edits } = req.body;

    let result;

    if (edits) {
      // Line-based edits
      result = await fileOperationsEngine.editFile(workspaceId, filePath, edits);
    } else if (search) {
      // Pattern-based edit
      result = await fileOperationsEngine.editFilePattern(workspaceId, filePath, search, replace, { replaceAll });
    } else {
      return res.status(400).json({ error: "search or edits required" });
    }

    if (!result) {
      return res.status(404).json({ error: "File not found or edit failed" });
    }

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete file
router.delete("/:workspaceId/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];

    const success = await fileOperationsEngine.deleteFile(workspaceId, filePath);
    
    if (!success) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Move file
router.post("/:workspaceId/move", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: "source and destination required" });
    }

    const success = await fileOperationsEngine.moveFile(workspaceId, source, destination);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to move file" });
    }

    return res.json({ success: true, source, destination });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Copy file
router.post("/:workspaceId/copy", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: "source and destination required" });
    }

    const success = await fileOperationsEngine.copyFile(workspaceId, source, destination);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to copy file" });
    }

    return res.json({ success: true, source, destination });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create directory
router.post("/:workspaceId/dir", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: "path is required" });
    }

    const success = await fileOperationsEngine.createDirectory(workspaceId, path);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to create directory" });
    }

    return res.json({ success: true, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete directory
router.delete("/:workspaceId/dir/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const dirPath = req.params[0];
    const { recursive } = req.query;

    const success = await fileOperationsEngine.deleteDirectory(workspaceId, dirPath, recursive === "true");
    
    if (!success) {
      return res.status(404).json({ error: "Directory not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List directory
router.get("/:workspaceId/dir/*", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const dirPath = req.params[0] || "";

    const files = await fileOperationsEngine.listDirectory(workspaceId, dirPath);
    return res.json({ files, total: files.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get operation history
router.get("/:workspaceId/history", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { limit } = req.query;

    const history = fileOperationsEngine.getOperationHistory(workspaceId, parseInt(limit as string) || 100);
    return res.json({ history, total: history.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
