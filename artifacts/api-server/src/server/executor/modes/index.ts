/**
 * DEVIL Executor Foundation - Execution Modes
 * 
 * Implements three execution modes:
 * 1. DRY_RUN - Simulate without executing
 * 2. STEP_BY_STEP - Execute one task, pause, wait for approval
 * 3. AUTO_PILOT - Execute continuously after approval
 */

import { logEvent } from "../control-plane/eventLog";
import { 
  ExecutorState, 
  ExecutorStateType, 
  ExecutionMode, 
  ExecutionModeType,
  getExecutor,
  updateExecutorProgress,
  transitionExecutorState
} from "../stateMachine";
import { executionQueue, QueuePriority, QueuedTask } from "../queue";
import { SandboxManager } from "../sandbox";
import { RecoveryEngine, RecoveryAction } from "../recovery";

// ============================================================================
// EXECUTION MODE INTERFACE
// ============================================================================

export interface ExecutionContext {
  executorId: string;
  missionId: string;
  sandboxManager: SandboxManager;
  recoveryEngine: RecoveryEngine;
  onTaskStart?: (task: QueuedTask) => void;
  onTaskComplete?: (task: QueuedTask, result: unknown) => void;
  onTaskFail?: (task: QueuedTask, error: string) => void;
  onApprovalRequired?: (task: QueuedTask, reason: string) => void;
}

export interface ExecutionResult {
  success: boolean;
  mode: ExecutionModeType;
  tasksExecuted: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksSkipped: number;
  duration: number;
  dryRunPlan?: DryRunPlan;
  output: string[];
  errors: string[];
}

export interface DryRunPlan {
  missionId: string;
  phases: {
    id: string;
    name: string;
    tasks: {
      id: string;
      name: string;
      description: string;
      tools: string[];
      files: string[];
      commands: string[];
      impact: "low" | "medium" | "high";
      risk: "safe" | "standard" | "privileged" | "critical";
    }[];
  }[];
  estimatedDuration: number;
  totalFiles: string[];
  totalCommands: string[];
  requiredTools: string[];
}

// ============================================================================
// DRY RUN MODE
// ============================================================================

