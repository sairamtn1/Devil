/**
 * DEVIL Control Plane - Tools Router
 * 
 * API endpoints for tool registry operations:
 * - GET /tools - List all tools
 * - GET /tools/:id - Get single tool
 * - GET /tools/categories - List tool categories
 * - GET /tools/capabilities - List capability tags
 * - POST /tools/check - Check if tool can be executed
 * - POST /tools/initialize - Initialize tool registry
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  queryTools,
  getToolByName,
  getToolsByCategory,
  getToolsByCapability,
  getAllTools,
  initializeToolRegistry,
  checkToolExecution,
  CAPABILITY_TAGS,
  TOOL_CATEGORIES,
} from "../server/control-plane/toolRegistry";

const router: IRouter = Router();

// Query schema
const QueryToolsSchema = z.object({
  category: z.string().optional(),
  capability: z.string().optional(),
  permissionLevel: z.enum(["safe", "standard", "privileged", "critical"]).optional(),
  approvalRequired: z.coerce.boolean().optional(),
  enabled: z.coerce.boolean().optional(),
});

// Tool check schema
const ToolCheckSchema = z.object({
  toolName: z.string(),
  missionId: z.string().optional(),
});

// POST /tools/initialize - Initialize tool registry
router.post("/tools/initialize", async (req, res) => {
  try {
    await initializeToolRegistry();
    const tools = await getAllTools();

    res.json({
      message: "Tool registry initialized",
      toolCount: tools.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to initialize tool registry");
    res.status(500).json({ error: "Failed to initialize tool registry" });
  }
});

// GET /tools/categories - List tool categories
router.get("/tools/categories", async (req, res) => {
  res.json({
    categories: Object.entries(TOOL_CATEGORIES).map(([key, value]) => ({
      key,
      value,
    })),
  });
});

// GET /tools/capabilities - List capability tags
router.get("/tools/capabilities", async (req, res) => {
  res.json({
    capabilities: Object.entries(CAPABILITY_TAGS).map(([key, value]) => ({
      key,
      value,
    })),
  });
});

// GET /tools - List tools with filters
router.get("/tools", async (req, res) => {
  try {
    const query = QueryToolsSchema.parse(req.query);
    
    const tools = await queryTools({
      category: query.category,
      capability: query.capability as any,
      permissionLevel: query.permissionLevel,
      approvalRequired: query.approvalRequired,
      enabled: query.enabled,
    });

    res.json({
      tools: tools.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      })),
      total: tools.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to list tools");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to list tools" 
    });
  }
});

// GET /tools/by-category/:category - Get tools by category
router.get("/tools/by-category/:category", async (req, res) => {
  try {
    const tools = await getToolsByCategory(req.params.category);

    res.json({
      tools: tools.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      })),
      total: tools.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get tools by category");
    res.status(500).json({ error: "Failed to get tools by category" });
  }
});

// GET /tools/by-capability/:capability - Get tools by capability
router.get("/tools/by-capability/:capability", async (req, res) => {
  try {
    const tools = await getToolsByCapability(req.params.capability);

    res.json({
      tools: tools.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      })),
      total: tools.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get tools by capability");
    res.status(500).json({ error: "Failed to get tools by capability" });
  }
});

// GET /tools/:name - Get tool by name
router.get("/tools/:name", async (req, res) => {
  try {
    const version = req.query.version as string | undefined;
    const tool = await getToolByName(req.params.name, version);

    if (!tool) {
      res.status(404).json({ error: "Tool not found" });
      return;
    }

    res.json({
      ...tool,
      createdAt: tool.createdAt instanceof Date ? tool.createdAt.toISOString() : tool.createdAt,
      updatedAt: tool.updatedAt instanceof Date ? tool.updatedAt.toISOString() : tool.updatedAt,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to get tool");
    res.status(500).json({ error: "Failed to get tool" });
  }
});

// POST /tools/check - Check if tool can be executed
router.post("/tools/check", async (req, res) => {
  try {
    const input = ToolCheckSchema.parse(req.body);
    const result = await checkToolExecution(input.toolName, input.missionId);

    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Failed to check tool");
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to check tool" 
    });
  }
});

export default router;
