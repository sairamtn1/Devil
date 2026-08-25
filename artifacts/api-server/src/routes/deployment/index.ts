/**
 * DEVIL Deployment Agent - API Routes
 */

import { Router, Request, Response } from "express";
import { deploymentManager, DeploymentState, HealthState, DeploymentTarget } from "../../server/deployment";

const router = Router();

// Initialize deployment manager
deploymentManager.initialize();

// ============================================================================
// DEPLOYMENT CRUD
// ============================================================================

// Create deployment
router.post("/", async (req: Request, res: Response) => {
  try {
    const { workspaceId, name, provider, projectType, environment } = req.body;

    if (!workspaceId || !name || !provider || !projectType) {
      return res.status(400).json({
        error: "workspaceId, name, provider, and projectType are required"
      });
    }

    const deployment = await deploymentManager.createDeployment(
      workspaceId,
      name,
      provider,
      projectType,
      environment || "development"
    );

    return res.status(201).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List deployments
router.get("/", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;
    const deployments = await deploymentManager.listDeployments(workspaceId as string);
    return res.json({ deployments, total: deployments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get deployment
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deployment = await deploymentManager.getDeployment(id);

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    return res.json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Delete deployment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deploymentManager.deleteDeployment(id);

    if (!deleted) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DEPLOYMENT ACTIONS
// ============================================================================

// Create artifact
router.post("/:id/artifact", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: "workspacePath is required" });
    }

    const artifact = await deploymentManager.createArtifact(id, workspacePath);

    if (!artifact) {
      return res.status(400).json({ error: "Failed to create artifact" });
    }

    return res.status(201).json(artifact);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Validate deployment
router.post("/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: "workspacePath is required" });
    }

    const result = await deploymentManager.validateDeployment(id, workspacePath);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Start deployment
router.post("/:id/start", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { environmentVariables, region, instanceType } = req.body;

    const success = await deploymentManager.deploy(id, {
      environment: "development",
      environmentVariables,
      region,
      instanceType,
    });

    const deployment = await deploymentManager.getDeployment(id);

    return res.json({
      success,
      deployment,
      requiresApproval: deployment?.state === DeploymentState.AWAITING_APPROVAL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Approve deployment
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deploymentManager.approveDeployment(id);

    if (!success) {
      return res.status(400).json({ error: "Cannot approve deployment" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Reject deployment
router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deploymentManager.rejectDeployment(id);

    if (!success) {
      return res.status(400).json({ error: "Cannot reject deployment" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Cancel deployment
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deploymentManager.cancelDeployment(id);

    if (!success) {
      return res.status(400).json({ error: "Cannot cancel deployment" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Rollback deployment
router.post("/:id/rollback", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deploymentManager.rollback(id);

    if (!success) {
      return res.status(400).json({ error: "Cannot rollback deployment" });
    }

    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// HEALTH CHECKS
// ============================================================================

// Health check
router.get("/:id/health", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const health = await deploymentManager.healthCheck(id);

    if (!health) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    return res.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Health history
router.get("/:id/health/history", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = deploymentManager.getHealthHistory(id);
    return res.json({ checks: history, total: history.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EVENTS & HISTORY
// ============================================================================

// Get deployment events
router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = deploymentManager.getEvents(id);
    return res.json({ events, total: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get rollback points
router.get("/:id/rollback-points", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const points = deploymentManager.getRollbackPoints(id);
    return res.json({ points, total: points.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PROVIDER INFO
// ============================================================================

// Get available providers
router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = [
      {
        name: DeploymentTarget.LOCAL,
        requiresApproval: false,
        description: "Local development server",
      },
      {
        name: DeploymentTarget.DOCKER,
        requiresApproval: false,
        description: "Docker container deployment",
      },
      {
        name: DeploymentTarget.VERCEL,
        requiresApproval: true,
        description: "Vercel cloud deployment",
      },
      {
        name: DeploymentTarget.RAILWAY,
        requiresApproval: true,
        description: "Railway cloud deployment",
      },
    ];

    return res.json({ providers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
