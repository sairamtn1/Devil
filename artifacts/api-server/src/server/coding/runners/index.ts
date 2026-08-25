/**
 * DEVIL Coding Agent Foundation - Build & Test Runners
 * 
 * Executes build, test, and lint commands in workspaces.
 * - npm/pnpm/yarn build
 * - npm/pnpm/jest/vitest tests
 * - ESLint/TypeScript checks
 */

import { workspaceManager } from "../workspace";
import { logEvent } from "../../control-plane/eventLog";
import { spawn } from "child_process";
import { join } from "path";

// ============================================================================
// TYPES
// ============================================================================

export interface RunnerResult {
  success: boolean;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timestamp: Date;
}

export interface BuildResult extends RunnerResult {
  buildWarnings: string[];
  outputPath?: string;
}

export interface TestResult extends RunnerResult {
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  coverage?: {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
  };
  failedTests?: TestFailure[];
}

export interface TestFailure {
  name: string;
  message: string;
  stack?: string;
}

export interface LintResult extends RunnerResult {
  issues: LintIssue[];
  errorCount: number;
  warningCount: number;
}

export interface LintIssue {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  message: string;
  rule?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function parsePackageManager(command: string): { manager: string; subcommand: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  const manager = parts[0]; // npm, pnpm, yarn, npx
  const subcommand = parts[1] || "";
  const args = parts.slice(2);
  
  return { manager, subcommand, args };
}

function calculateDuration(startTime: number): number {
  return Date.now() - startTime;
}

function parseCoverage(output: string): TestResult["coverage"] {
  const coverage: TestResult["coverage"] = {};
  
  // Parse coverage percentages from output
  const coverageMatch = output.match(/All files[^]*?\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
  if (coverageMatch) {
    coverage.statements = parseFloat(coverageMatch[1]);
    coverage.branches = parseFloat(coverageMatch[2]);
    coverage.functions = parseFloat(coverageMatch[3]);
    coverage.lines = parseFloat(coverageMatch[4]);
  }
  
  return coverage;
}

function parseTestResults(output: string): { passed: number; failed: number; skipped: number; failures: TestFailure[] } {
  const result = { passed: 0, failed: 0, skipped: 0, failures: [] as TestFailure[] };
  
  // Parse test counts
  const passedMatch = output.match(/Tests:\s+(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  const skippedMatch = output.match(/(\d+)\s+skipped/);
  
  if (passedMatch) result.passed = parseInt(passedMatch[1]);
  if (failedMatch) result.failed = parseInt(failedMatch[1]);
  if (skippedMatch) result.skipped = parseInt(skippedMatch[1]);
  
  // Parse failure details
  const failBlocks = output.split(/FAIL |PASS /);
  for (const block of failBlocks) {
    if (block.includes("FAIL")) {
      const lines = block.trim().split("\n");
      for (const line of lines) {
        if (line.includes("✕") || line.includes("×")) {
          const testName = line.replace(/[✕×]\s*/, "").trim();
          result.failures.push({
            name: testName,
            message: "Test failed"
          });
        }
      }
    }
  }
  
  return result;
}

function parseLintResults(output: string): { issues: LintIssue[]; errors: number; warnings: number } {
  const issues: LintIssue[] = [];
  let errors = 0;
  let warnings = 0;
  
  // Parse ESLint-style output
  const lines = output.split("\n");
  for (const line of lines) {
    // Match pattern: file:line:column: severity: message (rule)
    const match = line.match(/^(.+?):(\d+):(\d+):\s+(error|warning)\s+(.+?)(?:\s+\((.+?)\))?$/);
    if (match) {
      const [, file, lineNum, col, severity, message, rule] = match;
      issues.push({
        file,
        line: parseInt(lineNum),
        column: parseInt(col),
        severity: severity as "error" | "warning",
        message: message.trim(),
        rule
      });
      
      if (severity === "error") errors++;
      else warnings++;
    }
  }
  
  return { issues, errors, warnings };
}

// ============================================================================
// BUILD RUNNER
// ============================================================================

export class BuildRunner {
  /**
   * Run build command in workspace
   */
  async runBuild(
    workspaceId: string,
    command: string = "npm run build",
    cwd?: string
  ): Promise<BuildResult> {
    const workspace = await workspaceManager.getWorkspace(workspaceId);
    if (!workspace) {
      return {
        success: false,
        command,
        exitCode: -1,
        stdout: "",
        stderr: "Workspace not found",
        duration: 0,
        timestamp: new Date(),
        buildWarnings: []
      };
    }

    const startTime = Date.now();
    const workingDir = cwd ?? workspace.rootPath;
    
    const { manager, subcommand, args } = parsePackageManager(command);
    
    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "tool_invoked",
      severity: "info",
      message: `Running build: ${command}`,
      details: { workspaceId, command, workingDir }
    });

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      
      // Determine actual command based on package manager
      let cmd: string;
      let cmdArgs: string[];
      
      switch (manager) {
        case "pnpm":
          cmd = "pnpm";
          cmdArgs = [subcommand, ...args];
          break;
        case "yarn":
          cmd = "yarn";
          cmdArgs = [subcommand, ...args];
          break;
        case "npx":
          cmd = "npx";
          cmdArgs = [subcommand, ...args];
          break;
        case "npm":
        default:
          cmd = "npm";
          cmdArgs = subcommand === "run" ? args : [subcommand, ...args];
      }

      const proc = spawn(cmd, cmdArgs, {
        cwd: workingDir,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" }
      });

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (error) => {
        stderr += `\nSpawn error: ${error.message}`;
      });

      proc.on("close", async (code) => {
        const exitCode = code ?? 0;
        const duration = calculateDuration(startTime);
        const success = exitCode === 0;
        
        // Extract warnings
        const warnings: string[] = [];
        const warningMatches = stdout.match(/warning.*/gi);
        if (warningMatches) {
          warnings.push(...warningMatches.slice(0, 10));
        }

        await logEvent({
          missionId: workspace.missionId ?? undefined,
          eventType: success ? "tool_completed" : "tool_failed",
          severity: success ? "info" : "error",
          message: `Build ${success ? "succeeded" : "failed"}: ${command}`,
          details: { workspaceId, exitCode, duration }
        });

        resolve({
          success,
          command,
          exitCode,
          stdout: stdout.slice(-50000), // Limit output size
          stderr: stderr.slice(-10000),
          duration,
          timestamp: new Date(),
          buildWarnings: warnings
        });
      });
    });
  }

  /**
   * Install dependencies
   */
  async installDependencies(workspaceId: string, manager: "npm" | "pnpm" | "yarn" = "npm"): Promise<BuildResult> {
    return this.runBuild(workspaceId, `${manager} install`);
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

export class TestRunner {
  /**
   * Run tests in workspace
   */
  async runTests(
    workspaceId: string,
    options?: {
      command?: string;
      testPath?: string;
      coverage?: boolean;
      watch?: boolean;
    }
  ): Promise<TestResult> {
    const workspace = await workspaceManager.getWorkspace(workspaceId);
    if (!workspace) {
      return {
        success: false,
        command: "npm test",
        exitCode: -1,
        stdout: "",
        stderr: "Workspace not found",
        duration: 0,
        timestamp: new Date(),
        testsPassed: 0,
        testsFailed: 0,
        testsSkipped: 0
      };
    }

    const startTime = Date.now();
    const command = options?.command ?? this.detectTestCommand(workspace);
    
    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "tool_invoked",
      severity: "info",
      message: `Running tests: ${command}`,
      details: { workspaceId, command }
    });

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      
      const { manager, subcommand, args } = parsePackageManager(command);
      
      let cmd: string;
      let cmdArgs: string[];
      
      switch (manager) {
        case "pnpm":
          cmd = "pnpm";
          cmdArgs = [subcommand, ...args];
          break;
        case "yarn":
          cmd = "yarn";
          cmdArgs = [subcommand, ...args];
          break;
        case "npx":
          cmd = "npx";
          cmdArgs = [subcommand, ...args];
          break;
        default:
          cmd = "npm";
          cmdArgs = subcommand === "run" ? args : [subcommand, ...args];
      }

      const proc = spawn(cmd, cmdArgs, {
        cwd: workspace.rootPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" }
      });

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (error) => {
        stderr += `\nSpawn error: ${error.message}`;
      });

      proc.on("close", async (code) => {
        const exitCode = code ?? 0;
        const duration = calculateDuration(startTime);
        const success = exitCode === 0;
        
        // Parse test results
        const testStats = parseTestResults(stdout);
        const coverage = parseCoverage(stdout);

        await logEvent({
          missionId: workspace.missionId ?? undefined,
          eventType: success ? "tool_completed" : "tool_failed",
          severity: success ? "info" : "error",
          message: `Tests ${success ? "passed" : "failed"}`,
          details: { 
            workspaceId, 
            exitCode, 
            passed: testStats.passed,
            failed: testStats.failed,
            skipped: testStats.skipped,
            duration 
          }
        });

        resolve({
          success,
          command,
          exitCode,
          stdout: stdout.slice(-50000),
          stderr: stderr.slice(-10000),
          duration,
          timestamp: new Date(),
          testsPassed: testStats.passed,
          testsFailed: testStats.failed,
          testsSkipped: testStats.skipped,
          coverage,
          failedTests: testStats.failures
        });
      });
    });
  }

  /**
   * Detect appropriate test command based on workspace files
   */
  private detectTestCommand(workspace: { rootPath: string }): string {
    // Check for test framework configuration files
    // This is a simplified detection - in production would check actual files
    return "npm test";
  }
}

