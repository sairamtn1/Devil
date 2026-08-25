/**
 * DEVIL GitHub Agent - API Routes
 */

import { Router, Request, Response } from "express";
import { defaultGitHubAgent } from "../../server/github";

const router = Router();

// Initialize GitHub agent
defaultGitHubAgent.initialize();

// ============================================================================
// REPOSITORY OPERATIONS
// ============================================================================

// Clone repository
router.post("/clone", async (req: Request, res: Response) => {
  try {
    const { url, branch } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const repository = await defaultGitHubAgent.cloneRepository(url, branch);
    return res.status(201).json(repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Analyze repository
router.post("/analyze/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const analysis = await defaultGitHubAgent.analyzeRepository(id);
    return res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List repositories
router.get("/repositories", async (req: Request, res: Response) => {
  try {
    const repositories = defaultGitHubAgent.getRepositories();
    return res.json({ repositories, total: repositories.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get repository
router.get("/repositories/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repository = defaultGitHubAgent.getRepository(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    return res.json(repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Fetch repository
router.post("/repositories/:id/fetch", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await defaultGitHubAgent.fetch(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// BRANCH OPERATIONS
// ============================================================================

// List branches
router.get("/repositories/:id/branches", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branches = await defaultGitHubAgent.listBranches(id);
    return res.json({ branches, total: branches.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create branch
router.post("/repositories/:id/branches", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, baseBranch } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const branch = await defaultGitHubAgent.createBranch(id, name, baseBranch);
    return res.status(201).json(branch);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Checkout branch
router.post("/repositories/:id/checkout", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { branch } = req.body;

    if (!branch) {
      return res.status(400).json({ error: "branch is required" });
    }

    await defaultGitHubAgent.checkoutBranch(id, branch);
    return res.json({ success: true, branch });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COMMIT OPERATIONS
// ============================================================================

// Generate commit message
router.post("/commit/message", async (req: Request, res: Response) => {
  try {
    const { files, diff } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "files array is required" });
    }

    const message = await defaultGitHubAgent.generateCommitMessage({ files, diff });
    
    // Format as conventional commit
    const formattedMessage = message.scope
      ? `${message.type}(${message.scope}): ${message.message}`
      : `${message.type}: ${message.message}`;

    return res.json({ ...message, formattedMessage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Create commit
router.post("/repositories/:id/commit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, files, branch } = req.body;

    if (!message || !files) {
      return res.status(400).json({ error: "message and files are required" });
    }

    const result = await defaultGitHubAgent.createCommit(id, { message, files, branch });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get commit history
router.get("/repositories/:id/commits", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const commits = await defaultGitHubAgent.getCommitHistory(id, limit);
    return res.json({ commits, total: commits.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PULL REQUEST OPERATIONS
// ============================================================================

// Create pull request
router.post("/repositories/:id/pr", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, sourceBranch, targetBranch, draft } = req.body;

    if (!title || !sourceBranch || !targetBranch) {
      return res.status(400).json({ 
        error: "title, sourceBranch, and targetBranch are required" 
      });
    }

    const result = await defaultGitHubAgent.createPullRequest(id, {
      title,
      description: description ?? "",
      sourceBranch,
      targetBranch,
      changedFiles: [],
      additions: 0,
      deletions: 0,
      draft: draft ?? false
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// AUDIT TRAIL
// ============================================================================

// Get audit log
router.get("/audit", async (req: Request, res: Response) => {
  try {
    const { repositoryId } = req.query;
    const log = defaultGitHubAgent.getAuditLog(repositoryId as string);
    return res.json({ entries: log, total: log.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get repository audit log
router.get("/repositories/:id/audit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = defaultGitHubAgent.getAuditLog(id);
    return res.json({ entries: log, total: log.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// HISTORY
// ============================================================================

// Get full history
router.get("/history", async (req: Request, res: Response) => {
  try {
    const repositories = defaultGitHubAgent.getRepositories();
    const allAudit = defaultGitHubAgent.getAuditLog();

    const history = {
      repositories,
      actions: allAudit.slice(-100),
      stats: {
        totalRepositories: repositories.length,
        totalActions: allAudit.length,
        byAction: {} as Record<string, number>
      }
    };

    // Calculate action stats
    for (const entry of allAudit) {
      history.stats.byAction[entry.action] = (history.stats.byAction[entry.action] ?? 0) + 1;
    }

    return res.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
