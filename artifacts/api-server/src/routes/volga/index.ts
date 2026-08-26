/**
 * VOLGA OS v1.0 - API Routes
 */

import { Router, Request, Response } from "express";
import { volgaOS } from "../../server/volga";

const router = Router();

// ============================================================================
// VOLGA OS STATUS
// ============================================================================

router.get("/status", async (req: Request, res: Response) => {
  try {
    const status = volgaOS.getStatus();
    return res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// HEALTH
// ============================================================================

router.get("/health", async (req: Request, res: Response) => {
  try {
    const health = volgaOS.getHealthReport();
    return res.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// LAUNCH READINESS
// ============================================================================

router.get("/readiness", async (req: Request, res: Response) => {
  try {
    const readiness = volgaOS.getLaunchReadiness();
    return res.json(readiness);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/launch-check", async (req: Request, res: Response) => {
  try {
    const result = volgaOS.launch();
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// AGENTS
// ============================================================================

router.get("/agents", async (req: Request, res: Response) => {
  try {
    const { capability } = req.query;
    const agents = capability
      ? volgaOS.searchAgents(capability as string)
      : volgaOS.getAgents();
    return res.json({ agents, total: agents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/agents/:id", async (req: Request, res: Response) => {
  try {
    const agent = volgaOS.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    return res.json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// MISSIONS
// ============================================================================

router.post("/mission", async (req: Request, res: Response) => {
  try {
    const { title, description, agents } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }
    const mission = volgaOS.createMission(title, description, agents || []);
    return res.status(201).json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/missions", async (req: Request, res: Response) => {
  try {
    const missions = volgaOS.getMissions();
    return res.json({ missions, total: missions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/mission/:id", async (req: Request, res: Response) => {
  try {
    const mission = volgaOS.getMission(req.params.id);
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    return res.json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = volgaOS.getDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
