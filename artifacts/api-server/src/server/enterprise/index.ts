/**
 * DEVIL Enterprise Command Center
 * 
 * Phase 24: Transform DEVIL into an enterprise-ready AI Operating System.
 * 
 * Features:
 * - Organization Engine
 * - Workspace Engine
 * - Team Management
 * - Role Based Access Control
 * - Permission System
 * - Audit Engine
 * - Governance Layer
 * - Resource Management
 * - Billing Foundation
 * - Security Layer
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES - ORGANIZATION
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: {
    branding?: { logo?: string; colors?: string[] };
    policies?: Record<string, unknown>;
    metadata?: Record<string, string>;
  };
  subscription: {
    plan: "free" | "starter" | "professional" | "enterprise";
    seats: number;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TYPES - WORKSPACE
// ============================================================================

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  isolated: boolean;
  resources: {
    compute: number;
    storage: number;
    agents: number;
    simulations: number;
  };
  config: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// TYPES - TEAM
// ============================================================================

export interface Team {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  type: "department" | "project" | "agent" | "custom";
  members: string[];
  owners: string[];
  createdAt: Date;
}

// ============================================================================
// TYPES - USER & ROLE
// ============================================================================

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  teams: string[];
  permissions: Permission[];
  lastActive: Date;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  type: "owner" | "admin" | "manager" | "operator" | "viewer" | "custom";
  permissions: Permission[];
  isSystem: boolean;
}

export type Permission =
  | "brain:read" | "brain:write" | "brain:execute"
  | "memory:read" | "memory:write" | "memory:delete"
  | "research:read" | "research:write"
  | "deployment:read" | "deployment:write" | "deployment:execute"
  | "marketplace:read" | "marketplace:write"
  | "simulation:read" | "simulation:write" | "simulation:execute"
  | "evolution:read" | "evolution:write"
  | "collective:read" | "collective:write"
  | "self-modify:read" | "self-modify:write" | "self-modify:execute"
  | "organization:read" | "organization:write" | "organization:admin"
  | "workspace:read" | "workspace:write" | "workspace:admin"
  | "team:read" | "team:write" | "team:admin"
  | "user:read" | "user:write" | "user:admin"
  | "audit:read" | "audit:admin"
  | "billing:read" | "billing:write";

// ============================================================================
// TYPES - AUDIT
// ============================================================================

export interface AuditEntry {
  id: string;
  organizationId: string;
  userId?: string;
  agentId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// TYPES - GOVERNANCE
// ============================================================================

export interface Policy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  rules: {
    condition: string;
    action: "allow" | "deny" | "require_approval";
  }[];
  enforced: boolean;
  createdAt: Date;
}

export interface ComplianceCheck {
  id: string;
  organizationId: string;
  standard: string;
  status: "pass" | "fail" | "warning" | "pending";
  findings: string[];
  lastChecked: Date;
}

// ============================================================================
// TYPES - RESOURCES
// ============================================================================

export interface ResourceUsage {
  organizationId: string;
  period: string;
  compute: { used: number; limit: number; unit: string };
  storage: { used: number; limit: number; unit: string };
  agents: { used: number; limit: number };
  simulations: { used: number; limit: number };
  apiCalls: { used: number; limit: number };
  cost: number;
}

// ============================================================================
// ENTERPRISE COMMAND CENTER
// ============================================================================

export class EnterpriseCommandCenter {
  private organizations: Map<string, Organization> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private teams: Map<string, Team> = new Map();
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private auditLog: AuditEntry[] = [];
  private policies: Map<string, Policy> = new Map();
  private resourceUsage: Map<string, ResourceUsage> = new Map();

  constructor() {
    this.initializeSystemRoles();
    this.initializeDefaultOrganization();
    this.log("EnterpriseCommandCenter initialized");
  }

  // ==========================================================================
  // SYSTEM ROLES
  // ==========================================================================

  private initializeSystemRoles() {
    const systemRoles: Role[] = [
      {
        id: "role-owner",
        name: "Owner",
        type: "owner",
        permissions: ["*"],
        isSystem: true,
      },
      {
        id: "role-admin",
        name: "Administrator",
        type: "admin",
        permissions: [
          "brain:*", "memory:*", "research:*", "deployment:*", "marketplace:*",
          "simulation:*", "evolution:*", "collective:*", "self-modify:*",
          "organization:write", "workspace:*", "team:*", "user:*", "audit:read",
        ],
        isSystem: true,
      },
      {
        id: "role-manager",
        name: "Manager",
        type: "manager",
        permissions: [
          "brain:read", "brain:write", "memory:read", "memory:write",
          "research:*", "deployment:write", "simulation:write",
          "workspace:read", "workspace:write", "team:read", "team:write",
        ],
        isSystem: true,
      },
      {
        id: "role-operator",
        name: "Operator",
        type: "operator",
        permissions: [
          "brain:read", "brain:execute", "memory:read",
          "deployment:execute", "simulation:execute",
          "workspace:read", "team:read",
        ],
        isSystem: true,
      },
      {
        id: "role-viewer",
        name: "Viewer",
        type: "viewer",
        permissions: [
          "brain:read", "memory:read", "research:read",
          "deployment:read", "simulation:read",
          "workspace:read", "team:read",
        ],
        isSystem: true,
      },
    ];

    for (const role of systemRoles) {
      this.roles.set(role.id, role);
    }
  }

  private initializeDefaultOrganization() {
    const org = this.createOrganization("DEVIL Enterprise", "devil-enterprise", "enterprise");
    const workspace = this.createWorkspace(org.id, "Default Workspace", "default");
    const adminRole = this.roles.get("role-admin")!;
    
    // Create admin user
    this.createUser(org.id, "admin@devil.ai", "System Administrator", adminRole);
  }

  // ==========================================================================
  // ORGANIZATION ENGINE
  // ==========================================================================

  createOrganization(name: string, slug: string, plan: Organization["subscription"]["plan"] = "starter"): Organization {
    const id = `org-${randomUUID().slice(0, 8)}`;

    const organization: Organization = {
      id,
      name,
      slug,
      settings: {},
      subscription: {
        plan,
        seats: plan === "enterprise" ? 100 : plan === "professional" ? 25 : plan === "starter" ? 10 : 5,
        features: this.getPlanFeatures(plan),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(id, organization);
    this.logAudit("organization", "create", id, { name, slug, plan });
    return organization;
  }

  private getPlanFeatures(plan: Organization["subscription"]["plan"]): string[] {
    const base = ["basic-analytics", "api-access"];
    const features: Record<string, string[]> = {
      free: base,
      starter: [...base, "10-workspaces", "team-support", "audit-log"],
      professional: [...base, "unlimited-workspaces", "priority-support", "advanced-analytics", "sso", "audit-log"],
      enterprise: [...base, "unlimited-workspaces", "dedicated-support", "custom-analytics", "sso", "audit-log", "compliance", "sla", "custom-contracts"],
    };
    return features[plan];
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  getOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    const org = this.organizations.get(id);
    if (org) {
      Object.assign(org, updates, { updatedAt: new Date() });
      this.logAudit("organization", "update", id, updates);
    }
    return org;
  }

  // ==========================================================================
  // WORKSPACE ENGINE
  // ==========================================================================

  createWorkspace(organizationId: string, name: string, slug: string, isolated = true): Workspace {
    const id = `ws-${randomUUID().slice(0, 8)}`;

    const workspace: Workspace = {
      id,
      organizationId,
      name,
      slug,
      isolated,
      resources: {
        compute: 1000,
        storage: 100,
        agents: 10,
        simulations: 50,
      },
      config: {},
      createdAt: new Date(),
    };

    this.workspaces.set(id, workspace);
    this.logAudit("workspace", "create", id, { organizationId, name });
    return workspace;
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  getWorkspaces(organizationId?: string): Workspace[] {
    let workspaces = Array.from(this.workspaces.values());
    if (organizationId) {
      workspaces = workspaces.filter(w => w.organizationId === organizationId);
    }
    return workspaces;
  }

  // ==========================================================================
  // TEAM MANAGEMENT
  // ==========================================================================

  createTeam(
    organizationId: string,
    name: string,
    type: Team["type"] = "custom",
    workspaceId?: string
  ): Team {
    const id = `team-${randomUUID().slice(0, 8)}`;

    const team: Team = {
      id,
      organizationId,
      workspaceId,
      name,
      type,
      members: [],
      owners: [],
      createdAt: new Date(),
    };

    this.teams.set(id, team);
    this.logAudit("team", "create", id, { organizationId, name, type });
    return team;
  }

  getTeam(id: string): Team | undefined {
    return this.teams.get(id);
  }

  getTeams(organizationId?: string): Team[] {
    let teams = Array.from(this.teams.values());
    if (organizationId) {
      teams = teams.filter(t => t.organizationId === organizationId);
    }
    return teams;
  }

  addTeamMember(teamId: string, userId: string) {
    const team = this.teams.get(teamId);
    if (team && !team.members.includes(userId)) {
      team.members.push(userId);
      this.logAudit("team", "add_member", teamId, { userId });
    }
  }

  removeTeamMember(teamId: string, userId: string) {
    const team = this.teams.get(teamId);
    if (team) {
      team.members = team.members.filter(m => m !== userId);
      this.logAudit("team", "remove_member", teamId, { userId });
    }
  }

  // ==========================================================================
  // USER MANAGEMENT
  // ==========================================================================

  createUser(organizationId: string, email: string, name: string, role: Role): User {
    const id = `user-${randomUUID().slice(0, 8)}`;

    const user: User = {
      id,
      organizationId,
      email,
      name,
      role,
      teams: [],
      permissions: role.permissions.includes("*") ? this.getAllPermissions() : role.permissions,
      lastActive: new Date(),
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.logAudit("user", "create", id, { organizationId, email, role: role.name });
    return user;
  }

  private getAllPermissions(): Permission[] {
    return [
      "brain:read", "brain:write", "brain:execute",
      "memory:read", "memory:write", "memory:delete",
      "research:read", "research:write",
      "deployment:read", "deployment:write", "deployment:execute",
      "marketplace:read", "marketplace:write",
      "simulation:read", "simulation:write", "simulation:execute",
      "evolution:read", "evolution:write",
      "collective:read", "collective:write",
      "self-modify:read", "self-modify:write", "self-modify:execute",
      "organization:read", "organization:write", "organization:admin",
      "workspace:read", "workspace:write", "workspace:admin",
      "team:read", "team:write", "team:admin",
      "user:read", "user:write", "user:admin",
      "audit:read", "audit:admin",
      "billing:read", "billing:write",
    ];
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUsers(organizationId?: string): User[] {
    let users = Array.from(this.users.values());
    if (organizationId) {
      users = users.filter(u => u.organizationId === organizationId);
    }
    return users;
  }

  hasPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    if (user.permissions.includes("*")) return true;
    return user.permissions.includes(permission);
  }

  // ==========================================================================
  // AUDIT ENGINE
  // ==========================================================================

  private logAudit(
    resource: string,
    action: string,
    resourceId: string,
    details: Record<string, unknown> = {}
  ) {
    const entry: AuditEntry = {
      id: `audit-${randomUUID().slice(0, 8)}`,
      organizationId: "devil-enterprise",
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date(),
    };
    this.auditLog.push(entry);
  }

  logAuditEntry(organizationId: string, userId: string, action: string, resource: string, resourceId?: string, details?: Record<string, unknown>) {
    const entry: AuditEntry = {
      id: `audit-${randomUUID().slice(0, 8)}`,
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      details: details || {},
      timestamp: new Date(),
    };
    this.auditLog.push(entry);
    return entry;
  }

  getAuditLog(organizationId: string, options?: { limit?: number; resource?: string }): AuditEntry[] {
    let entries = this.auditLog.filter(e => e.organizationId === organizationId);
    if (options?.resource) {
      entries = entries.filter(e => e.resource === options.resource);
    }
    return entries.slice(-(options?.limit || 100));
  }

  // ==========================================================================
  // GOVERNANCE LAYER
  // ==========================================================================

  createPolicy(organizationId: string, name: string, description: string, rules: Policy["rules"]): Policy {
    const id = `policy-${randomUUID().slice(0, 8)}`;

    const policy: Policy = {
      id,
      organizationId,
      name,
      description,
      rules,
      enforced: false,
      createdAt: new Date(),
    };

    this.policies.set(id, policy);
    this.logAudit("policy", "create", id, { organizationId, name });
    return policy;
  }

  getPolicies(organizationId: string): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.organizationId === organizationId);
  }

  enforcePolicy(policyId: string) {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enforced = true;
      this.logAudit("policy", "enforce", policyId, {});
    }
  }

  // ==========================================================================
  // RESOURCE MANAGEMENT
  // ==========================================================================

  trackResourceUsage(organizationId: string, period: string, usage: Partial<ResourceUsage>): ResourceUsage {
    let current = this.resourceUsage.get(`${organizationId}:${period}`);
    
    if (!current) {
      current = {
        organizationId,
        period,
        compute: { used: 0, limit: 10000, unit: "units" },
        storage: { used: 0, limit: 1000, unit: "GB" },
        agents: { used: 0, limit: 100 },
        simulations: { used: 0, limit: 500 },
        apiCalls: { used: 0, limit: 100000 },
        cost: 0,
      };
    }

    Object.assign(current, usage);
    this.resourceUsage.set(`${organizationId}:${period}`, current);
    return current;
  }

  getResourceUsage(organizationId: string, period: string): ResourceUsage | undefined {
    return this.resourceUsage.get(`${organizationId}:${period}`);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "enterprise",
      severity: "info",
      message,
      details: { engine: "enterprise_command_center" },
    });
  }

  getDashboard(organizationId: string): {
    organization: Organization | undefined;
    workspaces: Workspace[];
    teams: Team[];
    users: User[];
    recentAudits: AuditEntry[];
    resourceUsage: ResourceUsage | undefined;
    policies: Policy[];
  } {
    const organization = this.getOrganization(organizationId);
    return {
      organization,
      workspaces: this.getWorkspaces(organizationId),
      teams: this.getTeams(organizationId),
      users: this.getUsers(organizationId),
      recentAudits: this.getAuditLog(organizationId, { limit: 10 }),
      resourceUsage: this.getResourceUsage(organizationId, "current"),
      policies: this.getPolicies(organizationId),
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const enterpriseCenter = new EnterpriseCommandCenter();
