/**
 * DEVIL Enterprise Command Center - API Routes
 */

import { Router, Request, Response } from "express";
import { enterpriseCenter, type Permission } from "../../server/enterprise";

const router = Router();

// ============================================================================
// ORGANIZATIONS
// ============================================================================

router.post("/organization", async (req: Request, res: Response) => {
  try {
    const { name, slug, plan } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }
    const org = enterpriseCenter.createOrganization(name, slug, plan || "starter");
    return res.status(201).json(org);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/organizations", async (req: Request, res: Response) => {
  try {
    const orgs = enterpriseCenter.getOrganizations();
    return res.json({ organizations: orgs, total: orgs.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/organization/:id", async (req: Request, res: Response) => {
  try {
    const org = enterpriseCenter.getOrganization(req.params.id);
    if (!org) return res.status(404).json({ error: "Organization not found" });
    return res.json(org);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// WORKSPACES
// ============================================================================

router.post("/workspace", async (req: Request, res: Response) => {
  try {
    const { organizationId, name, slug, isolated } = req.body;
    if (!organizationId || !name || !slug) {
      return res.status(400).json({ error: "organizationId, name, and slug are required" });
    }
    const ws = enterpriseCenter.createWorkspace(organizationId, name, slug, isolated !== false);
    return res.status(201).json(ws);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/workspaces", async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const workspaces = enterpriseCenter.getWorkspaces(organizationId as string);
    return res.json({ workspaces, total: workspaces.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/workspace/:id", async (req: Request, res: Response) => {
  try {
    const ws = enterpriseCenter.getWorkspace(req.params.id);
    if (!ws) return res.status(404).json({ error: "Workspace not found" });
    return res.json(ws);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TEAMS
// ============================================================================

router.post("/team", async (req: Request, res: Response) => {
  try {
    const { organizationId, name, type, workspaceId } = req.body;
    if (!organizationId || !name) {
      return res.status(400).json({ error: "organizationId and name are required" });
    }
    const team = enterpriseCenter.createTeam(organizationId, name, type, workspaceId);
    return res.status(201).json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/teams", async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const teams = enterpriseCenter.getTeams(organizationId as string);
    return res.json({ teams, total: teams.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/team/:id/member", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    enterpriseCenter.addTeamMember(req.params.id, userId);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// USERS
// ============================================================================

router.post("/user", async (req: Request, res: Response) => {
  try {
    const { organizationId, email, name, role } = req.body;
    if (!organizationId || !email || !name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = enterpriseCenter.createUser(organizationId, email, name, role);
    return res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/users", async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const users = enterpriseCenter.getUsers(organizationId as string);
    return res.json({ users, total: users.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const user = enterpriseCenter.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// AUDIT
// ============================================================================

router.get("/audit", async (req: Request, res: Response) => {
  try {
    const { organizationId, limit, resource } = req.query;
    const logs = enterpriseCenter.getAuditLog(
      organizationId as string || "devil-enterprise",
      { limit: limit ? parseInt(limit as string) : 100, resource: resource as string }
    );
    return res.json({ logs, total: logs.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/audit", async (req: Request, res: Response) => {
  try {
    const { organizationId, userId, action, resource, resourceId, details } = req.body;
    const entry = enterpriseCenter.logAuditEntry(organizationId, userId, action, resource, resourceId, details);
    return res.status(201).json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// POLICIES
// ============================================================================

router.post("/policy", async (req: Request, res: Response) => {
  try {
    const { organizationId, name, description, rules } = req.body;
    if (!organizationId || !name || !rules) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const policy = enterpriseCenter.createPolicy(organizationId, name, description || "", rules);
    return res.status(201).json(policy);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/policies", async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const policies = enterpriseCenter.getPolicies(organizationId as string);
    return res.json({ policies, total: policies.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// RESOURCES
// ============================================================================

router.post("/resources", async (req: Request, res: Response) => {
  try {
    const { organizationId, period, usage } = req.body;
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    const resources = enterpriseCenter.trackResourceUsage(organizationId, period || "current", usage);
    return res.json(resources);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/resources", async (req: Request, res: Response) => {
  try {
    const { organizationId, period } = req.query;
    const resources = enterpriseCenter.getResourceUsage(organizationId as string, period as string || "current");
    return res.json(resources || { message: "No usage data" });
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
    const { organizationId } = req.query;
    const dashboard = enterpriseCenter.getDashboard(organizationId as string || "devil-enterprise");
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
