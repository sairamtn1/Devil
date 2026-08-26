/**
 * DEVIL Digital Workforce Platform
 * 
 * Phase 13: Transform DEVIL into a self-managed digital organization.
 * 
 * Features:
 * - Workforce Engine (workers, teams, departments)
 * - Department Management System
 * - Workforce Memory Layer
 * - Recruitment Engine
 * - Performance Review Engine
 * - Skill Evolution Engine
 * - Internal Communication Network
 * - Workforce Scheduler
 * - Analytics Dashboard
 * - Organizational Governance
 * - Organizational Learning Engine
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

// Department Types
export const DepartmentType = {
  ENGINEERING: "engineering",
  PRODUCT: "product",
  DESIGN: "design",
  RESEARCH: "research",
  MARKETING: "marketing",
  SECURITY: "security",
  OPERATIONS: "operations",
  FINANCE: "finance",
} as const;

export type DepartmentTypeType = typeof DepartmentType[keyof typeof DepartmentType];

// Worker Level
export const WorkerLevel = {
  INTERN: "intern",
  JUNIOR: "junior",
  MIDDLE: "middle",
  SENIOR: "senior",
  LEAD: "lead",
  MANAGER: "manager",
  DIRECTOR: "director",
  VP: "vp",
  EXECUTIVE: "executive",
} as const;

export type WorkerLevelType = typeof WorkerLevel[keyof typeof WorkerLevel];

// Worker Status
export const WorkerStatus = {
  ACTIVE: "active",
  IDLE: "idle",
  TRAINING: "training",
  ON_LEAVE: "on_leave",
  OFFBOARDED: "offboarded",
} as const;

export type WorkerStatusType = typeof WorkerStatus[keyof typeof WorkerStatus];

// Skill Level
export const SkillLevel = {
  NOVICE: 1,
  BEGINNER: 2,
  COMPETENT: 3,
  PROFICIENT: 4,
  EXPERT: 5,
} as const;

export type SkillLevelType = typeof SkillLevel[keyof typeof SkillLevel];

// ============================================================================
// WORKER
// ============================================================================

export interface Skill {
  name: string;
  level: SkillLevelType;
  experience: number; // months
  certifications: string[];
}

export interface WorkerMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  accuracy: number;
  efficiency: number;
  recoveryRate: number;
  innovationScore: number;
  collaborationScore: number;
  costEffectiveness: number;
}

export interface WorkerMemory {
  projectsCompleted: string[];
  mistakes: string[];
  recoveryMethods: string[];
  bestPractices: string[];
  specializedKnowledge: string[];
  performanceHistory: { date: Date; score: number }[];
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  department: DepartmentTypeType;
  team: string;
  level: WorkerLevelType;
  status: WorkerStatusType;
  skills: Skill[];
  experienceScore: number;
  efficiency: number;
  metrics: WorkerMetrics;
  memory: WorkerMemory;
  learningHistory: string[];
  salary: number;
  createdAt: Date;
  lastActiveAt: Date;
  promotions: { from: WorkerLevelType; to: WorkerLevelType; date: Date }[];
}

// ============================================================================
// TEAM
// ============================================================================

export interface Team {
  id: string;
  name: string;
  department: DepartmentTypeType;
  leadId?: string;
  members: string[]; // worker IDs
  activeMissions: string[];
  completedMissions: number;
  performanceScore: number;
  createdAt: Date;
}

// ============================================================================
// DEPARTMENT
// ============================================================================

export interface DepartmentMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalMissions: number;
  completedMissions: number;
  failedMissions: number;
  averagePerformance: number;
  utilization: number;
  budget: number;
  spent: number;
}

export interface Department {
  id: string;
  type: DepartmentTypeType;
  name: string;
  headId?: string;
  teams: Team[];
  workers: string[]; // worker IDs
  metrics: DepartmentMetrics;
  budget: number;
  objectives: string[];
  createdAt: Date;
}

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface OrganizationMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalDepartments: number;
  totalTeams: number;
  totalMissions: number;
  completedMissions: number;
  failedMissions: number;
  averagePerformance: number;
  organizationalHealth: number;
  workforceGrowth: number;
  costEffectiveness: number;
}

export interface Organization {
  id: string;
  name: string;
  departments: Map<string, Department>;
  workers: Map<string, Worker>;
  teams: Map<string, Team>;
  metrics: OrganizationMetrics;
  createdAt: Date;
}

// ============================================================================
// PERFORMANCE REVIEW
// ============================================================================

export interface PerformanceReview {
  id: string;
  workerId: string;
  reviewerId: string;
  period: { start: Date; end: Date };
  scores: {
    taskCompletion: number;
    accuracy: number;
    efficiency: number;
    recoveryRate: number;
    innovation: number;
    collaboration: number;
    costEffectiveness: number;
  };
  overallScore: number;
  recommendation: "promotion" | "reassignment" | "training" | "no_action";
  feedback: string;
  createdAt: Date;
}

// ============================================================================
// RECRUITMENT
// ============================================================================

export interface RecruitmentRequest {
  id: string;
  department: DepartmentTypeType;
  team: string;
  role: string;
  level: WorkerLevelType;
  skills: string[];
  urgency: "low" | "normal" | "high" | "critical";
  reason: string;
  status: "open" | "in_progress" | "filled" | "cancelled";
  createdAt: Date;
}

// ============================================================================
// COMMUNICATION
// ============================================================================

export interface OrgMessage {
  id: string;
  from: string; // worker or department ID
  to: string | "all" | "department" | "team";
  type: "update" | "request" | "alert" | "handoff" | "escalation";
  priority: "low" | "normal" | "high" | "critical";
  subject: string;
  content: string;
  readBy: string[];
  createdAt: Date;
}

// ============================================================================
// GOVERNANCE
// ============================================================================

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  permissionLevel: number;
  requiresApproval: boolean;
  approvers: string[];
  complianceRules: string[];
}

// ============================================================================
// DIGITAL WORKFORCE PLATFORM
// ============================================================================

export class DigitalWorkforcePlatform {
  private organization: Organization;
  private reviews: Map<string, PerformanceReview> = new Map();
  private recruitmentRequests: Map<string, RecruitmentRequest> = new Map();
  private messages: OrgMessage[] = [];
  private governancePolicies: Map<string, GovernancePolicy> = new Map();
  private skillsCatalog: Map<string, SkillLevelType> = new Map();

  constructor(name: string = "DEVIL Organization") {
    this.organization = this.createOrganization(name);
    this.initializeDefaultDepartments();
    this.initializeGovernancePolicies();
    this.log("DigitalWorkforcePlatform initialized");
  }

  private createOrganization(name: string): Organization {
    return {
      id: `org-${randomUUID().slice(0, 8)}`,
      name,
      departments: new Map(),
      workers: new Map(),
      teams: new Map(),
      metrics: {
        totalWorkers: 0,
        activeWorkers: 0,
        idleWorkers: 0,
        totalDepartments: 0,
        totalTeams: 0,
        totalMissions: 0,
        completedMissions: 0,
        failedMissions: 0,
        averagePerformance: 0,
        organizationalHealth: 100,
        workforceGrowth: 0,
        costEffectiveness: 1.0,
      },
      createdAt: new Date(),
    };
  }

  private initializeDefaultDepartments() {
    const departments = [
      { type: DepartmentType.ENGINEERING, name: "Engineering" },
      { type: DepartmentType.PRODUCT, name: "Product" },
      { type: DepartmentType.DESIGN, name: "Design" },
      { type: DepartmentType.RESEARCH, name: "Research" },
      { type: DepartmentType.MARKETING, name: "Marketing" },
      { type: DepartmentType.SECURITY, name: "Security" },
      { type: DepartmentType.OPERATIONS, name: "Operations" },
      { type: DepartmentType.FINANCE, name: "Finance" },
    ];

    for (const dept of departments) {
      this.createDepartment(dept.type, dept.name);
    }
  }

  private initializeGovernancePolicies() {
    // High-risk actions policy
    this.governancePolicies.set("high_risk", {
      id: "high_risk",
      name: "High Risk Actions",
      description: "Actions requiring executive approval",
      permissionLevel: 9,
      requiresApproval: true,
      approvers: ["ceo", "cso", "cfo"],
      complianceRules: ["audit_trail", "dual_approval"],
    });

    // Budget policy
    this.governancePolicies.set("budget", {
      id: "budget",
      name: "Budget Management",
      description: "Budget allocation and spending",
      permissionLevel: 7,
      requiresApproval: true,
      approvers: ["cfo", "department_head"],
      complianceRules: ["budget_limit"],
    });

    // Hiring policy
    this.governancePolicies.set("hiring", {
      id: "hiring",
      name: "Hiring Policy",
      description: "Worker recruitment and onboarding",
      permissionLevel: 6,
      requiresApproval: true,
      approvers: ["hr_director", "department_head"],
      complianceRules: ["background_check", "skill_verification"],
    });
  }

  // ==========================================================================
  // WORKER MANAGEMENT
  // ==========================================================================

  createWorker(
    name: string,
    role: string,
    department: DepartmentTypeType,
    options?: {
      team?: string;
      level?: WorkerLevelType;
      skills?: Skill[];
      salary?: number;
    }
  ): Worker {
    const id = `DEVIL-${department.slice(0, 3).toUpperCase()}-${randomUUID().slice(0, 3).toUpperCase()}`;

    const worker: Worker = {
      id,
      name,
      role,
      department,
      team: options?.team || "General",
      level: options?.level || WorkerLevel.JUNIOR,
      status: WorkerStatus.ACTIVE,
      skills: options?.skills || [],
      experienceScore: 50,
      efficiency: 75,
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        accuracy: 90,
        efficiency: 85,
        recoveryRate: 80,
        innovationScore: 70,
        collaborationScore: 80,
        costEffectiveness: 85,
      },
      memory: {
        projectsCompleted: [],
        mistakes: [],
        recoveryMethods: [],
        bestPractices: [],
        specializedKnowledge: [],
        performanceHistory: [],
      },
      learningHistory: [],
      salary: options?.salary || 50000,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      promotions: [],
    };

    this.organization.workers.set(id, worker);

    // Add to department
    const dept = this.organization.departments.get(department);
    if (dept) {
      dept.workers.push(id);
    }

    this.updateMetrics();
    this.log(`Worker created: ${id} - ${name} (${role})`);

    return worker;
  }

  getWorker(id: string): Worker | undefined {
    return this.organization.workers.get(id);
  }

  getWorkers(options?: {
    department?: DepartmentTypeType;
    level?: WorkerLevelType;
    status?: WorkerStatusType;
  }): Worker[] {
    let workers = Array.from(this.organization.workers.values());

    if (options?.department) {
      workers = workers.filter(w => w.department === options.department);
    }
    if (options?.level) {
      workers = workers.filter(w => w.level === options.level);
    }
    if (options?.status) {
      workers = workers.filter(w => w.status === options.status);
    }

    return workers;
  }

  updateWorkerMetrics(workerId: string, taskCompleted: boolean, quality: number) {
    const worker = this.organization.workers.get(workerId);
    if (!worker) return;

    worker.lastActiveAt = new Date();

    if (taskCompleted) {
      worker.metrics.tasksCompleted++;
      worker.experienceScore = Math.min(100, worker.experienceScore + 0.5);
    } else {
      worker.metrics.tasksFailed++;
      worker.experienceScore = Math.max(0, worker.experienceScore - 0.3);
    }

    // Update efficiency
    const totalTasks = worker.metrics.tasksCompleted + worker.metrics.tasksFailed;
    if (totalTasks > 0) {
      worker.metrics.accuracy = (worker.metrics.tasksCompleted / totalTasks) * 100;
      worker.efficiency = (worker.metrics.accuracy + quality) / 2;
    }

    // Record in memory
    if (taskCompleted) {
      worker.memory.performanceHistory.push({
        date: new Date(),
        score: worker.efficiency,
      });
    }
  }

  recordWorkerMistake(workerId: string, mistake: string, recoveryMethod: string) {
    const worker = this.organization.workers.get(workerId);
    if (!worker) return;

    worker.memory.mistakes.push(mistake);
    worker.memory.recoveryMethods.push(recoveryMethod);
    worker.memory.bestPractices.push(`Learned from: ${mistake}`);
  }

  // ==========================================================================
  // DEPARTMENT MANAGEMENT
  // ==========================================================================

  createDepartment(type: DepartmentTypeType, name: string, headId?: string): Department {
    const id = `dept-${type}-${randomUUID().slice(0, 8)}`;

    const department: Department = {
      id,
      type,
      name,
      headId,
      teams: [],
      workers: [],
      metrics: {
        totalWorkers: 0,
        activeWorkers: 0,
        idleWorkers: 0,
        totalMissions: 0,
        completedMissions: 0,
        failedMissions: 0,
        averagePerformance: 0,
        utilization: 0,
        budget: 100000,
        spent: 0,
      },
      budget: 100000,
      objectives: [],
      createdAt: new Date(),
    };

    this.organization.departments.set(type, department);
    this.updateMetrics();

    this.log(`Department created: ${name} (${type})`);
    return department;
  }

  getDepartment(type: DepartmentTypeType): Department | undefined {
    return this.organization.departments.get(type);
  }

  getAllDepartments(): Department[] {
    return Array.from(this.organization.departments.values());
  }

  setDepartmentBudget(type: DepartmentTypeType, budget: number) {
    const dept = this.organization.departments.get(type);
    if (dept) {
      dept.budget = budget;
      dept.metrics.budget = budget;
    }
  }

  // ==========================================================================
  // TEAM MANAGEMENT
  // ==========================================================================

  createTeam(name: string, department: DepartmentTypeType, leadId?: string): Team {
    const id = `team-${randomUUID().slice(0, 8)}`;

    const team: Team = {
      id,
      name,
      department,
      leadId,
      members: [],
      activeMissions: [],
      completedMissions: 0,
      performanceScore: 75,
      createdAt: new Date(),
    };

    this.organization.teams.set(id, team);

    // Add to department
    const dept = this.organization.departments.get(department);
    if (dept) {
      dept.teams.push(team);
    }

    this.updateMetrics();
    this.log(`Team created: ${name} in ${department}`);

    return team;
  }

  addWorkerToTeam(workerId: string, teamId: string) {
    const worker = this.organization.workers.get(workerId);
    const team = this.organization.teams.get(teamId);

    if (worker && team) {
      if (!team.members.includes(workerId)) {
        team.members.push(workerId);
      }
      worker.team = team.name;
    }
  }

  getTeam(id: string): Team | undefined {
    return this.organization.teams.get(id);
  }

  // ==========================================================================
  // RECRUITMENT ENGINE
  // ==========================================================================

  createRecruitmentRequest(
    department: DepartmentTypeType,
    role: string,
    skills: string[],
    options?: {
      team?: string;
      level?: WorkerLevelType;
      urgency?: "low" | "normal" | "high" | "critical";
      reason?: string;
    }
  ): RecruitmentRequest {
    const id = `recruit-${randomUUID().slice(0, 8)}`;

    const request: RecruitmentRequest = {
      id,
      department,
      team: options?.team || "General",
      role,
      level: options?.level || WorkerLevel.MIDDLE,
      skills,
      urgency: options?.urgency || "normal",
      reason: options?.reason || "Team expansion",
      status: "open",
      createdAt: new Date(),
    };

    this.recruitmentRequests.set(id, request);

    // Auto-hire for demo purposes
    this.autoHire(request);

    this.log(`Recruitment request created: ${role} for ${department}`);

    return request;
  }

  private autoHire(request: RecruitmentRequest): Worker {
    // Create a new worker for the recruitment request
    const worker = this.createWorker(
      `${request.role} (New)`,
      request.role,
      request.department,
      {
        team: request.team,
        level: request.level,
        skills: request.skills.map(s => ({
          name: s,
          level: SkillLevel.COMPETENT,
          experience: 12,
          certifications: [],
        })),
      }
    );

    request.status = "filled";
    return worker;
  }

  getRecruitmentRequests(options?: {
    department?: DepartmentTypeType;
    status?: RecruitmentRequest["status"];
  }): RecruitmentRequest[] {
    let requests = Array.from(this.recruitmentRequests.values());

    if (options?.department) {
      requests = requests.filter(r => r.department === options.department);
    }
    if (options?.status) {
      requests = requests.filter(r => r.status === options.status);
    }

    return requests;
  }

  // ==========================================================================
  // PERFORMANCE REVIEW ENGINE
  // ==========================================================================

  conductPerformanceReview(
    workerId: string,
    reviewerId: string,
    scores: PerformanceReview["scores"],
    feedback: string
  ): PerformanceReview {
    const worker = this.organization.workers.get(workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    // Calculate overall score
    const overallScore = Object.values(scores).reduce((sum, s) => sum + s, 0) / Object.keys(scores).length;

    // Determine recommendation
    let recommendation: PerformanceReview["recommendation"] = "no_action";
    if (overallScore >= 90) {
      recommendation = "promotion";
    } else if (overallScore < 60) {
      recommendation = "training";
    } else if (overallScore < 75) {
      recommendation = "reassignment";
    }

    const review: PerformanceReview = {
      id: `review-${randomUUID().slice(0, 8)}`,
      workerId,
      reviewerId,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
      scores,
      overallScore,
      recommendation,
      feedback,
      createdAt: new Date(),
    };

    this.reviews.set(review.id, review);

    // Apply recommendation
    if (recommendation === "promotion") {
      this.promoteWorker(workerId);
    }

    this.log(`Performance review conducted for ${workerId}: Score ${overallScore.toFixed(1)}`);

    return review;
  }

  getPerformanceReviews(workerId?: string): PerformanceReview[] {
    const allReviews = Array.from(this.reviews.values());
    if (workerId) {
      return allReviews.filter(r => r.workerId === workerId);
    }
    return allReviews;
  }

  // ==========================================================================
  // SKILL EVOLUTION ENGINE
  // ==========================================================================

  evolveWorkerSkills(workerId: string, skillName: string, improvement: number) {
    const worker = this.organization.workers.get(workerId);
    if (!worker) return;

    // Find or create skill
    let skill = worker.skills.find(s => s.name === skillName);
    if (!skill) {
      skill = {
        name: skillName,
        level: SkillLevel.NOVICE,
        experience: 0,
        certifications: [],
      };
      worker.skills.push(skill);
    }

    // Improve skill level
    skill.level = Math.min(SkillLevel.EXPERT, skill.level + improvement) as SkillLevelType;
    skill.experience += 1;

    // Update worker experience score
    worker.experienceScore = Math.min(100, worker.experienceScore + improvement * 2);
  }

  promoteWorker(workerId: string) {
    const worker = this.organization.workers.get(workerId);
    if (!worker) return;

    const levels = Object.values(WorkerLevel);
    const currentIndex = levels.indexOf(worker.level);

    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      worker.promotions.push({
        from: worker.level,
        to: newLevel,
        date: new Date(),
      });
      worker.level = newLevel;
      worker.experienceScore = Math.min(100, worker.experienceScore + 20);

      this.log(`Worker ${workerId} promoted to ${newLevel}`);
    }
  }

  getWorkerPromotionPath(workerId: string): WorkerLevelType[] {
    const worker = this.organization.workers.get(workerId);
    if (!worker) return [];

    const levels = Object.values(WorkerLevel);
    const currentIndex = levels.indexOf(worker.level);

    return levels.slice(currentIndex);
  }

  // ==========================================================================
  // INTERNAL COMMUNICATION NETWORK
  // ==========================================================================

  sendMessage(
    from: string,
    to: string,
    type: OrgMessage["type"],
    subject: string,
    content: string,
    priority: OrgMessage["priority"] = "normal"
  ): OrgMessage {
    const message: OrgMessage = {
      id: `msg-${randomUUID().slice(0, 8)}`,
      from,
      to,
      type,
      priority,
      subject,
      content,
      readBy: [from],
      createdAt: new Date(),
    };

    this.messages.push(message);

    // Update worker last active
    const worker = this.organization.workers.get(from);
    if (worker) {
      worker.lastActiveAt = new Date();
    }

    return message;
  }

  broadcastToDepartment(department: DepartmentTypeType, subject: string, content: string) {
    const dept = this.organization.departments.get(department);
    if (!dept) return;

    for (const workerId of dept.workers) {
      this.sendMessage("ceo", workerId, "update", subject, content);
    }
  }

  getMessages(workerId: string): OrgMessage[] {
    return this.messages.filter(
      m => m.to === workerId || m.to === "all" || m.to === "department" || m.to === "team"
    );
  }

  // ==========================================================================
  // WORKFORCE SCHEDULER
  // ==========================================================================

  getWorkloadDistribution(): {
    department: DepartmentTypeType;
    load: number;
    workers: number;
    efficiency: number;
  }[] {
    const distribution: {
      department: DepartmentTypeType;
      load: number;
      workers: number;
      efficiency: number;
    }[] = [];

    for (const [type, dept] of this.organization.departments) {
      const activeWorkers = dept.workers.filter(id => {
        const worker = this.organization.workers.get(id);
        return worker?.status === WorkerStatus.ACTIVE;
      });

      const totalEfficiency = activeWorkers.reduce((sum, id) => {
        const worker = this.organization.workers.get(id);
        return sum + (worker?.efficiency || 0);
      }, 0);

      distribution.push({
        department: type,
        load: dept.metrics.totalMissions / Math.max(1, activeWorkers.length),
        workers: activeWorkers.length,
        efficiency: activeWorkers.length > 0 ? totalEfficiency / activeWorkers.length : 0,
      });
    }

    return distribution;
  }

  // ==========================================================================
  // ANALYTICS DASHBOARD
  // ==========================================================================

  getOrganizationMetrics(): OrganizationMetrics {
    this.updateMetrics();
    return this.organization.metrics;
  }

  private updateMetrics() {
    const workers = Array.from(this.organization.workers.values());
    const departments = Array.from(this.organization.departments.values());
    const teams = Array.from(this.organization.teams.values());

    this.organization.metrics = {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === WorkerStatus.ACTIVE).length,
      idleWorkers: workers.filter(w => w.status === WorkerStatus.IDLE).length,
      totalDepartments: departments.length,
      totalTeams: teams.length,
      totalMissions: departments.reduce((sum, d) => sum + d.metrics.totalMissions, 0),
      completedMissions: departments.reduce((sum, d) => sum + d.metrics.completedMissions, 0),
      failedMissions: departments.reduce((sum, d) => sum + d.metrics.failedMissions, 0),
      averagePerformance: workers.length > 0
        ? workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length
        : 0,
      organizationalHealth: this.calculateOrganizationalHealth(),
      workforceGrowth: this.calculateWorkforceGrowth(),
      costEffectiveness: this.calculateCostEffectiveness(),
    };
  }

  private calculateOrganizationalHealth(): number {
    const workers = Array.from(this.organization.workers.values());
    const avgPerformance = workers.length > 0
      ? workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length
      : 50;

    const idleRatio = workers.length > 0
      ? (workers.filter(w => w.status === WorkerStatus.IDLE).length / workers.length) * 100
      : 0;

    return Math.max(0, Math.min(100, avgPerformance - idleRatio * 0.5));
  }

  private calculateWorkforceGrowth(): number {
    const workers = Array.from(this.organization.workers.values());
    const recentHires = workers.filter(w => {
      const daysSinceCreation = (Date.now() - w.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      return daysSinceCreation <= 30;
    });

    return (recentHires.length / Math.max(1, workers.length)) * 100;
  }

  private calculateCostEffectiveness(): number {
    const workers = Array.from(this.organization.workers.values());
    const totalSalary = workers.reduce((sum, w) => sum + w.salary, 0);
    const totalOutput = workers.reduce((sum, w) => sum + w.metrics.tasksCompleted, 0);

    if (totalSalary === 0) return 1;
    return totalOutput / (totalSalary / 1000);
  }

  getDepartmentAnalytics(type: DepartmentTypeType): DepartmentMetrics | undefined {
    const dept = this.organization.departments.get(type);
    return dept?.metrics;
  }

  getTopPerformers(limit: number = 5): Worker[] {
    return Array.from(this.organization.workers.values())
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit);
  }

  getWorkersNeedingTraining(): Worker[] {
    return Array.from(this.organization.workers.values())
      .filter(w => w.efficiency < 70 || w.metrics.recoveryRate < 60);
  }

  // ==========================================================================
  // ORGANIZATIONAL LEARNING
  // ==========================================================================

  captureOrganizationalLearning(
    missionId: string,
    success: boolean,
    details: {
      patterns?: string[];
      teamPerformance?: Record<string, number>;
      resourceUsage?: Record<string, number>;
      lessonsLearned?: string[];
    }
  ) {
    // Store learning in all participating workers' memories
    for (const worker of this.organization.workers.values()) {
      if (success) {
        worker.memory.bestPractices.push(`Mission ${missionId}: ${details.patterns?.join(", ")}`);
      } else {
        worker.memory.mistakes.push(`Mission ${missionId} failed`);
        if (details.lessonsLearned) {
          worker.memory.recoveryMethods.push(...details.lessonsLearned);
        }
      }
    }

    this.log(`Organizational learning captured from mission ${missionId}`);
  }

  // ==========================================================================
  // STRATEGIC OPTIMIZATION
  // ==========================================================================

  getStrategicRecommendations(): {
    category: string;
    recommendations: string[];
    priority: "low" | "medium" | "high";
  }[] {
    const recommendations: {
      category: string;
      recommendations: string[];
      priority: "low" | "medium" | "high";
    }[] = [];

    // Check for workforce shortages
    const workload = this.getWorkloadDistribution();
    const overloadedDepts = workload.filter(w => w.load > 5);
    if (overloadedDepts.length > 0) {
      recommendations.push({
        category: "Workforce",
        recommendations: overloadedDepts.map(d =>
          `Hire ${Math.ceil(d.workers * 0.2)} more workers for ${d.department}`
        ),
        priority: "high",
      });
    }

    // Check for underperforming workers
    const needsTraining = this.getWorkersNeedingTraining();
    if (needsTraining.length > 0) {
      recommendations.push({
        category: "Training",
        recommendations: [
          `${needsTraining.length} workers need performance improvement training`,
          ...needsTraining.slice(0, 3).map(w => `Train ${w.name} in ${w.role}`)
        ],
        priority: "medium",
      });
    }

    // Check for idle workers
    const idleWorkers = this.getWorkers({ status: WorkerStatus.IDLE });
    if (idleWorkers.length > this.organization.metrics.totalWorkers * 0.1) {
      recommendations.push({
        category: "Optimization",
        recommendations: [
          `${idleWorkers.length} workers are idle - reassign to active projects`
        ],
        priority: "low",
      });
    }

    return recommendations;
  }

  getSkillGapAnalysis(): {
    requiredSkills: string[];
    availableSkills: { skill: string; count: number }[];
    gaps: string[];
  } {
    // Common required skills
    const requiredSkills = [
      "JavaScript", "Python", "React", "Node.js",
      "Machine Learning", "Cloud Architecture", "DevOps",
      "Product Management", "UX Design", "Data Analysis"
    ];

    // Count available skills
    const skillCounts: Map<string, number> = new Map();
    for (const worker of this.organization.workers.values()) {
      for (const skill of worker.skills) {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      }
    }

    const availableSkills = Array.from(skillCounts.entries()).map(([skill, count]) => ({
      skill,
      count,
    }));

    const gaps = requiredSkills.filter(skill => (skillCounts.get(skill) || 0) < 2);

    return { requiredSkills, availableSkills, gaps };
  }

  // ==========================================================================
  // GOVERNANCE
  // ==========================================================================

  checkGovernanceCompliance(action: string): {
    compliant: boolean;
    requiresApproval: boolean;
    approvers: string[];
    policy?: GovernancePolicy;
  } {
    // Check if action requires approval
    if (action.includes("delete") || action.includes("production") || action.includes("deploy")) {
      const policy = this.governancePolicies.get("high_risk")!;
      return {
        compliant: false,
        requiresApproval: true,
        approvers: policy.approvers,
        policy,
      };
    }

    if (action.includes("hire") || action.includes("budget")) {
      const policy = this.governancePolicies.get("hiring")!;
      return {
        compliant: false,
        requiresApproval: true,
        approvers: policy.approvers,
        policy,
      };
    }

    return {
      compliant: true,
      requiresApproval: false,
      approvers: [],
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "workforce_platform",
      severity: "info",
      message,
      details: {
        totalWorkers: this.organization.workers.size,
        departments: this.organization.departments.size,
      },
    });
  }

  generateOrganizationalReport(): {
    overview: OrganizationMetrics;
    departments: { type: DepartmentTypeType; name: string; metrics: DepartmentMetrics }[];
    workforce: {
      total: number;
      active: number;
      idle: number;
      topPerformers: { id: string; name: string; efficiency: number }[];
      needsTraining: number;
    };
    recommendations: { category: string; recommendations: string[]; priority: string }[];
    skillGaps: string[];
  } {
    this.updateMetrics();

    return {
      overview: this.organization.metrics,
      departments: Array.from(this.organization.departments.entries()).map(([type, dept]) => ({
        type,
        name: dept.name,
        metrics: dept.metrics,
      })),
      workforce: {
        total: this.organization.metrics.totalWorkers,
        active: this.organization.metrics.activeWorkers,
        idle: this.organization.metrics.idleWorkers,
        topPerformers: this.getTopPerformers(5).map(w => ({
          id: w.id,
          name: w.name,
          efficiency: w.efficiency,
        })),
        needsTraining: this.getWorkersNeedingTraining().length,
      },
      recommendations: this.getStrategicRecommendations(),
      skillGaps: this.getSkillGapAnalysis().gaps,
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const workforcePlatform = new DigitalWorkforcePlatform();
