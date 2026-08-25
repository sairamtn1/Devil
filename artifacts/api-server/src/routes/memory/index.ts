/**
 * DEVIL Memory System - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  memoryManager, 
  MemoryType, 
  MemoryState,
  MemoryEntry 
} from "../../server/memory";

const router = Router();

// Initialize memory manager
memoryManager.initialize();

// ============================================================================
// MEMORY CRUD
// ============================================================================

// Create memory
router.post("/", async (req: Request, res: Response) => {
  try {
    const { type, entityId, data, importance, source, confidence, tags } = req.body;

    if (!type || !entityId || !data) {
      return res.status(400).json({ error: "type, entityId, and data are required" });
    }

    if (!Object.values(MemoryType).includes(type)) {
      return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${Object.values(MemoryType).join(", ")}` 
      });
    }

    const entry = await memoryManager.create(type, entityId, data, {
      importance,
      source,
      confidence,
      tags,
    });

    return res.status(201).json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List/Search memories
router.get("/", async (req: Request, res: Response) => {
  try {
    const query = {
      query: req.query.query as string,
      type: req.query.type as any,
      entityId: req.query.entityId as string,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      state: req.query.state as any,
      minImportance: req.query.minImportance ? parseInt(req.query.minImportance as string) : undefined,
      minConfidence: req.query.minConfidence ? parseInt(req.query.minConfidence as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await memoryManager.search(query);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get single memory
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await memoryManager.get(id);

    if (!entry) {
      return res.status(404).json({ error: "Memory not found" });
    }

    return res.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update memory
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const entry = await memoryManager.update(id, updates);

    if (!entry) {
      return res.status(404).json({ error: "Memory not found" });
    }

    return res.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete memory
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await memoryManager.delete(id);

    if (!success) {
      return res.status(404).json({ error: "Memory not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Archive memory
router.post("/:id/archive", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await memoryManager.archive(id);

    if (!success) {
      return res.status(404).json({ error: "Memory not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TYPE-SPECIFIC ROUTES
// ============================================================================

// User Memory
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const memory = await memoryManager.getUserMemory(userId);

    if (!memory) {
      return res.status(404).json({ error: "User memory not found" });
    }

    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/user/:userId/preferences", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const memory = await memoryManager.saveUserPreferences(userId, preferences);
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Project Memory
router.get("/project/:projectId", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const memory = await memoryManager.getProjectMemory(projectId);

    if (!memory) {
      return res.status(404).json({ error: "Project memory not found" });
    }

    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/project/:projectId", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const data = req.body;

    const memory = await memoryManager.saveProjectMemory(projectId, data);
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Mission Memory
router.get("/mission/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;
    const memory = await memoryManager.getMissionMemory(missionId);

    if (!memory) {
      return res.status(404).json({ error: "Mission memory not found" });
    }

    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/mission/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;
    const data = req.body;

    const memory = await memoryManager.saveMissionMemory(missionId, data);
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Repository Memory
router.get("/repository/:repositoryId", async (req: Request, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const memory = await memoryManager.getRepositoryMemory(repositoryId);

    if (!memory) {
      return res.status(404).json({ error: "Repository memory not found" });
    }

    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/repository/:repositoryId", async (req: Request, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const data = req.body;

    const memory = await memoryManager.saveRepositoryMemory(repositoryId, data);
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Execution Memory
router.get("/execution/:executionId", async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const memory = await memoryManager.getExecutionMemory(executionId);

    if (!memory) {
      return res.status(404).json({ error: "Execution memory not found" });
    }

    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/execution/:executionId", async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const data = req.body;

    const memory = await memoryManager.saveExecutionMemory(executionId, data);
    return res.json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Knowledge Memory
router.post("/knowledge", async (req: Request, res: Response) => {
  try {
    const { category, title, content, examples, relatedKnowledge, source, importance } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({ error: "category, title, and content are required" });
    }

    const memory = await memoryManager.addKnowledge(category, title, content, {
      examples,
      relatedKnowledge,
      source,
      importance,
    });

    return res.status(201).json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/knowledge/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const memories = await memoryManager.getKnowledgeByCategory(category);
    return res.json({ entries: memories, total: memories.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CONTEXT
// ============================================================================

router.get("/context/mission/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;
    const { projectId } = req.query;

    const context = await memoryManager.getContextForMission(missionId, projectId as string);
    return res.json(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// STATS & EVENTS
// ============================================================================

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = memoryManager.getStats();
    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/events", async (req: Request, res: Response) => {
  try {
    const events = memoryManager.getEvents();
    return res.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SEARCH
// ============================================================================

router.post("/search", async (req: Request, res: Response) => {
  try {
    const query = req.body;
    const result = await memoryManager.search(query);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
