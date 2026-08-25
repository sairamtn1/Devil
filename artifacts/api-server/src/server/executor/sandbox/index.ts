/**
 * DEVIL Executor Foundation - Sandbox Framework
 * 
 * Provides isolated execution environments for safe code execution.
 * - Resource limits
 * - Timeouts
 * - Filesystem isolation
 * - Controlled networking
 */

import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// SANDBOX TYPES
// ============================================================================

export const SandboxType = {
  LOCAL: "local",
  DOCKER: "docker",
} as const;

export type SandboxTypeType = (typeof SandboxType)[keyof typeof SandboxType];

export interface ResourceLimits {
  maxMemory?: string;       // e.g., "512MB", "1GB"
  maxCpu?: string;          // e.g., "0.5", "2"
  maxDuration?: number;     // seconds
  maxDisk?: string;         // e.g., "1GB"
  maxNetworkBandwidth?: string;
  allowNetwork?: boolean;
  allowFilesystem?: boolean;
  allowedPaths?: string[];  // Whitelist of allowed paths
  blockedPaths?: string[];  // Blacklist of blocked paths
}

export interface SandboxSession {
  id: string;
  type: SandboxTypeType;
  status: "creating" | "ready" | "running" | "stopped" | "error";
  workspacePath: string;
  createdAt: Date;
  startedAt: Date | null;
  stoppedAt: Date | null;
  resourceLimits: ResourceLimits;
  metadata: Record<string, unknown>;
}

export interface SandboxExecution {
  id: string;
  sessionId: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;         // ms
  status: "pending" | "running" | "completed" | "failed" | "timeout";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null;
}

// ============================================================================
// SANDBOX EXCEPTIONS
// ============================================================================

export class SandboxError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string
  ) {
    super(message);
    this.name = "SandboxError";
  }
}

export class SandboxTimeoutError extends SandboxError {
  constructor(message: string, sessionId?: string) {
    super(message, "TIMEOUT", sessionId);
    this.name = "SandboxTimeoutError";
  }
}

export class SandboxResourceError extends SandboxError {
  constructor(message: string, sessionId?: string) {
    super(message, "RESOURCE_LIMIT", sessionId);
    this.name = "SandboxResourceError";
  }
}

// ============================================================================
// SANDBOX PROVIDER INTERFACE
// ============================================================================

export interface SandboxProvider {
  type: SandboxTypeType;
  
  // Session management
  createSession(limits?: ResourceLimits): Promise<SandboxSession>;
  getSession(sessionId: string): Promise<SandboxSession | null>;
  destroySession(sessionId: string): Promise<void>;
  
  // Execution
  execute(
    sessionId: string,
    command: string,
    args?: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<SandboxExecution>;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<boolean>;
}

// ============================================================================
// LOCAL SANDBOX PROVIDER
// ============================================================================

export class LocalSandboxProvider implements SandboxProvider {
  readonly type = SandboxType.LOCAL;
  private sessions: Map<string, SandboxSession> = new Map();
  private executions: Map<string, SandboxExecution> = new Map();
  private tempDir: string;

  constructor(tempDir: string = "/tmp/devil-sandbox") {
    this.tempDir = tempDir;
  }

  async start(): Promise<void> {
    // Ensure temp directory exists
    const fs = await import("fs");
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async stop(): Promise<void> {
    // Destroy all sessions
    for (const sessionId of this.sessions.keys()) {
      await this.destroySession(sessionId);
    }
  }

  async health(): Promise<boolean> {
    try {
      const fs = await import("fs");
      return fs.existsSync(this.tempDir);
    } catch {
      return false;
    }
  }

  async createSession(limits: ResourceLimits = {}): Promise<SandboxSession> {
    const sessionId = `session-${crypto.randomUUID()}`;
    const workspacePath = `${this.tempDir}/${sessionId}`;

    // Create workspace directory
    const fs = await import("fs");
    fs.mkdirSync(workspacePath, { recursive: true });

    const session: SandboxSession = {
      id: sessionId,
      type: this.type,
      status: "ready",
      workspacePath,
      createdAt: new Date(),
      startedAt: null,
      stoppedAt: null,
      resourceLimits: {
        maxDuration: 300, // 5 minutes default
        allowNetwork: false,
        allowFilesystem: true,
        ...limits,
      },
      metadata: {},
    };

    this.sessions.set(sessionId, session);
    
    await logEvent({
      eventType: "tool_invoked",
      severity: "info",
      message: `Sandbox session created: ${sessionId}`,
      details: { sessionId, type: this.type },
    });

    return session;
  }

  async getSession(sessionId: string): Promise<SandboxSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      try {
        const fs = await import("fs");
        const { rimraf } = await import("rimraf");
        
        // Only delete if inside temp directory for safety
        if (session.workspacePath.startsWith(this.tempDir)) {
          await rimraf(session.workspacePath);
        }
        
        session.status = "stopped";
        session.stoppedAt = new Date();
        
        await logEvent({
          eventType: "tool_completed",
          severity: "info",
          message: `Sandbox session destroyed: ${sessionId}`,
          details: { sessionId },
        });
      } catch (error) {
        console.error(`Failed to destroy session ${sessionId}:`, error);
      }
      
      this.sessions.delete(sessionId);
    }
  }

