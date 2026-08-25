/**
 * DEVIL Coding Agent Foundation - Main Module
 * 
 * Exports all coding agent components.
 */

// Workspace Manager
export {
  WorkspaceStatus,
  ProjectType,
  workspaceManager,
  WorkspaceManager,
  type Workspace,
  type WorkspaceSnapshot,
  type CreateWorkspaceOptions,
} from "./workspace";

// File Operations
export {
  FileOperationType,
  fileOperationsEngine,
  FileOperationsEngine,
  type FileOperation,
  type FileInfo,
  type FileContent,
  type EditResult,
} from "./fileOperations";

// Code Generator
export {
  ProjectType as CodeProjectType,
  codeGenerator,
  CodeGenerator,
  type CodeTemplate,
  type GenerationRequest,
  type GenerationOptions,
  type GenerationResult,
} from "./codeGenerator";

// Runners
export {
  buildRunner,
  testRunner,
  lintRunner,
  BuildRunner,
  TestRunner,
  LintRunner,
  type RunnerResult,
  type BuildResult,
  type TestResult,
  type LintResult,
} from "./runners";

// Diff Engine
export {
  diffEngine,
  DiffEngine,
  type FileDiff,
  type WorkspaceDiff,
  type DiffHunk,
  type DiffLine,
  type LineDiff,
} from "./diff";

// Code Review
export {
  codeReviewEngine,
  CodeReviewEngine,
  type CodeReview,
  type ReviewIssue,
  type FileReport,
  type IssueSeverity,
  type IssueCategory,
} from "./review";

// Mission Loop
export {
  MissionPhase,
  runMissionLoop,
  MissionExecutionLoop,
  type MissionPhaseType,
  type MissionLoopConfig,
  type LoopStep,
  type LoopResult,
} from "./missionLoop";
