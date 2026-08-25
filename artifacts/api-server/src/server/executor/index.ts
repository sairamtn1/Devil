/**
 * DEVIL Executor Foundation - Main Module
 * 
 * Exports all executor components for use by the API server.
 */

// State Machine
export {
  ExecutorState,
  ExecutorStateType,
  ExecutionMode,
  ExecutionModeType,
  EXECUTOR_STATES,
  createExecutor,
  getExecutor,
  getExecutorByMission,
  removeExecutor,
  transitionExecutorState,
  updateExecutorProgress,
  getExecutorMissionState,
  heartbeat,
  isExecutorStale,
  executorState,
  type ExecutorStateRecord,
  type ExecutorTransitionResult,
} from "./stateMachine";

// Queue
export {
  QueuePriority,
  executionQueue,
  getMissionQueueSummary,
  type QueuedTask,
  type QueueStats,
  type MissionQueueSummary,
} from "./queue";

// Sandbox
export {
  SandboxType,
  SandboxError,
  SandboxTimeoutError,
  SandboxResourceError,
  SandboxManager,
  defaultSandboxManager,
  executeInSandbox,
  type ResourceLimits,
  type SandboxSession,
  type SandboxExecution,
  type SandboxProvider,
  type ToolExecutionContext,
} from "./sandbox";

// Recovery
export {
  RecoveryAction,
  FailureType,
  RecoveryEngine,
  defaultRecoveryEngine,
  handleValidationFailure,
  type RecoveryContext,
  type RecoveryResult,
  type RecoveryRule,
  type ValidationFailure,
} from "./recovery";

// Modes
export {
  createExecutionMode,
  DryRunMode,
  StepByStepMode,
  AutoPilotMode,
  type ExecutionContext,
  type ExecutionResult,
  type DryRunPlan,
} from "./modes";

// Engine
export {
  ExecutorEngine,
  defaultExecutorEngine,
  getExecutorFullStatus,
  type ExecutorConfig,
  type ExecutorStatus,
  type ExecutorEvent,
} from "./engine";
