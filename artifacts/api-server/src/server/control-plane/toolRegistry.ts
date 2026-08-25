/**
 * DEVIL Control Plane - Tool Registry
 * 
 * Central authority controlling what DEVIL can and cannot do.
 * - Whitelist-only tool access
 * - Capability-based routing
 * - Versioned tools
 * - Permission-aware execution
 * - Mission-aware tool availability
 * - Approval integration
 */

import { db, toolsTable, toolExecutionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import type { PermissionLevel, ApprovalType } from "@workspace/db";
import { checkApproval } from "./approvalEngine";
import { logEvent } from "./eventLog";

// ============================================================================
// TOOL CAPABILITY TAGS
// ============================================================================

export const CAPABILITY_TAGS = {
  FILESYSTEM: "filesystem",
  NETWORK: "network",
  TERMINAL: "terminal",
  EXECUTION: "execution",
  DEPLOYMENT: "deployment",
  GITHUB: "github",
  DATABASE: "database",
  MEDIA: "media",
  PRIVILEGED: "privileged",
  SECURITY_SENSITIVE: "security_sensitive",
  CODE: "code",
  BROWSER: "browser",
  CONTAINER: "container",
} as const;

export type CapabilityTag = (typeof CAPABILITY_TAGS)[keyof typeof CAPABILITY_TAGS];

// ============================================================================
// TOOL CATEGORIES
// ============================================================================

export const TOOL_CATEGORIES = {
  FILE_OPERATIONS: "file_operations",
  TERMINAL: "terminal",
  BROWSER: "browser",
  CODE: "code",
  GIT: "git",
  GITHUB: "github",
  CONTAINER: "container",
  DEPLOYMENT: "deployment",
  MEDIA: "media",
  MCP: "mcp",
} as const;

// ============================================================================
// DEFAULT TOOL REGISTRY
// ============================================================================

export interface ToolDefinition {
  name: string;
  version: string;
  category: string;
  capabilities: CapabilityTag[];
  permissionLevel: PermissionLevel;
  approvalRequired: boolean;
  approvalType?: ApprovalType;
  timeout: number; // seconds
  retryLimit: number;
  resourceLimits?: {
    maxMemory?: string;
    maxCpu?: string;
    maxDuration?: number;
  };
  supportedMissions?: string[];
  validationRules?: string[];
  description: string;
}

// Default tools that are always available
export const DEFAULT_TOOLS: ToolDefinition[] = [
  // File Operations (SAFE)
  {
    name: "read_file",
    version: "v1",
    category: TOOL_CATEGORIES.FILE_OPERATIONS,
    capabilities: [CAPABILITY_TAGS.FILESYSTEM],
    permissionLevel: "safe",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 3,
    description: "Read file contents from the filesystem",
  },
  {
    name: "write_file",
    version: "v1",
    category: TOOL_CATEGORIES.FILE_OPERATIONS,
    capabilities: [CAPABILITY_TAGS.FILESYSTEM],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 60,
    retryLimit: 2,
    description: "Write content to a file",
  },
  {
    name: "edit_file",
    version: "v1",
    category: TOOL_CATEGORIES.FILE_OPERATIONS,
    capabilities: [CAPABILITY_TAGS.FILESYSTEM],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 60,
    retryLimit: 2,
    description: "Edit existing file content",
  },

  // Terminal Tools (PRIVILEGED)
  {
    name: "bash",
    version: "v1",
    category: TOOL_CATEGORIES.TERMINAL,
    capabilities: [CAPABILITY_TAGS.TERMINAL, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "privileged",
    approvalRequired: false, // Controlled by sandbox
    timeout: 300,
    retryLimit: 1,
    resourceLimits: { maxDuration: 300 },
    description: "Execute bash commands in sandbox",
  },
  {
    name: "shell",
    version: "v1",
    category: TOOL_CATEGORIES.TERMINAL,
    capabilities: [CAPABILITY_TAGS.TERMINAL, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "privileged",
    approvalRequired: false,
    timeout: 300,
    retryLimit: 1,
    description: "Execute shell commands",
  },

  // Browser Tools (STANDARD)
  {
    name: "browser_navigate",
    version: "v1",
    category: TOOL_CATEGORIES.BROWSER,
    capabilities: [CAPABILITY_TAGS.BROWSER, CAPABILITY_TAGS.NETWORK],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 60,
    retryLimit: 2,
    description: "Navigate to a URL in browser",
  },
  {
    name: "browser_get_content",
    version: "v1",
    category: TOOL_CATEGORIES.BROWSER,
    capabilities: [CAPABILITY_TAGS.BROWSER, CAPABILITY_TAGS.NETWORK],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 2,
    description: "Extract content from current page",
  },
  {
    name: "browser_click",
    version: "v1",
    category: TOOL_CATEGORIES.BROWSER,
    capabilities: [CAPABILITY_TAGS.BROWSER],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 2,
    description: "Click an element on the page",
  },

  // Code Tools (STANDARD)
  {
    name: "lint",
    version: "v1",
    category: TOOL_CATEGORIES.CODE,
    capabilities: [CAPABILITY_TAGS.CODE],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 120,
    retryLimit: 2,
    description: "Run code linting",
  },
  {
    name: "test",
    version: "v1",
    category: TOOL_CATEGORIES.CODE,
    capabilities: [CAPABILITY_TAGS.CODE, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 300,
    retryLimit: 2,
    description: "Run test suites",
  },
  {
    name: "build",
    version: "v1",
    category: TOOL_CATEGORIES.CODE,
    capabilities: [CAPABILITY_TAGS.CODE, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 600,
    retryLimit: 1,
    resourceLimits: { maxDuration: 600 },
    description: "Build the project",
  },
  {
    name: "format",
    version: "v1",
    category: TOOL_CATEGORIES.CODE,
    capabilities: [CAPABILITY_TAGS.CODE],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 60,
    retryLimit: 2,
    description: "Format code files",
  },

  // Git Tools (PRIVILEGED)
  {
    name: "git_clone",
    version: "v1",
    category: TOOL_CATEGORIES.GIT,
    capabilities: [CAPABILITY_TAGS.NETWORK],
    permissionLevel: "privileged",
    approvalRequired: false,
    timeout: 120,
    retryLimit: 2,
    description: "Clone a git repository",
  },
  {
    name: "git_branch",
    version: "v1",
    category: TOOL_CATEGORIES.GIT,
    capabilities: [CAPABILITY_TAGS.GIT],
    permissionLevel: "privileged",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 1,
    description: "Create or list branches",
  },

  // GitHub Read-Only (STANDARD)
  {
    name: "github_repo_read",
    version: "v1",
    category: TOOL_CATEGORIES.GITHUB,
    capabilities: [CAPABILITY_TAGS.GITHUB, CAPABILITY_TAGS.NETWORK],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 60,
    retryLimit: 2,
    description: "Read repository information (no writes)",
  },
  {
    name: "github_issue_read",
    version: "v1",
    category: TOOL_CATEGORIES.GITHUB,
    capabilities: [CAPABILITY_TAGS.GITHUB, CAPABILITY_TAGS.NETWORK],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 2,
    description: "Read GitHub issues",
  },
  {
    name: "github_pr_read",
    version: "v1",
    category: TOOL_CATEGORIES.GITHUB,
    capabilities: [CAPABILITY_TAGS.GITHUB, CAPABILITY_TAGS.NETWORK],
    permissionLevel: "standard",
    approvalRequired: false,
    timeout: 30,
    retryLimit: 2,
    description: "Read pull requests",
  },

  // GitHub Write (CRITICAL - REQUIRES APPROVAL)
  {
    name: "github_commit_push",
    version: "v1",
    category: TOOL_CATEGORIES.GITHUB,
    capabilities: [CAPABILITY_TAGS.GITHUB, CAPABILITY_TAGS.PRIVILEGED],
    permissionLevel: "critical",
    approvalRequired: true,
    approvalType: "github_write",
    timeout: 60,
    retryLimit: 1,
    description: "Push commits to repository",
  },
  {
    name: "github_pr_create",
    version: "v1",
    category: TOOL_CATEGORIES.GITHUB,
    capabilities: [CAPABILITY_TAGS.GITHUB, CAPABILITY_TAGS.PRIVILEGED],
    permissionLevel: "critical",
    approvalRequired: true,
    approvalType: "github_write",
    timeout: 60,
    retryLimit: 1,
    description: "Create pull requests",
  },

  // Container Tools (PRIVILEGED)
  {
    name: "docker_build",
    version: "v1",
    category: TOOL_CATEGORIES.CONTAINER,
    capabilities: [CAPABILITY_TAGS.CONTAINER, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "privileged",
    approvalRequired: false,
    timeout: 600,
    retryLimit: 1,
    resourceLimits: { maxDuration: 600 },
    description: "Build Docker images",
  },
  {
    name: "docker_run",
    version: "v1",
    category: TOOL_CATEGORIES.CONTAINER,
    capabilities: [CAPABILITY_TAGS.CONTAINER, CAPABILITY_TAGS.EXECUTION],
    permissionLevel: "privileged",
    approvalRequired: false,
    timeout: 300,
    retryLimit: 1,
    description: "Run Docker containers",
  },

  // Deployment Tools (CRITICAL - REQUIRES APPROVAL)
  {
    name: "vercel_deploy",
    version: "v1",
    category: TOOL_CATEGORIES.DEPLOYMENT,
    capabilities: [CAPABILITY_TAGS.DEPLOYMENT, CAPABILITY_TAGS.PRIVILEGED],
    permissionLevel: "critical",
    approvalRequired: true,
    approvalType: "deployment",
    timeout: 300,
    retryLimit: 1,
    description: "Deploy to Vercel",
  },
  {
    name: "railway_deploy",
    version: "v1",
    category: TOOL_CATEGORIES.DEPLOYMENT,
    capabilities: [CAPABILITY_TAGS.DEPLOYMENT, CAPABILITY_TAGS.PRIVILEGED],
    permissionLevel: "critical",
    approvalRequired: true,
    approvalType: "deployment",
    timeout: 300,
    retryLimit: 1,
    description: "Deploy to Railway",
  },

  // Media Tools (STANDARD - MAY NEED BUDGET APPROVAL)
  {
    name: "image_generation",
    version: "v1",
    category: TOOL_CATEGORIES.MEDIA,
    capabilities: [CAPABILITY_TAGS.MEDIA],
    permissionLevel: "standard",
    approvalRequired: true,
    approvalType: "paid_api",
    timeout: 120,
    retryLimit: 2,
    description: "Generate images using AI",
  },
];

// ============================================================================
// TOOL REGISTRY OPERATIONS
// ============================================================================

export async function initializeToolRegistry(): Promise<void> {
  // Initialize default tools in database if not present
  for (const tool of DEFAULT_TOOLS) {
    const existing = await db
      .select()
      .from(toolsTable)
      .where(and(eq(toolsTable.name, tool.name), eq(toolsTable.version, tool.version)));

    if (existing.length === 0) {
      await db.insert(toolsTable).values({
        id: `tool-${crypto.randomUUID()}`,
        name: tool.name,
        version: tool.version,
        category: tool.category,
        capabilities: tool.capabilities,
        permissionLevel: tool.permissionLevel,
        approvalRequired: tool.approvalRequired,
        approvalType: tool.approvalType,
        timeout: tool.timeout,
        retryLimit: tool.retryLimit,
        resourceLimits: tool.resourceLimits,
        supportedMissions: tool.supportedMissions,
        validationRules: tool.validationRules,
        description: tool.description,
      });
    }
  }
}

export async function getToolByName(name: string, version?: string): Promise<typeof toolsTable.$inferSelect | null> {
  const conditions = [eq(toolsTable.name, name)];
  if (version) {
    conditions.push(eq(toolsTable.version, version));
  }

  const [tool] = await db
    .select()
    .from(toolsTable)
    .where(and(...conditions));

  return tool ?? null;
}

export async function getToolsByCategory(category: string): Promise<typeof toolsTable.$inferSelect[]> {
  return db.select().from(toolsTable).where(eq(toolsTable.category, category));
}

export async function getToolsByCapability(capability: string): Promise<typeof toolsTable.$inferSelect[]> {
  // This would require JSON query - simplified for now
  const allTools = await db.select().from(toolsTable);
  return allTools.filter(t => t.capabilities?.includes(capability));
}

export async function getAllTools(): Promise<typeof toolsTable.$inferSelect[]> {
  return db.select().from(toolsTable);
}

export async function getEnabledTools(): Promise<typeof toolsTable.$inferSelect[]> {
  return db.select().from(toolsTable).where(eq(toolsTable.enabled, true));
}

// ============================================================================
// TOOL EXECUTION CHECKS
// ============================================================================

export interface ToolExecutionCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalId?: string;
  error?: string;
}

export async function checkToolExecution(
  toolName: string,
  missionId?: string
): Promise<ToolExecutionCheckResult> {
  const tool = await getToolByName(toolName);

  if (!tool) {
    return {
      allowed: false,
      error: `Tool "${toolName}" not found in registry`,
    };
  }

  if (!tool.enabled) {
    return {
      allowed: false,
      error: `Tool "${toolName}" is disabled`,
    };
  }

  if (tool.approvalRequired && missionId) {
    // Check for existing approval
    if (tool.approvalType) {
      const approvalCheck = await checkApproval(missionId, tool.approvalType);
      if (!approvalCheck.approved) {
        return {
          allowed: false,
          requiresApproval: true,
          approvalId: approvalCheck.approvalId,
          error: approvalCheck.reason,
        };
      }
    }
  }

  return { allowed: true, requiresApproval: false };
}

// ============================================================================
// TOOL EXECUTION LOGGING
// ============================================================================

export interface LogToolExecutionInput {
  toolId: string;
  missionId?: string;
  taskId?: string;
  status: "started" | "completed" | "failed" | "timeout";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export async function logToolExecution(input: LogToolExecutionInput): Promise<string> {
  const id = `texec-${crypto.randomUUID()}`;
  const now = new Date();

  const duration = input.startedAt && input.completedAt
    ? input.completedAt.getTime() - input.startedAt.getTime()
    : undefined;

  await db.insert(toolExecutionsTable).values({
    id,
    toolId: input.toolId,
    missionId: input.missionId ?? null,
    taskId: input.taskId ?? null,
    status: input.status,
    input: input.input ?? null,
    output: input.output ?? null,
    error: input.error ?? null,
    startedAt: input.startedAt ?? now,
    completedAt: input.completedAt ?? (input.status !== "started" ? now : null),
    duration,
  });

  // Log to event log
  await logEvent({
    missionId: input.missionId,
    taskId: input.taskId,
    eventType: `tool_${input.status === "timeout" ? "timeout" : input.status === "failed" ? "failed" : input.status === "completed" ? "completed" : "invoked"}` as any,
    severity: input.status === "failed" ? "error" : "info",
    message: `Tool execution ${input.status}: ${input.toolId}`,
    details: { toolId: input.toolId, status: input.status, duration, error: input.error },
    actor: "system",
  });

  return id;
}

// ============================================================================
// TOOL REGISTRY QUERIES
// ============================================================================

export interface ToolFilter {
  category?: string;
  capability?: CapabilityTag;
  permissionLevel?: PermissionLevel;
  approvalRequired?: boolean;
  enabled?: boolean;
}

export async function queryTools(filters: ToolFilter = {}): Promise<typeof toolsTable.$inferSelect[]> {
  let tools = await getAllTools();

  if (filters.category) {
    tools = tools.filter(t => t.category === filters.category);
  }
  if (filters.capability) {
    tools = tools.filter(t => t.capabilities?.includes(filters.capability!));
  }
  if (filters.permissionLevel) {
    tools = tools.filter(t => t.permissionLevel === filters.permissionLevel);
  }
  if (filters.approvalRequired !== undefined) {
    tools = tools.filter(t => t.approvalRequired === filters.approvalRequired);
  }
  if (filters.enabled !== undefined) {
    tools = tools.filter(t => t.enabled === filters.enabled);
  }

  return tools;
}

// ============================================================================
// TOOL CAPABILITY MATCHING
// ============================================================================

export function hasCapability(tool: typeof toolsTable.$inferSelect, capability: CapabilityTag): boolean {
  return tool.capabilities?.includes(capability) ?? false;
}

export function hasAllCapabilities(tool: typeof toolsTable.$inferSelect, capabilities: CapabilityTag[]): boolean {
  return capabilities.every(c => tool.capabilities?.includes(c) ?? false);
}

export function hasAnyCapability(tool: typeof toolsTable.$inferSelect, capabilities: CapabilityTag[]): boolean {
  return capabilities.some(c => tool.capabilities?.includes(c) ?? false);
}
