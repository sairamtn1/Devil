/**
 * DEVIL Digital Workforce Platform - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  workforcePlatform,
  DepartmentType,
  WorkerLevel,
  WorkerStatus,
  SkillLevel,
  type Worker,
  type Department,
  type Team,
} from "../../server/workforce";

const router = Router();

// ============================================================================
// WORKERS
// ============================================================================

// Create worker
router.post("/worker", async (req: Request, res: Response) => {
  try {
    const { name, role, department, team, level, skills, salary } = req.body;

    if (!name || !role || !department) {
      return res.status(400).json({ error: "name, role, and department are required" });
    }

    if (!Object.values(DepartmentType).includes(department)) {
      return res.status(400).json({ 
        error: `Invalid department. Must be one of: ${Object.values(DepartmentType).join(", ")}` 
      });
    }

    const worker = workforcePlatform.createWorker(name, role, department, {
      team,
      level: level || WorkerLevel.JUNIOR,
      skills,
      salary,
    });

    return res.status(201).json(worker);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get worker
router.get("/worker/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const worker = workforcePlatform.getWorker(id);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.json(worker);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List workers
router.get("/workers", async (req: Request, res: Response) => {
  try {
    const { department, level, status } = req.query;

    const workers = workforcePlatform.getWorkers({
      department: department as any,
      level: level as any,
      status: status as any,
    });

    return res.json({ workers, total: workers.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update worker metrics
router.post("/worker/:id/metrics", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { taskCompleted, quality } = req.body;

    if (taskCompleted === undefined || quality === undefined) {
      return res.status(400).json({ error: "taskCompleted and quality are required" });
    }

    workforcePlatform.updateWorkerMetrics(id, taskCompleted, quality);
    const worker = workforcePlatform.getWorker(id);

    return res.json({ success: true, worker });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Record mistake
router.post("/worker/:id/mistake", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mistake, recoveryMethod } = req.body;

    if (!mistake || !recoveryMethod) {
      return res.status(400).json({ error: "mistake and recoveryMethod are required" });
    }

    workforcePlatform.recordWorkerMistake(id, mistake, recoveryMethod);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get promotion path
router.get("/worker/:id/promotion-path", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const path = workforcePlatform.getWorkerPromotionPath(id);
    return res.json({ path });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DEPARTMENTS
// ============================================================================

// Create department
router.post("/department", async (req: Request, res: Response) => {
  try {
    const { type, name, headId } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: "type and name are required" });
    }

    const department = workforcePlatform.createDepartment(type, name, headId);
    return res.status(201).json(department);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get department
router.get("/department/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const department = workforcePlatform.getDepartment(type);

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    return res.json(department);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List departments
router.get("/departments", async (req: Request, res: Response) => {
  try {
    const departments = workforcePlatform.getAllDepartments();
    return res.json({ departments, total: departments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Set department budget
router.patch("/department/:type/budget", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { budget } = req.body;

    if (budget === undefined) {
      return res.status(400).json({ error: "budget is required" });
    }

    workforcePlatform.setDepartmentBudget(type, budget);
    const department = workforcePlatform.getDepartment(type);

    return res.json({ success: true, department });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get department analytics
router.get("/department/:type/analytics", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const analytics = workforcePlatform.getDepartmentAnalytics(type);

    if (!analytics) {
      return res.status(404).json({ error: "Department not found" });
    }

    return res.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// TEAMS
// ============================================================================

// Create team
router.post("/team", async (req: Request, res: Response) => {
  try {
    const { name, department, leadId } = req.body;

    if (!name || !department) {
      return res.status(400).json({ error: "name and department are required" });
    }

    const team = workforcePlatform.createTeam(name, department, leadId);
    return res.status(201).json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get team
router.get("/team/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team = workforcePlatform.getTeam(id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Add worker to team
router.post("/team/:id/worker", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ error: "workerId is required" });
    }

    workforcePlatform.addWorkerToTeam(workerId, id);
    const team = workforcePlatform.getTeam(id);

    return res.json({ success: true, team });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// RECRUITMENT
// ============================================================================

// Create recruitment request
router.post("/recruitment", async (req: Request, res: Response) => {
  try {
    const { department, role, skills, team, level, urgency, reason } = req.body;

    if (!department || !role || !skills) {
      return res.status(400).json({ error: "department, role, and skills are required" });
    }

    const request = workforcePlatform.createRecruitmentRequest(department, role, skills, {
      team,
      level: level || WorkerLevel.MIDDLE,
      urgency: urgency || "normal",
      reason,
    });

    return res.status(201).json(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// List recruitment requests
router.get("/recruitments", async (req: Request, res: Response) => {
  try {
    const { department, status } = req.query;

    const requests = workforcePlatform.getRecruitmentRequests({
      department: department as any,
      status: status as any,
    });

    return res.json({ requests, total: requests.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// PERFORMANCE REVIEWS
// ============================================================================

// Conduct performance review
router.post("/review", async (req: Request, res: Response) => {
  try {
    const { workerId, reviewerId, scores, feedback } = req.body;

    if (!workerId || !reviewerId || !scores || !feedback) {
      return res.status(400).json({ 
        error: "workerId, reviewerId, scores, and feedback are required" 
      });
    }

    const review = workforcePlatform.conductPerformanceReview(workerId, reviewerId, scores, feedback);
    return res.status(201).json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get performance reviews
router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const { workerId } = req.query;
    const reviews = workforcePlatform.getPerformanceReviews(workerId as string);
    return res.json({ reviews, total: reviews.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COMMUNICATION
// ============================================================================

// Send message
router.post("/message", async (req: Request, res: Response) => {
  try {
    const { from, to, type, subject, content, priority } = req.body;

    if (!from || !to || !type || !subject || !content) {
      return res.status(400).json({ 
        error: "from, to, type, subject, and content are required" 
      });
    }

    const message = workforcePlatform.sendMessage(from, to, type, subject, content, priority);
    return res.status(201).json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Broadcast to department
router.post("/broadcast/:department", async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: "subject and content are required" });
    }

    workforcePlatform.broadcastToDepartment(department, subject, content);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get messages
router.get("/messages/:workerId", async (req: Request, res: Response) => {
  try {
    const { workerId } = req.params;
    const messages = workforcePlatform.getMessages(workerId);
    return res.json({ messages, total: messages.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get organization metrics
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = workforcePlatform.getOrganizationMetrics();
    return res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get top performers
router.get("/top-performers", async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const performers = workforcePlatform.getTopPerformers(parseInt(limit as string) || 5);
    return res.json({ performers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get workers needing training
router.get("/needs-training", async (req: Request, res: Response) => {
  try {
    const workers = workforcePlatform.getWorkersNeedingTraining();
    return res.json({ workers, total: workers.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get workload distribution
router.get("/workload", async (req: Request, res: Response) => {
  try {
    const distribution = workforcePlatform.getWorkloadDistribution();
    return res.json({ distribution });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get strategic recommendations
router.get("/recommendations", async (req: Request, res: Response) => {
  try {
    const recommendations = workforcePlatform.getStrategicRecommendations();
    return res.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get skill gap analysis
router.get("/skill-gaps", async (req: Request, res: Response) => {
  try {
    const gaps = workforcePlatform.getSkillGapAnalysis();
    return res.json(gaps);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ORGANIZATIONAL LEARNING
// ============================================================================

// Capture learning
router.post("/learning", async (req: Request, res: Response) => {
  try {
    const { missionId, success, details } = req.body;

    if (!missionId || success === undefined) {
      return res.status(400).json({ error: "missionId and success are required" });
    }

    workforcePlatform.captureOrganizationalLearning(missionId, success, details || {});
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// GOVERNANCE
// ============================================================================

// Check governance compliance
router.post("/governance/check", async (req: Request, res: Response) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    const result = workforcePlatform.checkGovernanceCompliance(action);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// FULL REPORT
// ============================================================================

// Generate organizational report
router.get("/report", async (req: Request, res: Response) => {
  try {
    const report = workforcePlatform.generateOrganizationalReport();
    return res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ENUMS
// ============================================================================

router.get("/enums", async (req: Request, res: Response) => {
  return res.json({
    DepartmentType: Object.values(DepartmentType),
    WorkerLevel: Object.values(WorkerLevel),
    WorkerStatus: Object.values(WorkerStatus),
    SkillLevel: Object.values(SkillLevel),
  });
});

export default router;
