/**
 * DEVIL Coding Agent Foundation - Workspace Manager
 * 
 * Manages isolated workspaces for mission execution.
 * - Create, load, delete workspaces
 * - Snapshot and restore functionality
 * - Workspace tracking and metadata
 */

import { logEvent } from "../../control-plane/eventLog";
import { join } from "path";
import { mkdir, rm, cp, readFile, writeFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";

// ============================================================================
// TYPES
// ============================================================================

export const WorkspaceStatus = {
  CREATING: "creating",
  READY: "ready",
  ACTIVE: "active",
  SNAPSHOTTING: "snapshoting",
  RESTORING: "restoring",
  DELETING: "deleting",
  DELETED: "deleted",
  ERROR: "error",
} as const;

export type WorkspaceStatusType = (typeof WorkspaceStatus)[keyof typeof WorkspaceStatus];

export const ProjectType = {
  REACT: "react",
  NEXTJS: "nextjs",
  EXPRESS: "express",
  FASTAPI: "fastapi",
  NODE_SERVICE: "node_service",
  TYPESCRIPT: "typescript",
  VANILLA: "vanilla",
} as const;

export type ProjectTypeType = (typeof ProjectType)[keyof typeof ProjectType];

export interface Workspace {
  id: string;
  missionId: string | null;
  projectType: ProjectTypeType;
  status: WorkspaceStatusType;
  rootPath: string;
  snapshots: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSnapshot {
  id: string;
  workspaceId: string;
  path: string;
  description: string;
  createdAt: Date;
  size: number;
}

export interface CreateWorkspaceOptions {
  missionId?: string;
  projectType: ProjectTypeType;
  basePath?: string;
  name?: string;
}

// ============================================================================
// WORKSPACE STORE (In-memory for Phase 3, would use DB in production)
// ============================================================================

const workspaces: Map<string, Workspace> = new Map();
const snapshots: Map<string, WorkspaceSnapshot[]> = new Map();

const DEFAULT_WORKSPACE_PATH = "/tmp/devil-workspaces";

// ============================================================================
// WORKSPACE MANAGER
// ============================================================================

export class WorkspaceManager {
  private basePath: string;

  constructor(basePath: string = DEFAULT_WORKSPACE_PATH) {
    this.basePath = basePath;
  }

  async initialize(): Promise<void> {
    // Ensure base directory exists
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
    }

    logEvent({
      eventType: "system_recovery",
      severity: "info",
      message: "Workspace manager initialized",
      details: { basePath: this.basePath },
    });
  }

  // ==========================================================================
  // WORKSPACE CRUD
  // ==========================================================================

  async createWorkspace(options: CreateWorkspaceOptions): Promise<Workspace> {
    const workspaceId = `ws-${crypto.randomUUID()}`;
    const workspacePath = join(
      this.basePath,
      options.name ?? workspaceId
    );

    const workspace: Workspace = {
      id: workspaceId,
      missionId: options.missionId ?? null,
      projectType: options.projectType,
      status: WorkspaceStatus.CREATING,
      rootPath: workspacePath,
      snapshots: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create directory
    await mkdir(workspacePath, { recursive: true });

    // Initialize based on project type
    await this.initializeProjectStructure(workspacePath, options.projectType);

    // Update status
    workspace.status = WorkspaceStatus.READY;
    workspace.updatedAt = new Date();

    // Store workspace
    workspaces.set(workspaceId, workspace);
    snapshots.set(workspaceId, []);

    // Log creation
    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Workspace created: ${workspaceId}`,
      details: { workspaceId, projectType: workspace.projectType, path: workspacePath },
    });

    return workspace;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    return workspaces.get(workspaceId) ?? null;
  }

  async listWorkspaces(missionId?: string): Promise<Workspace[]> {
    const all = Array.from(workspaces.values());
    
    if (missionId) {
      return all.filter(w => w.missionId === missionId);
    }
    
    return all;
  }

  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<Workspace | null> {
    const workspace = workspaces.get(workspaceId);
    
    if (!workspace) {
      return null;
    }

    Object.assign(workspace, updates, { updatedAt: new Date() });
    
    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Workspace updated: ${workspaceId}`,
      details: { updates },
    });

    return workspace;
  }

  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const workspace = workspaces.get(workspaceId);
    
    if (!workspace) {
      return false;
    }

    workspace.status = WorkspaceStatus.DELETING;

    // Delete directory
    try {
      await rm(workspace.rootPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete workspace directory: ${error}`);
    }

    // Remove from store
    workspaces.delete(workspaceId);
    snapshots.delete(workspaceId);

    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "system_recovery",
      severity: "info",
      message: `Workspace deleted: ${workspaceId}`,
    });

    return true;
  }

  // ==========================================================================
  // SNAPSHOT OPERATIONS
  // ==========================================================================

  async createSnapshot(workspaceId: string, description: string = ""): Promise<WorkspaceSnapshot | null> {
    const workspace = workspaces.get(workspaceId);
    
    if (!workspace) {
      return null;
    }

    workspace.status = WorkspaceStatus.SNAPSHOTTING;

    const snapshotId = `snap-${crypto.randomUUID()}`;
    const snapshotPath = join(this.basePath, "snapshots", snapshotId);

    try {
      // Create snapshot directory
      await mkdir(join(snapshotPath), { recursive: true });

      // Copy workspace to snapshot
      await this.copyDirectory(workspace.rootPath, snapshotPath);

      // Calculate size
      const size = await this.calculateDirectorySize(snapshotPath);

      const snapshot: WorkspaceSnapshot = {
        id: snapshotId,
        workspaceId,
        path: snapshotPath,
        description,
        createdAt: new Date(),
        size,
      };

      // Store snapshot
      const workspaceSnapshots = snapshots.get(workspaceId) ?? [];
      workspaceSnapshots.push(snapshot);
      snapshots.set(workspaceId, workspaceSnapshots);

      workspace.snapshots.push(snapshotId);
      workspace.status = WorkspaceStatus.READY;
      workspace.updatedAt = new Date();

      await logEvent({
        missionId: workspace.missionId ?? undefined,
        eventType: "checkpoint_created",
        severity: "info",
        message: `Snapshot created: ${snapshotId}`,
        details: { workspaceId, snapshotId },
      });

      return snapshot;
    } catch (error) {
      workspace.status = WorkspaceStatus.ERROR;
      console.error(`Failed to create snapshot: ${error}`);
      return null;
    }
  }

  async listSnapshots(workspaceId: string): Promise<WorkspaceSnapshot[]> {
    return snapshots.get(workspaceId) ?? [];
  }

  async restoreSnapshot(workspaceId: string, snapshotId: string): Promise<boolean> {
    const workspace = workspaces.get(workspaceId);
    const workspaceSnapshots = snapshots.get(workspaceId);
    
    if (!workspace || !workspaceSnapshots) {
      return false;
    }

    const snapshot = workspaceSnapshots.find(s => s.id === snapshotId);
    
    if (!snapshot || !existsSync(snapshot.path)) {
      return false;
    }

    workspace.status = WorkspaceStatus.RESTORING;

    try {
      // Clear current workspace
      await rm(workspace.rootPath, { recursive: true, force: true });
      await mkdir(workspace.rootPath, { recursive: true });

      // Restore from snapshot
      await this.copyDirectory(snapshot.path, workspace.rootPath);

      workspace.status = WorkspaceStatus.READY;
      workspace.updatedAt = new Date();

      await logEvent({
        missionId: workspace.missionId ?? undefined,
        eventType: "checkpoint_created",
        severity: "info",
        message: `Snapshot restored: ${snapshotId}`,
        details: { workspaceId, snapshotId },
      });

      return true;
    } catch (error) {
      workspace.status = WorkspaceStatus.ERROR;
      console.error(`Failed to restore snapshot: ${error}`);
      return false;
    }
  }

  async deleteSnapshot(workspaceId: string, snapshotId: string): Promise<boolean> {
    const workspaceSnapshots = snapshots.get(workspaceId);
    
    if (!workspaceSnapshots) {
      return false;
    }

    const index = workspaceSnapshots.findIndex(s => s.id === snapshotId);
    
    if (index === -1) {
      return false;
    }

    const snapshot = workspaceSnapshots[index];

    try {
      await rm(snapshot.path, { recursive: true, force: true });
      workspaceSnapshots.splice(index, 1);

      const workspace = workspaces.get(workspaceId);
      if (workspace) {
        workspace.snapshots = workspace.snapshots.filter(id => id !== snapshotId);
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete snapshot: ${error}`);
      return false;
    }
  }

  // ==========================================================================
  // WORKSPACE UTILITIES
  // ==========================================================================

  async getWorkspaceFiles(workspaceId: string, recursive: boolean = true): Promise<string[]> {
    const workspace = workspaces.get(workspaceId);
    
    if (!workspace || !existsSync(workspace.rootPath)) {
      return [];
    }

    return this.listFilesRecursive(workspace.rootPath, recursive);
  }

  async getWorkspaceStats(workspaceId: string): Promise<{
    totalFiles: number;
    totalDirs: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  } | null> {
    const workspace = workspaces.get(workspaceId);
    
    if (!workspace || !existsSync(workspace.rootPath)) {
      return null;
    }

    const files = await this.listFilesRecursive(workspace.rootPath, true);
    const fileTypes: Record<string, number> = {};
    let totalSize = 0;

    for (const file of files) {
      try {
        const fileStat = await stat(file);
        totalSize += fileStat.size;

        const ext = file.split(".").pop() ?? "unknown";
        fileTypes[ext] = (fileTypes[ext] ?? 0) + 1;
      } catch {
        // Skip inaccessible files
      }
    }

    return {
      totalFiles: files.filter(f => !f.endsWith("/")).length,
      totalDirs: files.filter(f => f.endsWith("/")).length,
      totalSize,
      fileTypes,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async initializeProjectStructure(path: string, projectType: ProjectTypeType): Promise<void> {
    const readmeContent = `# ${projectType} Project\n\nGenerated by DEVIL AI Agent\n`;

    await writeFile(join(path, "README.md"), readmeContent);

    switch (projectType) {
      case ProjectType.REACT:
        await this.createReactStructure(path);
        break;
      case ProjectType.NEXTJS:
        await this.createNextJsStructure(path);
        break;
      case ProjectType.EXPRESS:
        await this.createExpressStructure(path);
        break;
      case ProjectType.FASTAPI:
        await this.createFastApiStructure(path);
        break;
      case ProjectType.NODE_SERVICE:
        await this.createNodeServiceStructure(path);
        break;
      case ProjectType.TYPESCRIPT:
        await this.createTypeScriptStructure(path);
        break;
      default:
        // Vanilla - just README
        break;
    }
  }

  private async createReactStructure(path: string): Promise<void> {
    await mkdir(join(path, "src", "components"), { recursive: true });
    await mkdir(join(path, "src", "pages"), { recursive: true });
    await mkdir(join(path, "src", "hooks"), { recursive: true });
    await mkdir(join(path, "public"), { recursive: true });

    await writeFile(join(path, "src", "App.tsx"), "// App component\n");
    await writeFile(join(path, "src", "main.tsx"), "// Entry point\n");
    await writeFile(join(path, "package.json"), JSON.stringify({
      name: "devil-react-app",
      version: "1.0.0",
      scripts: { dev: "vite", build: "vite build", test: "vitest" },
      dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
      devDependencies: { "@types/react": "^18.2.0", vite: "^5.0.0", typescript: "^5.0.0" }
    }, null, 2));
  }

  private async createNextJsStructure(path: string): Promise<void> {
    await mkdir(join(path, "app"), { recursive: true });
    await mkdir(join(path, "components"), { recursive: true });
    await mkdir(join(path, "lib"), { recursive: true });

    await writeFile(join(path, "app", "page.tsx"), "// Home page\n");
    await writeFile(join(path, "app", "layout.tsx"), "// Root layout\n");
    await writeFile(join(path, "package.json"), JSON.stringify({
      name: "devil-nextjs-app",
      version: "1.0.0",
      scripts: { dev: "next dev", build: "next build" },
      dependencies: { next: "^14.0.0", react: "^18.2.0", "react-dom": "^18.2.0" }
    }, null, 2));
  }

  private async createExpressStructure(path: string): Promise<void> {
    await mkdir(join(path, "src", "routes"), { recursive: true });
    await mkdir(join(path, "src", "controllers"), { recursive: true });
    await mkdir(join(path, "src", "middleware"), { recursive: true });

    await writeFile(join(path, "src", "app.ts"), "// Express app\n");
    await writeFile(join(path, "package.json"), JSON.stringify({
      name: "devil-express-api",
      version: "1.0.0",
      scripts: { start: "node src/app.js", dev: "nodemon src/app.js" },
      dependencies: { express: "^4.18.0", cors: "^2.8.0" }
    }, null, 2));
  }

  private async createFastApiStructure(path: string): Promise<void> {
    await mkdir(join(path, "app", "routers"), { recursive: true });
    await mkdir(join(path, "app", "models"), { recursive: true });
    await mkdir(join(path, "app", "schemas"), { recursive: true });

    await writeFile(join(path, "app", "main.py"), "# FastAPI app\n");
    await writeFile(join(path, "requirements.txt"), "fastapi==0.104.0\nuvicorn==0.24.0\n");
  }

  private async createNodeServiceStructure(path: string): Promise<void> {
    await mkdir(join(path, "src"), { recursive: true });
    await mkdir(join(path, "tests"), { recursive: true });

    await writeFile(join(path, "src", "index.ts"), "// Entry point\n");
    await writeFile(join(path, "package.json"), JSON.stringify({
      name: "devil-node-service",
      version: "1.0.0",
      scripts: { start: "node dist/index.js", build: "tsc", test: "jest" },
      dependencies: {},
      devDependencies: { typescript: "^5.0.0", jest: "^29.0.0" }
    }, null, 2));
  }

  private async createTypeScriptStructure(path: string): Promise<void> {
    await mkdir(join(path, "src"), { recursive: true });

    await writeFile(join(path, "src", "index.ts"), "// Entry point\n");
    await writeFile(join(path, "package.json"), JSON.stringify({
      name: "devil-typescript-project",
      version: "1.0.0",
      scripts: { build: "tsc", test: "jest" },
      devDependencies: { typescript: "^5.0.0" }
    }, null, 2));
    await writeFile(join(path, "tsconfig.json"), JSON.stringify({
      compilerOptions: { target: "ES2020", strict: true, outDir: "./dist" }
    }, null, 2));
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await cp(srcPath, destPath);
      }
    }
  }

  private async calculateDirectorySize(path: string): Promise<number> {
    let size = 0;
    
    try {
      const entries = await readdir(path, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(path, entry.name);

        if (entry.isDirectory()) {
          size += await this.calculateDirectorySize(fullPath);
        } else {
          const fileStat = await stat(fullPath);
          size += fileStat.size;
        }
      }
    } catch {
      // Ignore errors
    }

    return size;
  }

  private async listFilesRecursive(dir: string, recursive: boolean, baseDir?: string): Promise<string[]> {
    const results: string[] = [];
    const base = baseDir ?? dir;

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = fullPath.replace(base, "").replace(/^\//, "");

        if (entry.isDirectory()) {
          results.push(relativePath + "/");
          if (recursive) {
            const subFiles = await this.listFilesRecursive(fullPath, true, base);
            results.push(...subFiles);
          }
        } else {
          results.push(relativePath);
        }
      }
    } catch {
      // Ignore errors
    }

    return results;
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const workspaceManager = new WorkspaceManager();