  async execute(
    sessionId: string,
    command: string,
    args: string[] = [],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<SandboxExecution> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new SandboxError(`Session not found: ${sessionId}`, "SESSION_NOT_FOUND");
    }

    if (session.status !== "ready") {
      throw new SandboxError(`Session not ready: ${sessionId}`, "SESSION_NOT_READY", sessionId);
    }

    const executionId = `exec-${crypto.randomUUID()}`;
    const cwd = options.cwd ?? session.workspacePath;
    const timeout = options.timeout ?? session.resourceLimits.maxDuration! * 1000;

    const execution: SandboxExecution = {
      id: executionId,
      sessionId,
      command,
      args,
      cwd,
      env: options.env,
      timeout,
      status: "pending",
      exitCode: null,
      stdout: "",
      stderr: "",
      startedAt: null,
      completedAt: null,
      duration: null,
    };

    this.executions.set(executionId, execution);
    session.status = "running";
    session.startedAt = session.startedAt ?? new Date();

    // Execute command (simplified - in production use actual sandboxing)
    return this.runExecution(execution);
  }

  private async runExecution(execution: SandboxExecution): Promise<SandboxExecution> {
    const { spawn } = await import("child_process");
    
    execution.status = "running";
    execution.startedAt = new Date();

    const startTime = Date.now();

    return new Promise((resolve) => {
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const shellArgs = isWindows ? ["/c", execution.command, ...(execution.args ?? [])] : ["-c", `${execution.command} ${(execution.args ?? []).join(" ")}`];
      
      const proc = spawn(shell, shellArgs, {
        cwd: execution.cwd,
        env: { ...process.env, ...execution.env },
        timeout: execution.timeout,
        stdio: ["ignore", "pipe", "pipe"],
      });

      proc.stdout?.on("data", (data: Buffer) => {
        execution.stdout += data.toString();
      });

      proc.stderr?.on("data", (data: Buffer) => {
        execution.stderr += data.toString();
      });

      proc.on("error", (error) => {
        execution.status = "failed";
        execution.exitCode = -1;
        execution.stderr += `\nError: ${error.message}`;
      });

      proc.on("close", (code) => {
        execution.exitCode = code ?? 0;
        execution.completedAt = new Date();
        execution.duration = Date.now() - startTime;
        execution.status = execution.exitCode === 0 ? "completed" : "failed";
        
        // Update session status
        const session = this.sessions.get(execution.sessionId);
        if (session) {
          session.status = "ready";
        }

        resolve(execution);
      });

      // Timeout handling
      setTimeout(() => {
        if (execution.status === "running") {
          proc.kill("SIGTERM");
          execution.status = "timeout";
          execution.stderr += "\nExecution timed out";
          
          const session = this.sessions.get(execution.sessionId);
          if (session) {
            session.status = "ready";
          }
          
          resolve(execution);
        }
      }, execution.timeout);
    });
  }
}

// ============================================================================
// SANDBOX MANAGER
// ============================================================================

export class SandboxManager {
  private provider: SandboxProvider;
  private sessions: Map<string, SandboxSession> = new Map();

  constructor(provider?: SandboxProvider) {
    this.provider = provider ?? new LocalSandboxProvider();
  }

  async initialize(): Promise<void> {
    await this.provider.start();
  }

  async shutdown(): Promise<void> {
    await this.provider.stop();
  }

  async health(): Promise<boolean> {
    return this.provider.health();
  }

