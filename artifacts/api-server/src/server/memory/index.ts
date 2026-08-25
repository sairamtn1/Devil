/**
 * DEVIL Memory & Knowledge System
 * 
 * Persistent intelligence platform for DEVIL AI Agent.
 * - User Memory
 * - Project Memory
 * - Mission Memory
 * - Repository Memory
 * - Execution Memory
 * - Knowledge Memory
 */

import { logEvent } from "../control-plane/eventLog";
import { randomUUID } from "crypto";
import { writeFile, readFile, mkdir, access, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// ============================================================================
// TYPES
// ============================================================================

// Memory States
export const MemoryState = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  EXPIRED: "EXPIRED",
  DELETED: "DELETED",
} as const;

export type MemoryStateType = typeof MemoryState[keyof typeof MemoryState];

// Memory Types
export const MemoryType = {
  USER: "user",
  PROJECT: "project",
  MISSION: "mission",
  REPOSITORY: "repository",
  EXECUTION: "execution",
  KNOWLEDGE: "knowledge",
} as const;

export type MemoryTypeType = typeof MemoryType[keyof typeof MemoryType];

// Memory Entry Base
export interface MemoryEntry {
  id: string;
  type: MemoryTypeType;
  entityId: string;
  state: MemoryStateType;
  data: Record<string, unknown>;
  importance: number; // 0-100
  recency: Date;
  source: string;
  confidence: number; // 0-100
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User Memory
export interface UserMemory extends MemoryEntry {
  type: "user";
  data: UserMemoryData;
}

export interface UserMemoryData {
  userId: string;
  preferences: UserPreferences;
  approvedStacks: string[];
  codingStyle: CodingStyle;
  deploymentPreferences: DeploymentPreferences;
  toolPermissions: Record<string, boolean>;
  workflowPreferences: WorkflowPreferences;
  lastActive?: Date;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  theme?: string;
}

export interface CodingStyle {
  indentStyle?: "spaces" | "tabs";
  indentSize?: number;
  quotes?: "single" | "double";
  semicolons?: boolean;
  trailingCommas?: boolean;
}

export interface DeploymentPreferences {
  preferredProvider?: "local" | "docker" | "vercel" | "railway";
  autoDeploy?: boolean;
  requireApproval?: boolean;
}

export interface WorkflowPreferences {
  autoMerge?: boolean;
  defaultBranch?: string;
  reviewRequired?: boolean;
}

// Project Memory
export interface ProjectMemory extends MemoryEntry {
  type: "project";
  data: ProjectMemoryData;
}

export interface ProjectMemoryData {
  projectId: string;
  name: string;
  description?: string;
  goals: string[];
  architecture: ArchitectureSummary;
  frameworks: string[];
  databases: string[];
  repositories: string[];
  deploymentHistory: DeploymentRecord[];
  roadmaps: string[];
  createdAt?: Date;
}

// Architecture Summary
export interface ArchitectureSummary {
  frontend?: string;
  backend?: string;
  database?: string;
  cache?: string;
  queue?: string;
  storage?: string;
  deployment?: string;
  summary: string;
}

// Deployment Record
export interface DeploymentRecord {
  deploymentId: string;
  environment: string;
  provider: string;
  version: string;
  timestamp: Date;
  status: "success" | "failed" | "rolled_back";
}

// Mission Memory
export interface MissionMemory extends MemoryEntry {
  type: "mission";
  data: MissionMemoryData;
}

export interface MissionMemoryData {
  missionId: string;
  objective: string;
  phases: MissionPhase[];
  status: string;
  approvals: ApprovalRecord[];
  results: MissionResult[];
  failures: FailureRecord[];
  recoveryActions: RecoveryRecord[];
  createdAt?: Date;
  completedAt?: Date;
}

export interface MissionPhase {
  id: string;
  name: string;
  status: string;
  tasks: string[];
  completedAt?: Date;
}

export interface ApprovalRecord {
  id: string;
  type: string;
  status: "approved" | "rejected";
  approvedBy?: string;
  timestamp: Date;
  reason?: string;
}

export interface MissionResult {
  phaseId: string;
  output: string;
  timestamp: Date;
}

export interface FailureRecord {
  phaseId: string;
  error: string;
  timestamp: Date;
  resolved: boolean;
}

export interface RecoveryRecord {
  failureId: string;
  action: string;
  success: boolean;
  timestamp: Date;
}

// Repository Memory
export interface RepositoryMemory extends MemoryEntry {
  type: "repository";
  data: RepositoryMemoryData;
}

export interface RepositoryMemoryData {
  repositoryId: string;
  url: string;
  name: string;
  owner: string;
  structure: RepositoryStructure;
  importantFiles: ImportantFile[];
  architectureSummary?: string;
  codeHistory: CodeHistoryEntry[];
  githubReferences: GitHubReference[];
  analyzedAt?: Date;
}

export interface RepositoryStructure {
  rootFiles: string[];
  directories: string[];
  sourceDirs: string[];
  testDirs: string[];
  configFiles: string[];
}

export interface ImportantFile {
  path: string;
  description: string;
  importance: number;
}

export interface CodeHistoryEntry {
  operation: string;
  files: string[];
  timestamp: Date;
  summary: string;
}

export interface GitHubReference {
  type: "branch" | "commit" | "pr";
  reference: string;
  timestamp: Date;
}

// Execution Memory
export interface ExecutionMemory extends MemoryEntry {
  type: "execution";
  data: ExecutionMemoryData;
}

export interface ExecutionMemoryData {
  executionId: string;
  missionId?: string;
  taskHistory: TaskHistoryEntry[];
  toolCalls: ToolCallEntry[];
  executionResults: ExecutionResultEntry[];
  validationOutcomes: ValidationOutcomeEntry[];
  recoveryAttempts: RecoveryAttemptEntry[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface TaskHistoryEntry {
  taskId: string;
  name: string;
  status: string;
  duration?: number;
  timestamp: Date;
}

export interface ToolCallEntry {
  tool: string;
  args: Record<string, unknown>;
  result?: string;
  success: boolean;
  timestamp: Date;
}

export interface ExecutionResultEntry {
  phase: string;
  output: string;
  success: boolean;
  timestamp: Date;
}

export interface ValidationOutcomeEntry {
  validation: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

export interface RecoveryAttemptEntry {
  failureId: string;
  strategy: string;
  success: boolean;
  details?: string;
  timestamp: Date;
}

// Knowledge Memory
export interface KnowledgeMemory extends MemoryEntry {
  type: "knowledge";
  data: KnowledgeMemoryData;
}

export interface KnowledgeMemoryData {
  knowledgeId: string;
  category: string;
  title: string;
  content: string;
  examples?: string[];
  relatedKnowledge?: string[];
  source?: string;
}

// Memory Search
export interface MemorySearchQuery {
  query?: string;
  type?: MemoryTypeType;
  entityId?: string;
  tags?: string[];
  state?: MemoryStateType;
  minImportance?: number;
  minConfidence?: number;
  since?: Date;
  limit?: number;
  offset?: number;
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  total: number;
  scores: Record<string, number>;
}

// Memory Events
export type MemoryEventType =
  | "memory_created"
  | "memory_updated"
  | "memory_retrieved"
  | "memory_archived"
  | "memory_deleted";

export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  memoryId: string;
  memoryType: MemoryTypeType;
  entityId: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// MEMORY MANAGER
// ============================================================================

export class MemoryManager {
  private store: Map<string, MemoryEntry> = new Map();
  private index: Map<string, Set<string>> = new Map(); // tag/entityId/type -> memory ids
  private events: MemoryEvent[] = [];
  private basePath: string;

  constructor(basePath: string = "/tmp/devil-memory") {
    this.basePath = basePath;
  }

  async initialize(): Promise<void> {
    await mkdir(this.basePath, { recursive: true });
    
    // Load persisted memories
    await this.loadFromDisk();
    
    await logEvent({
      eventType: "system_recovery",
      severity: "info",
      message: "Memory manager initialized",
      details: { memoriesLoaded: this.store.size }
    });
  }

  // ==========================================================================
  // MEMORY CRUD
  // ==========================================================================

  async create<T extends MemoryEntry>(
    type: MemoryTypeType,
    entityId: string,
    data: T["data"],
    options?: {
      importance?: number;
      source?: string;
      confidence?: number;
      tags?: string[];
    }
  ): Promise<T> {
    const id = randomUUID();
    const now = new Date();

    const entry = {
      id,
      type,
      entityId,
      state: MemoryState.ACTIVE,
      data: data as Record<string, unknown>,
      importance: options?.importance ?? 50,
      recency: now,
      source: options?.source ?? "devil-agent",
      confidence: options?.confidence ?? 80,
      tags: options?.tags ?? [],
      createdAt: now,
      updatedAt: now,
    } as T;

    this.store.set(id, entry);
    this.indexEntry(entry);
    await this.persistToDisk(entry);
    await this.emitEvent("memory_created", entry);

    return entry;
  }

  async get<T extends MemoryEntry>(id: string): Promise<T | null> {
    const entry = this.store.get(id) as T | undefined;
    
    if (entry) {
      entry.recency = new Date();
      await this.emitEvent("memory_retrieved", entry);
    }
    
    return entry ?? null;
  }

  async update<T extends MemoryEntry>(
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const entry = this.store.get(id) as T | undefined;
    
    if (!entry) return null;

    const updated = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
      recency: new Date(),
    };

    // Remove old index
    this.unindexEntry(entry);
    
    // Update and re-index
    this.store.set(id, updated);
    this.indexEntry(updated);
    await this.persistToDisk(updated);
    await this.emitEvent("memory_updated", updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const entry = this.store.get(id);
    
    if (!entry) return false;

    entry.state = MemoryState.DELETED;
    this.unindexEntry(entry);
    await this.removeFromDisk(id);
    await this.emitEvent("memory_deleted", entry);

    return true;
  }

  async archive(id: string): Promise<boolean> {
    return !!(await this.update(id, { state: MemoryState.ARCHIVED }));
  }

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  async search(query: MemorySearchQuery): Promise<MemorySearchResult> {
    let entries = Array.from(this.store.values());

    // Filter by type
    if (query.type) {
      entries = entries.filter(e => e.type === query.type);
    }

    // Filter by entityId
    if (query.entityId) {
      entries = entries.filter(e => e.entityId === query.entityId);
    }

    // Filter by state
    if (query.state) {
      entries = entries.filter(e => e.state === query.state);
    } else {
      // Default: exclude deleted
      entries = entries.filter(e => e.state !== MemoryState.DELETED);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      entries = entries.filter(e =>
        query.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Filter by importance
    if (query.minImportance !== undefined) {
      entries = entries.filter(e => e.importance >= query.minImportance!);
    }

    // Filter by confidence
    if (query.minConfidence !== undefined) {
      entries = entries.filter(e => e.confidence >= query.minConfidence!);
    }

    // Filter by date
    if (query.since) {
      entries = entries.filter(e => e.createdAt >= query.since!);
    }

    // Keyword search
    if (query.query) {
      const lowerQuery = query.query.toLowerCase();
      entries = entries.filter(e => {
        const dataStr = JSON.stringify(e.data).toLowerCase();
        const tagsStr = e.tags.join(" ").toLowerCase();
        return dataStr.includes(lowerQuery) || tagsStr.includes(lowerQuery);
      });
    }

    // Calculate scores
    const scores: Record<string, number> = {};
    entries.forEach(e => {
      scores[e.id] = this.calculateScore(e, query);
    });

    // Sort by score
    entries.sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

    const total = entries.length;

    // Pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    entries = entries.slice(offset, offset + limit);

    return { entries, total, scores };
  }

  private calculateScore(entry: MemoryEntry, query: MemorySearchQuery): number {
    let score = 0;

    // Importance weight
    score += entry.importance * 0.3;

    // Recency weight (newer = higher score)
    const daysSinceUpdate = (Date.now() - entry.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 100 - daysSinceUpdate) * 0.2;

    // Confidence weight
    score += entry.confidence * 0.2;

    // Tag match bonus
    if (query.tags && query.tags.length > 0) {
      const matchingTags = entry.tags.filter(t => query.tags!.includes(t));
      score += matchingTags.length * 10;
    }

    // Type match bonus
    if (query.type && entry.type === query.type) {
      score += 20;
    }

    // Active state bonus
    if (entry.state === MemoryState.ACTIVE) {
      score += 10;
    }

    return Math.min(100, score);
  }

  // ==========================================================================
  // TYPE-SPECIFIC METHODS
  // ==========================================================================

  // User Memory
  async getUserMemory(userId: string): Promise<UserMemory | null> {
    const result = await this.search({
      type: MemoryType.USER,
      entityId: userId,
      state: MemoryState.ACTIVE,
    });
    return (result.entries[0] as UserMemory) ?? null;
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<UserMemory> {
    const existing = await this.getUserMemory(userId);
    
    if (existing) {
      return (await this.update(existing.id, {
        data: { ...existing.data, ...preferences }
      })) as UserMemory;
    }

    return this.create<UserMemory>(MemoryType.USER, userId, {
      userId,
      preferences,
      approvedStacks: [],
      codingStyle: {},
      deploymentPreferences: {},
      toolPermissions: {},
      workflowPreferences: {},
    });
  }

  // Project Memory
  async getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
    const result = await this.search({
      type: MemoryType.PROJECT,
      entityId: projectId,
      state: MemoryState.ACTIVE,
    });
    return (result.entries[0] as ProjectMemory) ?? null;
  }

  async saveProjectMemory(projectId: string, data: Partial<ProjectMemoryData>): Promise<ProjectMemory> {
    const existing = await this.getProjectMemory(projectId);
    
    if (existing) {
      return (await this.update(existing.id, {
        data: { ...existing.data, ...data }
      })) as ProjectMemory;
    }

    return this.create<ProjectMemory>(MemoryType.PROJECT, projectId, {
      projectId,
      name: data.name ?? projectId,
      description: data.description,
      goals: data.goals ?? [],
      architecture: data.architecture ?? { summary: "" },
      frameworks: data.frameworks ?? [],
      databases: data.databases ?? [],
      repositories: data.repositories ?? [],
      deploymentHistory: [],
      roadmaps: [],
    });
  }

  // Mission Memory
  async getMissionMemory(missionId: string): Promise<MissionMemory | null> {
    const result = await this.search({
      type: MemoryType.MISSION,
      entityId: missionId,
      state: MemoryState.ACTIVE,
    });
    return (result.entries[0] as MissionMemory) ?? null;
  }

  async saveMissionMemory(missionId: string, data: Partial<MissionMemoryData>): Promise<MissionMemory> {
    const existing = await this.getMissionMemory(missionId);
    
    if (existing) {
      return (await this.update(existing.id, {
        data: { ...existing.data, ...data }
      })) as MissionMemory;
    }

    return this.create<MissionMemory>(MemoryType.MISSION, missionId, {
      missionId,
      objective: data.objective ?? "",
      phases: data.phases ?? [],
      status: data.status ?? "pending",
      approvals: [],
      results: [],
      failures: [],
      recoveryActions: [],
    });
  }

  // Repository Memory
  async getRepositoryMemory(repositoryId: string): Promise<RepositoryMemory | null> {
    const result = await this.search({
      type: MemoryType.REPOSITORY,
      entityId: repositoryId,
      state: MemoryState.ACTIVE,
    });
    return (result.entries[0] as RepositoryMemory) ?? null;
  }

  async saveRepositoryMemory(repositoryId: string, data: Partial<RepositoryMemoryData>): Promise<RepositoryMemory> {
    const existing = await this.getRepositoryMemory(repositoryId);
    
    if (existing) {
      return (await this.update(existing.id, {
        data: { ...existing.data, ...data }
      } as Partial<RepositoryMemory>)) as RepositoryMemory;
    }

    return this.create<RepositoryMemory>(MemoryType.REPOSITORY, repositoryId, {
      repositoryId,
      url: data.url ?? "",
      name: data.name ?? "",
      owner: data.owner ?? "",
      structure: data.structure ?? { rootFiles: [], directories: [], sourceDirs: [], testDirs: [], configFiles: [] },
      importantFiles: [],
      codeHistory: [],
      githubReferences: [],
    });
  }

  // Execution Memory
  async getExecutionMemory(executionId: string): Promise<ExecutionMemory | null> {
    const result = await this.search({
      type: MemoryType.EXECUTION,
      entityId: executionId,
    });
    return (result.entries[0] as ExecutionMemory) ?? null;
  }

  async saveExecutionMemory(executionId: string, data: Partial<ExecutionMemoryData>): Promise<ExecutionMemory> {
    const existing = await this.getExecutionMemory(executionId);
    
    if (existing) {
      return (await this.update(existing.id, {
        data: { ...existing.data, ...data }
      })) as ExecutionMemory;
    }

    return this.create<ExecutionMemory>(MemoryType.EXECUTION, executionId, {
      executionId,
      taskHistory: [],
      toolCalls: [],
      executionResults: [],
      validationOutcomes: [],
      recoveryAttempts: [],
    });
  }

  // Knowledge Memory
  async addKnowledge(category: string, title: string, content: string, options?: {
    examples?: string[];
    relatedKnowledge?: string[];
    source?: string;
    importance?: number;
  }): Promise<KnowledgeMemory> {
    const knowledgeId = randomUUID();
    
    return this.create<KnowledgeMemory>(MemoryType.KNOWLEDGE, category, {
      knowledgeId,
      category,
      title,
      content,
      examples: options?.examples,
      relatedKnowledge: options?.relatedKnowledge,
      source: options?.source,
    }, {
      importance: options?.importance ?? 50,
      tags: [category, title],
    });
  }

  async getKnowledgeByCategory(category: string): Promise<KnowledgeMemory[]> {
    const result = await this.search({
      type: MemoryType.KNOWLEDGE,
      entityId: category,
      state: MemoryState.ACTIVE,
    });
    return result.entries as KnowledgeMemory[];
  }

  // ==========================================================================
  // CONTEXT RETRIEVAL
  // ==========================================================================

  async getContextForMission(missionId: string, projectId?: string): Promise<{
    user?: UserMemory;
    project?: ProjectMemory;
    mission?: MissionMemory;
    knowledge: KnowledgeMemory[];
    recentExecutions: ExecutionMemory[];
  }> {
    const context: ReturnType<typeof getContextForMission extends Promise<infer T> ? () => T : never> = {
      knowledge: [],
      recentExecutions: [],
    };

    // Get mission memory
    if (missionId) {
      context.mission = await this.getMissionMemory(missionId);
      
      // Get project from mission if not provided
      if (!projectId && context.mission) {
        // Extract projectId from mission if stored
      }
    }

    // Get project memory
    if (projectId) {
      context.project = await this.getProjectMemory(projectId);
      
      // Get associated user
      if (context.project) {
        const userId = context.project.data["userId"] as string;
        if (userId) {
          context.user = await this.getUserMemory(userId);
        }
      }
    }

    // Get relevant knowledge
    if (context.project) {
      const projectTags = context.project.frameworks ?? [];
      const result = await this.search({
        type: MemoryType.KNOWLEDGE,
        tags: projectTags,
        state: MemoryState.ACTIVE,
        limit: 10,
      });
      context.knowledge = result.entries as KnowledgeMemory[];
    }

    // Get recent executions
    const execResult = await this.search({
      type: MemoryType.EXECUTION,
      missionId,
      limit: 5,
    });
    context.recentExecutions = execResult.entries as ExecutionMemory[];

    return context as any;
  }

  // ==========================================================================
  // INDEXING
  // ==========================================================================

  private indexEntry(entry: MemoryEntry): void {
    // Index by entityId
    this.addToIndex(entry.entityId, entry.id);
    
    // Index by type
    this.addToIndex(`type:${entry.type}`, entry.id);
    
    // Index by tags
    for (const tag of entry.tags) {
      this.addToIndex(`tag:${tag}`, entry.id);
    }
  }

  private unindexEntry(entry: MemoryEntry): void {
    this.removeFromIndex(entry.entityId, entry.id);
    this.removeFromIndex(`type:${entry.type}`, entry.id);
    for (const tag of entry.tags) {
      this.removeFromIndex(`tag:${tag}`, entry.id);
    }
  }

  private addToIndex(key: string, id: string): void {
    if (!this.index.has(key)) {
      this.index.set(key, new Set());
    }
    this.index.get(key)!.add(id);
  }

  private removeFromIndex(key: string, id: string): void {
    this.index.get(key)?.delete(id);
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  private async persistToDisk(entry: MemoryEntry): Promise<void> {
    try {
      const filePath = join(this.basePath, `${entry.id}.json`);
      await writeFile(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error("Failed to persist memory:", error);
    }
  }

  private async removeFromDisk(id: string): Promise<void> {
    try {
      const filePath = join(this.basePath, `${id}.json`);
      await rm(filePath, { force: true });
    } catch {
      // Ignore errors
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const { readdir } = await import("fs/promises");
      const files = await readdir(this.basePath);
      
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const content = await readFile(join(this.basePath, file), "utf-8");
            const entry = JSON.parse(content) as MemoryEntry;
            entry.createdAt = new Date(entry.createdAt);
            entry.updatedAt = new Date(entry.updatedAt);
            entry.recency = new Date(entry.recency);
            this.store.set(entry.id, entry);
            this.indexEntry(entry);
          } catch {
            // Skip invalid files
          }
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  private async emitEvent(type: MemoryEventType, entry: MemoryEntry): Promise<void> {
    const event: MemoryEvent = {
      id: randomUUID(),
      type,
      memoryId: entry.id,
      memoryType: entry.type,
      entityId: entry.entityId,
      timestamp: new Date(),
    };

    this.events.push(event);
    
    // Keep last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    await logEvent({
      eventType: type,
      severity: "info",
      message: `Memory ${type}: ${entry.type}/${entry.entityId}`,
      details: { memoryId: entry.id, entityId: entry.entityId }
    });
  }

  getEvents(): MemoryEvent[] {
    return [...this.events];
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  getStats(): {
    total: number;
    byType: Record<MemoryTypeType, number>;
    byState: Record<MemoryStateType, number>;
  } {
    const stats = {
      total: this.store.size,
      byType: {} as Record<MemoryTypeType, number>,
      byState: {} as Record<MemoryStateType, number>,
    };

    for (const type of Object.values(MemoryType)) {
      stats.byType[type] = 0;
    }
    for (const state of Object.values(MemoryState)) {
      stats.byState[state] = 0;
    }

    for (const entry of this.store.values()) {
      stats.byType[entry.type]++;
      stats.byState[entry.state]++;
    }

    return stats;
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const memoryManager = new MemoryManager();