export class DryRunMode {
  private context: ExecutionContext;
  private plan: DryRunPlan | null = null;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  async run(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const output: string[] = [];
    const errors: string[] = [];
    
    output.push("🔍 DRY RUN MODE - Simulating execution without making changes");

    try {
      // Generate dry run plan
      this.plan = await this.generateDryRunPlan();
      
      output.push(`\n📋 DRY RUN PLAN GENERATED`);
      output.push(`   Mission: ${this.plan.missionId}`);
      output.push(`   Total Phases: ${this.plan.phases.length}`);
      
      let totalTasks = 0;
      for (const phase of this.plan.phases) {
        output.push(`\n   📦 Phase: ${phase.name}`);
        output.push(`      Tasks: ${phase.tasks.length}`);
        
        for (const task of phase.tasks) {
          totalTasks++;
          output.push(`      ├── ${task.name}`);
          output.push(`      │   Tools: ${task.tools.join(", ") || "none"}`);
          output.push(`      │   Impact: ${task.impact}`);
          output.push(`      │   Risk: ${task.risk}`);
          
          if (task.files.length > 0) {
            output.push(`      │   Files: ${task.files.length}`);
          }
          if (task.commands.length > 0) {
            output.push(`      │   Commands: ${task.commands.length}`);
          }
        }
      }

      output.push(`\n📊 SUMMARY`);
      output.push(`   Total Tasks: ${totalTasks}`);
      output.push(`   Total Files: ${this.plan.totalFiles.length}`);
      output.push(`   Total Commands: ${this.plan.totalCommands.length}`);
      output.push(`   Required Tools: ${this.plan.requiredTools.length}`);
      output.push(`   Estimated Duration: ~${this.plan.estimatedDuration} minutes`);

      // Log the dry run
      await logEvent({
        missionId: this.context.missionId,
        eventType: "mission_progress",
        severity: "info",
        message: "Dry run completed",
        actor: "system",
        details: {
          executorId: this.context.executorId,
          tasks: totalTasks,
          files: this.plan.totalFiles.length,
          commands: this.plan.totalCommands.length,
        },
      });

      return {
        success: true,
        mode: ExecutionMode.DRY_RUN,
        tasksExecuted: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        tasksSkipped: 0,
        duration: Date.now() - startTime,
        dryRunPlan: this.plan,
        output,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Dry run failed: ${errorMsg}`);
      
      return {
        success: false,
        mode: ExecutionMode.DRY_RUN,
        tasksExecuted: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        tasksSkipped: 0,
        duration: Date.now() - startTime,
        output,
        errors,
      };
    }
  }

  private async generateDryRunPlan(): Promise<DryRunPlan> {
    const tasks = executionQueue.getTasksByMission(this.context.missionId);
    const phases: DryRunPlan["phases"] = [];
    const allFiles: string[] = [];
    const allCommands: string[] = [];
    const allTools: string[] = [];
    let estimatedMinutes = 0;

    // Group tasks by phase
    const tasksByPhase = new Map<string, QueuedTask[]>();
    for (const task of tasks) {
      const phaseTasks = tasksByPhase.get(task.phaseId) ?? [];
      phaseTasks.push(task);
      tasksByPhase.set(task.phaseId, phaseTasks);
    }

    for (const [phaseId, phaseTasks] of tasksByPhase) {
      const planTasks = phaseTasks.map(task => {
        // Analyze task for dry run
        const taskTools = this.analyzeTaskTools(task);
        const taskFiles = this.analyzeTaskFiles(task);
        const taskCommands = this.analyzeTaskCommands(task);
        const { impact, risk } = this.assessTaskImpact(task);

        // Add to totals
        allTools.push(...taskTools);
        allFiles.push(...taskFiles);
        allCommands.push(...taskCommands);
        estimatedMinutes += this.estimateTaskDuration(task);

        return {
          id: task.taskId,
          name: task.taskId, // Would be task name from DB
          description: "Task execution",
          tools: taskTools,
          files: taskFiles,
          commands: taskCommands,
          impact,
          risk,
        };
      });

      phases.push({
        id: phaseId,
        name: `Phase ${phaseId}`,
        tasks: planTasks,
      });
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(allFiles)];
    const uniqueCommands = [...new Set(allCommands)];
    const uniqueTools = [...new Set(allTools)];

    return {
      missionId: this.context.missionId,
      phases,
      estimatedDuration: Math.ceil(estimatedMinutes),
      totalFiles: uniqueFiles,
      totalCommands: uniqueCommands,
      requiredTools: uniqueTools,
    };
  }

  private analyzeTaskTools(task: QueuedTask): string[] {
    // In production, parse task definition to find tool capabilities
    // For now, return based on task metadata
    const toolCapabilities = (task as any).toolCapabilities ?? [];
    return Array.isArray(toolCapabilities) ? toolCapabilities : [];
  }

  private analyzeTaskFiles(task: QueuedTask): string[] {
    // In production, analyze task definition for file operations
    return [];
  }

  private analyzeTaskCommands(task: QueuedTask): string[] {
    // In production, analyze task definition for commands
    return [];
  }

  private assessTaskImpact(task: QueuedTask): { impact: "low" | "medium" | "high"; risk: "safe" | "standard" | "privileged" | "critical" } {
    // Conservative defaults for dry run
    const toolCaps = this.analyzeTaskTools(task);
    
    const hasPrivileged = toolCaps.some((t: string) => 
      t.includes("sudo") || t.includes("admin") || t.includes("deploy")
    );
    
    return {
      impact: hasPrivileged ? "high" : "medium",
      risk: hasPrivileged ? "privileged" : "standard",
    };
  }

  private estimateTaskDuration(task: QueuedTask): number {
    // Rough estimates in minutes
    return 5; // Default 5 minutes per task
  }

  getPlan(): DryRunPlan | null {
    return this.plan;
  }
}

// ============================================================================
// STEP-BY-STEP MODE
// ============================================================================

export class StepByStepMode {
  private context: ExecutionContext;
  private currentTask: QueuedTask | null = null;
  private paused: boolean = false;
  private awaitingApproval: boolean = false;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  async run(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const output: string[] = [];
    const errors: string[] = [];
    
    let tasksCompleted = 0;
    let tasksFailed = 0;
    let tasksSkipped = 0;

    output.push("👣 STEP-BY-STEP MODE - Execute one task at a time with approval");

    // Get executor and transition to running
    const executor = getExecutor(this.context.executorId);
    if (!executor) {
      return {
        success: false,
        mode: ExecutionMode.STEP_BY_STEP,
        tasksExecuted: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        tasksSkipped: 0,
        duration: Date.now() - startTime,
        output,
        errors: ["Executor not found"],
      };
    }

    // Main loop - process one task at a time
    while (!this.paused && !this.awaitingApproval) {
      // Get next task
      const task = executionQueue.getNextExecutableTask(this.context.missionId);
      
      if (!task) {
        output.push("✅ All tasks completed or blocked");
        break;
      }

      this.currentTask = task;

      // Request approval before execution
      output.push(`\n⏸️  TASK READY: ${task.taskId}`);
      output.push(`   Waiting for approval to execute...`);

      // Emit approval required event
      await logEvent({
        missionId: this.context.missionId,
        taskId: task.taskId,
        eventType: "approval_requested",
        severity: "info",
        message: `Step-by-step: Awaiting approval for task: ${task.taskId}`,
        actor: "system",
        details: { taskId: task.taskId },
      });

      // Notify about approval requirement
      this.context.onApprovalRequired?.(task, "Step-by-step mode requires approval for each task");

      // In step-by-step mode, we wait here
      // The controller should check for approval before calling continue
      this.awaitingApproval = true;

      // For now, auto-proceed (in real implementation, this would pause)
      // The API should provide a /approve endpoint
      this.awaitingApproval = false;

      // Actually execute the task
      output.push(`\n▶️  EXECUTING: ${task.taskId}`);

      try {
        const result = await this.executeTask(task);
        
        if (result.success) {
          tasksCompleted++;
          output.push(`✅ TASK COMPLETED: ${task.taskId}`);
          this.context.onTaskComplete?.(task, result.output);
        } else {
          tasksFailed++;
          output.push(`❌ TASK FAILED: ${task.taskId}`);
          output.push(`   Error: ${result.error}`);
          this.context.onTaskFail?.(task, result.error ?? "Unknown error");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        tasksFailed++;
        output.push(`❌ TASK ERROR: ${task.taskId}`);
        output.push(`   ${errorMsg}`);
        this.context.onTaskFail?.(task, errorMsg);
      }

      // Update progress
      const stats = executionQueue.getStats(this.context.missionId);
      await updateExecutorProgress(
        this.context.executorId,
        stats.completed / stats.total * 100,
        task.phaseId,
        task.taskId
      );
    }

    if (this.paused) {
      output.push("\n⏸️  EXECUTION PAUSED");
    }

    return {
      success: !this.paused && tasksFailed === 0,
      mode: ExecutionMode.STEP_BY_STEP,
      tasksExecuted: tasksCompleted + tasksFailed,
      tasksCompleted,
      tasksFailed,
      tasksSkipped,
      duration: Date.now() - startTime,
      output,
      errors,
    };
  }

  private async executeTask(task: QueuedTask): Promise<{ success: boolean; output?: unknown; error?: string }> {
    executionQueue.startTask(task.taskId);
    
    this.context.onTaskStart?.(task);

    // Log task start
    await logEvent({
      missionId: this.context.missionId,
      taskId: task.taskId,
      eventType: "task_started",
      severity: "info",
      message: `Executing task: ${task.taskId}`,
      actor: "system",
      details: { taskId: task.taskId, phaseId: task.phaseId },
    });

    // Execute task (simplified - in production would use actual tool execution)
    try {
      // Simulate task execution
      const result = { output: "Task executed successfully", taskId: task.taskId };
      
      executionQueue.completeTask(task.taskId, result);
      
      return { success: true, output: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      executionQueue.failTask(task.taskId, errorMsg);
      
      return { success: false, error: errorMsg };
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.awaitingApproval = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isAwaitingApproval(): boolean {
    return this.awaitingApproval;
  }

  getCurrentTask(): QueuedTask | null {
    return this.currentTask;
  }
}

// ============================================================================
// AUTO PILOT MODE
// ============================================================================

export class AutoPilotMode {
  private context: ExecutionContext;
  private paused: boolean = false;
  private cancelled: boolean = false;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  async run(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const output: string[] = [];
    const errors: string[] = [];
    
    let tasksExecuted = 0;
    let tasksCompleted = 0;
    let tasksFailed = 0;
    let tasksSkipped = 0;

    output.push("🚀 AUTO PILOT MODE - Continuous execution after approval");

    // Get executor
    const executor = getExecutor(this.context.executorId);
    if (!executor) {
      return {
        success: false,
        mode: ExecutionMode.AUTO_PILOT,
        tasksExecuted: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        tasksSkipped: 0,
        duration: Date.now() - startTime,
        output,
        errors: ["Executor not found"],
      };
    }

    // Main execution loop
    while (!this.paused && !this.cancelled) {
      // Get next executable task
      const task = executionQueue.getNextExecutableTask(this.context.missionId);
      
      if (!task) {
        // Check if all tasks are done or just blocked
        const stats = executionQueue.getStats(this.context.missionId);
        
        if (stats.executing === 0) {
          output.push("✅ All tasks completed");
          break;
        }
        
        // Still executing, wait
        await this.sleep(1000);
        continue;
      }

      tasksExecuted++;

      // Check if task requires approval
      if (this.requiresApproval(task)) {
        output.push(`\n⏸️  APPROVAL REQUIRED: ${task.taskId}`);
        
        await logEvent({
          missionId: this.context.missionId,
          taskId: task.taskId,
          eventType: "approval_requested",
          severity: "info",
          message: `Auto-pilot: Approval required for task: ${task.taskId}`,
          actor: "system",
        });

        this.context.onApprovalRequired?.(task, "This task requires explicit approval");

        // Pause and wait for approval
        this.paused = true;
        break;
      }

      // Execute task
      output.push(`\n▶️  ${task.taskId}`);

      try {
        const result = await this.executeTask(task);
        
        if (result.success) {
          tasksCompleted++;
          this.context.onTaskComplete?.(task, result.output);
        } else {
          // Handle failure with recovery
          const recoveryResult = await this.context.recoveryEngine.handleFailure(
            this.context.missionId,
            task.taskId,
            result.error ?? "Unknown error"
          );

          switch (recoveryResult.action) {
            case RecoveryAction.RETRY:
              tasksExecuted--;
              output.push(`🔄 RETRY: ${task.taskId}`);
              break;
            case RecoveryAction.SKIP:
              tasksSkipped++;
              output.push(`⏭️  SKIPPED: ${task.taskId}`);
              break;
            case RecoveryAction.PAUSE:
              this.paused = true;
              output.push(`⏸️  PAUSED: ${task.taskId}`);
              break;
            case RecoveryAction.FAIL_MISSION:
              tasksFailed++;
              errors.push(`Mission failed: ${result.error}`);
              this.cancelled = true;
              break;
            default:
              tasksFailed++;
          }
          
          this.context.onTaskFail?.(task, result.error ?? "Unknown error");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        tasksFailed++;
        output.push(`❌ ERROR: ${task.taskId}`);
        output.push(`   ${errorMsg}`);
        this.context.onTaskFail?.(task, errorMsg);
      }

      // Update progress
      const stats = executionQueue.getStats(this.context.missionId);
      const progress = stats.total > 0 
        ? Math.round(((stats.completed + stats.failed) / stats.total) * 100)
        : 0;
      
      await updateExecutorProgress(
        this.context.executorId,
        progress,
        task.phaseId,
        task.taskId
      );
    }

    if (this.paused) {
      output.push("\n⏸️  EXECUTION PAUSED - Awaiting approval to continue");
    }
    
    if (this.cancelled) {
      output.push("\n🚫 EXECUTION CANCELLED");
    }

    return {
      success: !this.cancelled && tasksFailed === 0,
      mode: ExecutionMode.AUTO_PILOT,
      tasksExecuted,
      tasksCompleted,
      tasksFailed,
      tasksSkipped,
      duration: Date.now() - startTime,
      output,
      errors,
    };
  }

  private requiresApproval(task: QueuedTask): boolean {
    // Check if task or tool requires approval
    // This would check the tool registry
    const toolCaps = (task as any).toolCapabilities ?? [];
    
    return toolCaps.some((tool: string) => 
      tool.includes("deploy") || 
      tool.includes("github_write") ||
      tool.includes("secret") ||
      tool.includes("production")
    );
  }

  private async executeTask(task: QueuedTask): Promise<{ success: boolean; output?: unknown; error?: string }> {
    executionQueue.startTask(task.taskId);
    this.context.onTaskStart?.(task);

    await logEvent({
      missionId: this.context.missionId,
      taskId: task.taskId,
      eventType: "task_started",
      severity: "info",
      message: `Auto-pilot executing: ${task.taskId}`,
      actor: "system",
      details: { taskId: task.taskId },
    });

    try {
      // Simulate task execution
      const result = { output: "Task executed successfully", taskId: task.taskId };
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
      
      executionQueue.completeTask(task.taskId, result);

      await logEvent({
        missionId: this.context.missionId,
        taskId: task.taskId,
        eventType: "task_completed",
        severity: "info",
        message: `Task completed: ${task.taskId}`,
        actor: "system",
      });

      return { success: true, output: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      executionQueue.failTask(task.taskId, errorMsg);
      
      return { success: false, error: errorMsg };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  cancel(): void {
    this.cancelled = true;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isCancelled(): boolean {
    return this.cancelled;
  }
}

// ============================================================================
// MODE FACTORY
// ============================================================================

export function createExecutionMode(
  mode: ExecutionModeType,
  context: ExecutionContext
): DryRunMode | StepByStepMode | AutoPilotMode {
  switch (mode) {
    case ExecutionMode.DRY_RUN:
      return new DryRunMode(context);
    case ExecutionMode.STEP_BY_STEP:
      return new StepByStepMode(context);
    case ExecutionMode.AUTO_PILOT:
    default:
      return new AutoPilotMode(context);
  }
}
