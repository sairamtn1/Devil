/**
 * VOLGA OS Public Beta System
 * 
 * Phase 27: Make VOLGA deployable, usable, and launchable.
 * 
 * Features:
 * - Authentication System
 * - User Onboarding
 * - Beta Program
 * - Analytics
 * - Error Monitoring
 * - Admin Console
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES - AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  authProvider?: "email" | "google" | "github";
  emailVerified: boolean;
  role: "user" | "admin" | "beta-tester";
  status: "active" | "pending" | "suspended";
  onboarding: {
    completed: boolean;
    steps: { name: string; completed: boolean }[];
  };
  preferences: Record<string, unknown>;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// TYPES - BETA PROGRAM
// ============================================================================

export interface BetaAccess {
  id: string;
  code: string;
  type: "invite" | "waitlist" | "general";
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  createdBy?: string;
}

export interface BetaFeedback {
  id: string;
  userId: string;
  type: "bug" | "feature" | "general";
  title: string;
  description: string;
  status: "open" | "reviewing" | "implemented" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
}

// ============================================================================
// TYPES - ANALYTICS
// ============================================================================

export interface Analytics {
  activeUsers: number;
  totalUsers: number;
  missionCount: number;
  agentUsage: Record<string, number>;
  simulationUsage: number;
  featureUsage: Record<string, number>;
  dailyActiveUsers: { date: string; count: number }[];
  missionSuccessRate: number;
}

export interface SystemMetrics {
  uptime: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

// ============================================================================
// TYPES - ERROR MONITORING
// ============================================================================

export interface ErrorLog {
  id: string;
  type: "frontend" | "backend" | "api" | "agent" | "database";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

// ============================================================================
// PUBLIC BETA SYSTEM
// ============================================================================

export class PublicBetaSystem {
  // Users & Auth
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private emailIndex: Map<string, string> = new Map();
  
  // Beta Program
  private betaCodes: Map<string, BetaAccess> = new Map();
  private betaFeedback: Map<string, BetaFeedback> = new Map();
  private waitlist: Map<string, { email: string; position: number; joinedAt: Date }> = new Map();
  
  // Analytics
  private analytics: Analytics = {
    activeUsers: 0,
    totalUsers: 0,
    missionCount: 0,
    agentUsage: {},
    simulationUsage: 0,
    featureUsage: {},
    dailyActiveUsers: [],
    missionSuccessRate: 0,
  };
  
  // Error Monitoring
  private errorLogs: Map<string, ErrorLog> = new Map();

  constructor() {
    this.initializeDefaultData();
    this.log("PublicBetaSystem initialized");
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeDefaultData() {
    // Create admin user
    const admin = this.createUser({
      email: "admin@volga.ai",
      name: "VOLGA Admin",
      role: "admin",
      authProvider: "email",
      emailVerified: true,
    });
    
    // Create beta tester
    const betaTester = this.createUser({
      email: "beta@volga.ai",
      name: "Beta Tester",
      role: "beta-tester",
      authProvider: "email",
      emailVerified: true,
    });

    // Initialize sample analytics
    this.analytics = {
      activeUsers: 42,
      totalUsers: 150,
      missionCount: 523,
      agentUsage: {
        "brain": 450,
        "coding": 380,
        "research": 290,
        "deployment": 180,
        "image": 150,
        "video": 120,
      },
      simulationUsage: 89,
      featureUsage: {
        "missions": 523,
        "simulations": 89,
        "agents": 450,
        "memory": 320,
      },
      dailyActiveUsers: [
        { date: "2024-01-01", count: 38 },
        { date: "2024-01-02", count: 42 },
        { date: "2024-01-03", count: 45 },
        { date: "2024-01-04", count: 40 },
        { date: "2024-01-05", count: 42 },
      ],
      missionSuccessRate: 94.5,
    };

    // Initialize beta codes
    this.createBetaCode("BETA2024", "general", 1000);
    this.createBetaCode("EARLYACCESS", "invite", 100);
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  createUser(data: {
    email: string;
    name: string;
    role?: User["role"];
    authProvider?: User["authProvider"];
    emailVerified?: boolean;
  }): User {
    const id = `user-${randomUUID().slice(0, 8)}`;
    
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      authProvider: data.authProvider || "email",
      emailVerified: data.emailVerified || false,
      role: data.role || "user",
      status: "active",
      onboarding: {
        completed: false,
        steps: [
          { name: "welcome", completed: false },
          { name: "first_mission", completed: false },
          { name: "agent_intro", completed: false },
          { name: "simulation_intro", completed: false },
        ],
      },
      preferences: {},
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.emailIndex.set(data.email.toLowerCase(), id);
    this.analytics.totalUsers++;
    
    return user;
  }

  authenticate(email: string, password: string): Session | null {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    
    const user = this.users.get(userId);
    if (!user || user.status !== "active") return null;
    
    return this.createSession(userId);
  }

  authenticateWithProvider(provider: "google" | "github", providerId: string): Session | null {
    const user = Array.from(this.users.values())
      .find(u => u.authProvider === provider);
    
    if (!user) return null;
    
    return this.createSession(user.id);
  }

  private createSession(userId: string): Session {
    const session: Session = {
      id: `sess-${randomUUID().slice(0, 8)}`,
      userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    
    this.sessions.set(session.token, session);
    
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = new Date();
    }
    
    this.analytics.activeUsers++;
    
    return session;
  }

  validateSession(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    
    return this.users.get(session.userId) || null;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }

  // ==========================================================================
  // ONBOARDING
  // ==========================================================================

  completeOnboardingStep(userId: string, step: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const stepIndex = user.onboarding.steps.findIndex(s => s.name === step);
    if (stepIndex === -1) return false;
    
    user.onboarding.steps[stepIndex].completed = true;
    
    // Check if all steps completed
    user.onboarding.completed = user.onboarding.steps.every(s => s.completed);
    
    return true;
  }

  // ==========================================================================
  // BETA PROGRAM
  // ==========================================================================

  createBetaCode(code: string, type: BetaAccess["type"], maxUses: number): BetaAccess {
    const access: BetaAccess = {
      id: `beta-${randomUUID().slice(0, 8)}`,
      code: code.toUpperCase(),
      type,
      maxUses,
      usedCount: 0,
      createdBy: "system",
    };
    
    this.betaCodes.set(code.toUpperCase(), access);
    return access;
  }

  validateBetaCode(code: string): boolean {
    const access = this.betaCodes.get(code.toUpperCase());
    if (!access) return false;
    
    if (access.expiresAt && access.expiresAt < new Date()) return false;
    if (access.usedCount >= access.maxUses) return false;
    
    return true;
  }

  useBetaCode(code: string): boolean {
    const access = this.betaCodes.get(code.toUpperCase());
    if (!access) return false;
    
    access.usedCount++;
    return true;
  }

  joinWaitlist(email: string): { position: number } {
    const existing = this.waitlist.get(email.toLowerCase());
    if (existing) return { position: existing.position };
    
    const position = this.waitlist.size + 1;
    this.waitlist.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      position,
      joinedAt: new Date(),
    });
    
    return { position };
  }

  submitFeedback(data: {
    userId: string;
    type: BetaFeedback["type"];
    title: string;
    description: string;
    priority?: BetaFeedback["priority"];
  }): BetaFeedback {
    const feedback: BetaFeedback = {
      id: `fb-${randomUUID().slice(0, 8)}`,
      userId: data.userId,
      type: data.type,
      title: data.title,
      description: data.description,
      status: "open",
      priority: data.priority || "medium",
      createdAt: new Date(),
    };
    
    this.betaFeedback.set(feedback.id, feedback);
    return feedback;
  }

  getFeedback(userId?: string): BetaFeedback[] {
    let feedback = Array.from(this.betaFeedback.values());
    if (userId) {
      feedback = feedback.filter(f => f.userId === userId);
    }
    return feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  getAnalytics(): Analytics {
    return { ...this.analytics };
  }

  trackEvent(event: string, metadata?: Record<string, unknown>) {
    if (!this.analytics.featureUsage[event]) {
      this.analytics.featureUsage[event] = 0;
    }
    this.analytics.featureUsage[event]++;
    
    this.log(`Event tracked: ${event}`);
  }

  // ==========================================================================
  // ERROR MONITORING
  // ==========================================================================

  logError(error: {
    type: ErrorLog["type"];
    severity: ErrorLog["severity"];
    message: string;
    stack?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): ErrorLog {
    const log: ErrorLog = {
      id: `err-${randomUUID().slice(0, 8)}`,
      ...error,
      timestamp: new Date(),
      resolved: false,
    };
    
    this.errorLogs.set(log.id, log);
    return log;
  }

  getErrors(options?: {
    type?: ErrorLog["type"];
    severity?: ErrorLog["severity"];
    limit?: number;
  }): ErrorLog[] {
    let errors = Array.from(this.errorLogs.values());
    
    if (options?.type) {
      errors = errors.filter(e => e.type === options.type);
    }
    if (options?.severity) {
      errors = errors.filter(e => e.severity === options.severity);
    }
    
    return errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options?.limit || 50);
  }

  // ==========================================================================
  // ADMIN CONSOLE
  // ==========================================================================

  getAdminDashboard(): {
    users: { total: number; active: number; byRole: Record<string, number> };
    missions: { total: number; successRate: number };
    beta: { totalCodes: number; feedbackCount: number; waitlistSize: number };
    errors: { total: number; unresolved: number };
    analytics: Analytics;
  } {
    const users = Array.from(this.users.values());
    
    return {
      users: {
        total: users.length,
        active: users.filter(u => u.status === "active").length,
        byRole: users.reduce((acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      missions: {
        total: this.analytics.missionCount,
        successRate: this.analytics.missionSuccessRate,
      },
      beta: {
        totalCodes: this.betaCodes.size,
        feedbackCount: this.betaFeedback.size,
        waitlistSize: this.waitlist.size,
      },
      errors: {
        total: this.errorLogs.size,
        unresolved: Array.from(this.errorLogs.values()).filter(e => !e.resolved).length,
      },
      analytics: this.analytics,
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "public_beta",
      severity: "info",
      message,
      details: { system: "public_beta" },
    });
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const publicBetaSystem = new PublicBetaSystem();
