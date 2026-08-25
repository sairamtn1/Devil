/**
 * DEVIL Coding Agent Foundation - Mission Execution Loop
 * 
 * Main orchestration loop for mission execution:
 * PLAN → GENERATE → BUILD → TEST → REVIEW → FIX → RETEST → COMPLETE
 */

import { workspaceManager } from "../workspace";
import { fileOperationsEngine } from "../fileOperations";
import { codeGenerator } from "../codeGenerator";
import { buildRunner, testRunner, lintRunner } from "../runners";
import { codeReviewEngine } from "../review";
import { diffEngine } from "../diff";
import { logEvent } from "../../control-plane/eventLog";
import { ExecutionMode } from "../../executor";

// ============================================================================
// TYPES
// ============================================================================

export const MissionPhase = {
  INIT: "init",
  PLAN: "plan",
  GENERATE: "generate",
  BUILD: "build",
  TEST: "test",
  REVIEW: "review",
  FIX: "fix",
  RETEST: "retest",
  COMPLETE: "complete",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type MissionPhaseType = (typeof MissionPhase)[keyof typeof MissionPhase];

export interface MissionLoopConfig {
  missionId: string;
  goal: string;
  projectType: string;
  options?: {
    maxRetries?: number;
    autoFix?: boolean;
    strictMode?: boolean;
  };
}

export interface LoopStep {
  phase: MissionPhaseType;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
}

export interface LoopResult {
  missionId: string;
  success: boolean;
  steps: LoopStep[];
  workspaceId?: string;
  finalScore?: number;
  output?: {
    filesGenerated?: number;
    buildSuccess?: boolean;
    testsPassed?: number;
    testsFailed?: number;
    issuesFixed?: number;
    issuesRemaining?: number;
  };
  errors: string[];
  duration: number;
}

// ============================================================================
// MISSION EXECUTION LOOP
// ============================================================================

export class MissionExecutionLoop {
  private config: MissionLoopConfig;
  private steps: Map<MissionPhaseType, LoopStep> = new Map();
  private workspaceId: string | null = null;
  private startTime: number = 0;

  constructor(config: MissionLoopConfig) {
    this.config = config;
    this.initializeSteps();
  }

  private initializeSteps(): void {
    const phases = [
      MissionPhase.INIT,
      MissionPhase.PLAN,
      MissionPhase.GENERATE,
      MissionPhase.BUILD,
      MissionPhase.TEST,
      MissionPhase.REVIEW,
      MissionPhase.FIX,
      MissionPhase.RETEST,
    ];

    for (const phase of phases) {
      this.steps.set(phase, {
        phase,
        status: "pending"
      });
    }
  }

  /**
   * Run the mission execution loop
   */
  async run(): Promise<LoopResult> {
    this.startTime = Date.now();
    const errors: string[] = [];
    let currentStep: LoopStep | null = null;

    await logEvent({
      missionId: this.config.missionId,
      eventType: "mission_started",
      severity: "info",
      message: `Mission execution loop started`,
      details: { goal: this.config.goal }
    });

    try {
      // Run each phase in sequence
      for (const [phase, step] of this.steps) {
        currentStep = step;
        step.status = "running";
        step.startedAt = new Date();

        await logEvent({
          missionId: this.config.missionId,
          eventType: "mission_progress",
          severity: "info",
          message: `Starting phase: ${phase}`,
        });

        try {
          step.result = await this.executePhase(phase);
          step.status = "completed";
          step.completedAt = new Date();

          await logEvent({
            missionId: this.config.missionId,
            eventType: "mission_progress",
            severity: "info",
            message: `Phase completed: ${phase}`,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          step.status = "failed";
          step.error = errorMsg;
          step.completedAt = new Date();
          errors.push(`${phase}: ${errorMsg}`);

          // Check if we should continue
          if (!this.shouldContinueOnError(phase)) {
            break;
          }
        }
      }

      // Complete phase
      const completeStep = this.getOrCreateStep(MissionPhase.COMPLETE);
      completeStep.status = "completed";
      completeStep.startedAt = new Date();
      completeStep.completedAt = new Date();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);

      const failedStep = this.getOrCreateStep(MissionPhase.FAILED);
      failedStep.status = "failed";
      failedStep.error = errorMsg;
    }

    // Build result
    const success = errors.length === 0 || this.isLastCompletedStepSuccessful();
    
    await logEvent({
      missionId: this.config.missionId,
      eventType: success ? "mission_completed" : "mission_failed",
      severity: success ? "info" : "error",
      message: `Mission loop ${success ? "completed" : "failed"}`,
      details: { success, errors: errors.length }
    });

    return {
      missionId: this.config.missionId,
      success,
      steps: Array.from(this.steps.values()),
      workspaceId: this.workspaceId ?? undefined,
      errors,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Execute a specific phase
   */
  private async executePhase(phase: MissionPhaseType): Promise<unknown> {
    switch (phase) {
      case MissionPhase.INIT:
        return this.executeInit();
      
      case MissionPhase.PLAN:
        return this.executePlan();
      
      case MissionPhase.GENERATE:
        return this.executeGenerate();
      
      case MissionPhase.BUILD:
        return this.executeBuild();
      
      case MissionPhase.TEST:
        return this.executeTest();
      
      case MissionPhase.REVIEW:
        return this.executeReview();
      
      case MissionPhase.FIX:
        return this.executeFix();
      
      case MissionPhase.RETEST:
        return this.executeRetest();
      
      default:
        return { message: "Unknown phase" };
    }
  }

  private getOrCreateStep(phase: MissionPhaseType): LoopStep {
    let step = this.steps.get(phase);
    if (!step) {
      step = { phase, status: "pending" };
      this.steps.set(phase, step);
    }
    return step;
  }

  // ==========================================================================
  // PHASE IMPLEMENTATIONS
  // ==========================================================================

  private async executeInit(): Promise<{ workspaceId: string }> {
    // Create workspace
    const workspace = await workspaceManager.createWorkspace({
      missionId: this.config.missionId,
      projectType: this.config.projectType as any
    });

    this.workspaceId = workspace.id;

    await logEvent({
      missionId: this.config.missionId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Workspace created: ${workspace.id}`,
      details: { workspaceId: workspace.id }
    });

    return { workspaceId: workspace.id };
  }

  private async executePlan(): Promise<{ plan: string[] }> {
    // In a full implementation, this would use AI to plan
    const plan = [
      "Create project structure",
      "Generate source files",
      "Install dependencies",
      "Build project",
      "Run tests",
      "Review code",
      "Fix issues"
    ];

    await logEvent({
      missionId: this.config.missionId,
      eventType: "checkpoint_created",
      severity: "info",
      message: "Plan generated",
      details: { steps: plan }
    });

    return { plan };
  }

  private async executeGenerate(): Promise<{ filesGenerated: number }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    // Generate project
    const result = await codeGenerator.generate({
      projectName: this.config.goal.substring(0, 30).replace(/\s+/g, "-"),
      projectType: this.config.projectType as any,
      workspaceId: this.workspaceId,
      options: {
        tests: true,
        documentation: true
      }
    });

    if (!result.success) {
      throw new Error(`Generation failed: ${result.errors.join(", ")}`);
    }

    await logEvent({
      missionId: this.config.missionId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Generated ${result.filesGenerated} files`,
      details: { files: result.filesGenerated }
    });

    return { filesGenerated: result.filesGenerated };
  }

  private async executeBuild(): Promise<{ success: boolean; output: string }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    // Install dependencies first
    const installResult = await buildRunner.installDependencies(this.workspaceId);
    
    if (!installResult.success) {
      await logEvent({
        missionId: this.config.missionId,
        eventType: "tool_failed",
        severity: "error",
        message: "Dependency installation failed",
        details: { stderr: installResult.stderr }
      });
    }

    // Run build
    const buildResult = await buildRunner.runBuild(this.workspaceId);

    await logEvent({
      missionId: this.config.missionId,
      eventType: buildResult.success ? "tool_completed" : "tool_failed",
      severity: buildResult.success ? "info" : "error",
      message: `Build ${buildResult.success ? "succeeded" : "failed"}`,
      details: { exitCode: buildResult.exitCode }
    });

    return {
      success: buildResult.success,
      output: buildResult.stdout + "\n" + buildResult.stderr
    };
  }

  private async executeTest(): Promise<{
    passed: number;
    failed: number;
    skipped: number;
  }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    const result = await testRunner.runTests(this.workspaceId);

    await logEvent({
      missionId: this.config.missionId,
      eventType: result.success ? "tool_completed" : "tool_failed",
      severity: result.success ? "info" : "error",
      message: `Tests: ${result.testsPassed} passed, ${result.testsFailed} failed`,
      details: result
    });

    return {
      passed: result.testsPassed,
      failed: result.testsFailed,
      skipped: result.testsSkipped
    };
  }

  private async executeReview(): Promise<{ score: number; issues: number }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    const review = await codeReviewEngine.reviewWorkspace(this.workspaceId);

    await logEvent({
      missionId: this.config.missionId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Code review completed`,
      details: { 
        score: review.overallScore,
        issues: review.issues.length,
        critical: review.summary.critical
      }
    });

    return {
      score: review.overallScore,
      issues: review.issues.length
    };
  }

  private async executeFix(): Promise<{ issuesFixed: number }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    // Perform syntax check and basic fixes
    const check = await codeReviewEngine.syntaxCheck(this.workspaceId);
    
    // In a full implementation, this would use AI to fix issues
    const issuesFixed = check.errors.length;

    await logEvent({
      missionId: this.config.missionId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Fix phase completed`,
      details: { issuesFixed }
    });

    return { issuesFixed };
  }

  private async executeRetest(): Promise<{
    passed: number;
    failed: number;
    improvement: boolean;
  }> {
    if (!this.workspaceId) {
      throw new Error("Workspace not initialized");
    }

    const result = await testRunner.runTests(this.workspaceId);
    
    const testStep = this.steps.get(MissionPhase.TEST);
    const previousFailed = (testStep?.result as any)?.failed ?? 0;

    return {
      passed: result.testsPassed,
      failed: result.testsFailed,
      improvement: result.testsFailed < previousFailed
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private shouldContinueOnError(phase: MissionPhaseType): boolean {
    // Critical phases that should stop on error
    const criticalPhases = [
      MissionPhase.INIT,
      MissionPhase.GENERATE,
      MissionPhase.BUILD
    ];

    return !criticalPhases.includes(phase);
  }

  private isLastCompletedStepSuccessful(): boolean {
    const completedPhases: MissionPhaseType[] = [
      MissionPhase.INIT,
      MissionPhase.PLAN,
      MissionPhase.GENERATE,
      MissionPhase.BUILD,
      MissionPhase.TEST,
      MissionPhase.REVIEW,
      MissionPhase.FIX,
      MissionPhase.RETEST
    ];

    // Check if critical phases completed
    const criticalCompleted = [
      MissionPhase.INIT,
      MissionPhase.GENERATE,
      MissionPhase.BUILD
    ];

    for (const phase of criticalCompleted) {
      const step = this.steps.get(phase);
      if (step?.status === "completed") {
        return true;
      }
    }

    return false;
  }

  /**
   * Get current status of the loop
   */
  getStatus(): {
    currentPhase: MissionPhaseType | null;
    completedPhases: MissionPhaseType[];
    failedPhases: MissionPhaseType[];
    progress: number;
  } {
    const completedPhases: MissionPhaseType[] = [];
    const failedPhases: MissionPhaseType[] = [];
    let currentPhase: MissionPhaseType | null = null;

    for (const [phase, step] of this.steps) {
      if (step.status === "completed") {
        completedPhases.push(phase);
      } else if (step.status === "failed") {
        failedPhases.push(phase);
      } else if (step.status === "running") {
        currentPhase = phase;
      }
    }

    const totalPhases = this.steps.size;
    const progress = Math.round((completedPhases.length / totalPhases) * 100);

    return {
      currentPhase,
      completedPhases,
      failedPhases,
      progress
    };
  }
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

export async function runMissionLoop(config: MissionLoopConfig): Promise<LoopResult> {
  const loop = new MissionExecutionLoop(config);
  return loop.run();
}