// ============================================================================
// LINT RUNNER
// ============================================================================

export class LintRunner {
  /**
   * Run linter in workspace
   */
  async runLint(
    workspaceId: string,
    options?: {
      linter?: "eslint" | "typescript" | "biome";
      fix?: boolean;
      files?: string[];
    }
  ): Promise<LintResult> {
    const workspace = await workspaceManager.getWorkspace(workspaceId);
    if (!workspace) {
      return {
        success: false,
        command: "npm run lint",
        exitCode: -1,
        stdout: "",
        stderr: "Workspace not found",
        duration: 0,
        timestamp: new Date(),
        issues: [],
        errorCount: 0,
        warningCount: 0
      };
    }

    const startTime = Date.now();
    const linter = options?.linter ?? "eslint";
    const fix = options?.fix ?? false;
    const files = options?.files ?? ["src"];

    let command: string;
    switch (linter) {
      case "typescript":
        command = `npx tsc --noEmit`;
        break;
      case "biome":
        command = fix 
          ? `npx biome check --write ${files.join(" ")}`
          : `npx biome check ${files.join(" ")}`;
        break;
      case "eslint":
      default:
        command = fix
          ? `npm run lint -- --fix`
          : `npm run lint`;
    }

    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "tool_invoked",
      severity: "info",
      message: `Running linter: ${linter}`,
      details: { workspaceId, command }
    });

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      
      const proc = spawn(command, [], {
        cwd: workspace.rootPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" }
      });

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (error) => {
        stderr += `\nSpawn error: ${error.message}`;
      });

      proc.on("close", async (code) => {
        const exitCode = code ?? 0;
        const duration = calculateDuration(startTime);
        const success = exitCode === 0;
        
        // Parse lint results
        const { issues, errors, warnings } = parseLintResults(stdout + stderr);

        await logEvent({
          missionId: workspace.missionId ?? undefined,
          eventType: success ? "tool_completed" : "tool_failed",
          severity: success ? "info" : "warning",
          message: `Lint ${success ? "passed" : "completed with issues"}`,
          details: { 
            workspaceId, 
            errors,
            warnings,
            duration 
          }
        });

        resolve({
          success,
          command,
          exitCode,
          stdout: stdout.slice(-50000),
          stderr: stderr.slice(-10000),
          duration,
          timestamp: new Date(),
          issues,
          errorCount: errors,
          warningCount: warnings
        });
      });
    });
  }

  /**
   * Check TypeScript compilation
   */
  async checkTypeScript(workspaceId: string): Promise<LintResult> {
    return this.runLint(workspaceId, { linter: "typescript" });
  }
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

export const buildRunner = new BuildRunner();
export const testRunner = new TestRunner();
export const lintRunner = new LintRunner();
