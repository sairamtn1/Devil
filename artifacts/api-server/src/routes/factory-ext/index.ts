/**
 * VOLGA OS Agent Factory - API Routes
 */

import { Router, Request, Response } from "express";
import { agentFactory } from "../../server/factory-ext";

const router = Router();

// ============================================================================
// AGENT FACTORY
// ============================================================================

router.get("/factory/templates", async (req: Request, res: Response) => {
  try {
    const templates = agentFactory.getAgentTemplates();
    return res.json({ templates, total: templates.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/agent", async (req: Request, res: Response) => {
  try {
    const { templateId, name, config } = req.body;
    if (!templateId || !name) {
      return res.status(400).json({ error: "templateId and name are required" });
    }
    const agent = agentFactory.createAgent(templateId, name, config);
    if (!agent) return res.status(404).json({ error: "Template not found" });
    return res.status(201).json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/factory/agents", async (req: Request, res: Response) => {
  try {
    const agents = agentFactory.getCustomAgents();
    return res.json({ agents, total: agents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PLUGIN MARKETPLACE
// ============================================================================

router.get("/factory/plugins", async (req: Request, res: Response) => {
  try {
    const plugins = agentFactory.getPlugins();
    return res.json({ plugins, total: plugins.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/plugin/:id/install", async (req: Request, res: Response) => {
  try {
    const success = agentFactory.installPlugin(req.params.id);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/plugin/:id/uninstall", async (req: Request, res: Response) => {
  try {
    const success = agentFactory.uninstallPlugin(req.params.id);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// WORKFLOW MARKETPLACE
// ============================================================================

router.get("/factory/workflows", async (req: Request, res: Response) => {
  try {
    const workflows = agentFactory.getWorkflows();
    return res.json({ workflows, total: workflows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// VOICE LAYER
// ============================================================================

router.post("/factory/voice", async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "transcript is required" });
    }
    const command = agentFactory.processVoiceCommand(transcript);
    return res.status(201).json(command);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/factory/voice", async (req: Request, res: Response) => {
  try {
    const commands = agentFactory.getVoiceCommands();
    return res.json({ commands, total: commands.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// REAL-TIME MONITORING
// ============================================================================

router.get("/factory/monitoring", async (req: Request, res: Response) => {
  try {
    const connections = agentFactory.getMonitorConnections();
    return res.json({ connections, total: connections.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/factory/monitoring/events", async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const events = agentFactory.getMonitoringEvents(limit ? parseInt(limit as string) : 50);
    return res.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/monitoring/event", async (req: Request, res: Response) => {
  try {
    const { connectionId, type, source, message, severity } = req.body;
    const event = agentFactory.addMonitoringEvent(connectionId, type, source, message, severity);
    return res.status(201).json(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MULTI-DEVICE SYNC
// ============================================================================

router.get("/factory/devices", async (req: Request, res: Response) => {
  try {
    const devices = agentFactory.getDevices();
    return res.json({ devices, total: devices.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/device", async (req: Request, res: Response) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) {
      return res.status(400).json({ error: "type and name are required" });
    }
    const device = agentFactory.registerDevice(type, name);
    return res.status(201).json(device);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/factory/device/:id/sync", async (req: Request, res: Response) => {
  try {
    const result = agentFactory.syncDevice(req.params.id);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

router.get("/factory/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = agentFactory.getDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