  async createSession(limits?: ResourceLimits): Promise<SandboxSession> {
    const session = await this.provider.createSession(limits);
    this.sessions.set(session.id, session);
    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.provider.destroySession(sessionId);
    this.sessions.delete(sessionId);
  }

  async execute(
    sessionId: string,
    command: string,
    args?: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<SandboxExecution> {
    return this.provider.execute(sessionId, command, args, options);
  }

  async executeFile(
    sessionId: string,
    filePath: string,
    options?: {
      args?: string[];
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<SandboxExecution> {
    const ext = filePath.split(".").pop()?.toLowerCase();
    let command: string;

    switch (ext) {
      case "js":
      case "mjs":
        command = `node "${filePath}"`;
        break;
      case "ts":
        command = `npx ts-node "${filePath}"`;
        break;
      case "py":
        command = `python3 "${filePath}"`;
        break;
      case "sh":
        command = `bash "${filePath}"`;
        break;
      default:
        command = `"${filePath}"`;
    }

    return this.execute(sessionId, command, options?.args, {
      cwd: options?.cwd,
      env: options?.env,
      timeout: options?.timeout,
    });
  }

  getSession(sessionId: string): SandboxSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): SandboxSession[] {
    return Array.from(this.sessions.values());
  }
}

// ============================================================================
// DEFAULT SANDBOX MANAGER INSTANCE
// ============================================================================

export const defaultSandboxManager = new SandboxManager();

// ============================================================================
// TOOL EXECUTION HELPERS
// ============================================================================

export interface ToolExecutionContext {
  sessionId: string;
  missionId: string;
  taskId?: string;
  sandboxManager: SandboxManager;
}

export async function executeInSandbox(
  context: ToolExecutionContext,
  toolName: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const { sessionId, missionId, taskId, sandboxManager } = context;

  try {
    // Log tool invocation
    await logEvent({
      missionId,
      taskId,
      eventType: "tool_invoked",
      severity: "info",
      message: `Executing tool: ${toolName}`,
      details: { toolName, params },
    });

    // Get session
    const session = sandboxManager.getSession(sessionId);
    if (!session) {
      throw new SandboxError("Session not found", "SESSION_NOT_FOUND", sessionId);
    }

    // Build command based on tool
    let command: string;
    let args: string[] = [];

    switch (toolName) {
      case "read_file":
        command = `cat "${params.path}"`;
        break;
      case "write_file":
        // For write, we use a heredoc approach
        const content = typeof params.content === "string" 
          ? params.content.replace(/"/g, '\\"').replace(/\n/g, "\\n") 
          : JSON.stringify(params.content);
        command = `echo "${content}" > "${params.path}"`;
        break;
      case "list_files":
        command = `ls -la "${params.path ?? "."}"`;
        break;
      case "run_npm":
        command = `npm ${params.command ?? "install"}`;
        if (params.args) {
          args = params.args as string[];
        }
        break;
      case "run_pnpm":
        command = `pnpm ${params.command ?? "install"}`;
        if (params.args) {
          args = params.args as string[];
        }
        break;
      case "run_tests":
        command = params.command ? `${params.command}` : "npm test";
        break;
      case "run_build":
        command = params.command ? `${params.command}` : "npm run build";
        break;
      default:
        // Generic command
        command = params.command as string;
        if (params.args) {
          args = params.args as string[];
        }
    }

    // Execute in sandbox
    const result = await sandboxManager.execute(
      sessionId,
      command,
      args,
      { timeout: (params.timeout as number) ?? 60000 }
    );

    // Log result
    await logEvent({
      missionId,
      taskId,
      eventType: result.status === "completed" ? "tool_completed" : "tool_failed",
      severity: result.status === "completed" ? "info" : "error",
      message: `Tool ${toolName} ${result.status}`,
      details: {
        toolName,
        status: result.status,
        exitCode: result.exitCode,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length,
      },
    });

    if (result.status === "completed" || result.status === "failed") {
      return {
        success: result.status === "completed",
        output: { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode },
        error: result.status === "failed" ? result.stderr : undefined,
      };
    }

    return {
      success: false,
      error: `Execution ${result.status}: ${result.stderr}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    await logEvent({
      missionId,
      taskId,
      eventType: "tool_failed",
      severity: "error",
      message: `Tool ${toolName} failed: ${message}`,
      details: { toolName, error: message },
    });

    return {
      success: false,
      error: message,
    };
  }
}
