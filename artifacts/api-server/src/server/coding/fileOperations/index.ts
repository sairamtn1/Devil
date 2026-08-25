/**
 * DEVIL Coding Agent Foundation - File Operations Engine
 * 
 * Safe file operations with audit logging and recovery.
 * - Read, write, edit, delete files
 * - Move, copy files and directories
 * - Create, delete directories
 * - All operations are logged and recoverable
 */

import { logEvent } from "../../control-plane/eventLog";
import { 
  readFile, writeFile, mkdir, rm, cp, rename, 
  readdir, stat, access, constants 
} from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, basename } from "path";
import { diffLines } from "diff";

// ============================================================================
// TYPES
// ============================================================================

export interface FileOperation {
  id: string;
  workspaceId: string;
  operation: FileOperationType;
  path: string;
  content?: string;
  oldContent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
}

export const FileOperationType = {
  READ: "read",
  WRITE: "write",
  EDIT: "edit",
  DELETE: "delete",
  MOVE: "move",
  COPY: "copy",
  CREATE_DIR: "create_dir",
  DELETE_DIR: "delete_dir",
} as const;

export type FileOperationTypeType = (typeof FileOperationType)[keyof typeof FileOperationType];

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  createdAt: Date;
  modifiedAt: Date;
  permissions: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  size: number;
  lineCount: number;
}

export interface EditResult {
  success: boolean;
  oldContent: string;
  newContent: string;
  diff: string;
  linesChanged: number;
}

// ============================================================================
// OPERATION HISTORY (In-memory for Phase 3)
// ============================================================================

const operationHistory: Map<string, FileOperation[]> = new Map();
const MAX_HISTORY_PER_WORKSPACE = 1000;

// ============================================================================
// FILE OPERATIONS ENGINE
// ============================================================================

export class FileOperationsEngine {
  private basePath: string;

  constructor(basePath: string = "/tmp/devil-workspaces") {
    this.basePath = basePath;
  }

  // ==========================================================================
  // FILE OPERATIONS
  // ==========================================================================

  /**
   * Read a file
   */
  async readFile(workspaceId: string, filePath: string, encoding: BufferEncoding = "utf-8"): Promise<FileContent | null> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    if (!existsSync(fullPath)) {
      await this.logOperation(workspaceId, FileOperationType.READ, filePath, null, null, {
        error: "File not found"
      });
      return null;
    }

    try {
      const content = await readFile(fullPath, { encoding });
      const stats = await stat(fullPath);

      const lineCount = content.split("\n").length;

      await this.logOperation(workspaceId, FileOperationType.READ, filePath, null, content);

      return {
        path: filePath,
        content,
        encoding,
        size: stats.size,
        lineCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.READ, filePath, null, null, { error: message });
      return null;
    }
  }

  /**
   * Write content to a file (creates or overwrites)
   */
  async writeFile(workspaceId: string, filePath: string, content: string, userId?: string): Promise<boolean> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    try {
      // Ensure directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      // Read old content for logging
      let oldContent: string | null = null;
      if (existsSync(fullPath)) {
        oldContent = await readFile(fullPath, "utf-8");
      }

      await writeFile(fullPath, content, "utf-8");

      await this.logOperation(workspaceId, FileOperationType.WRITE, filePath, content, oldContent, {
        bytesWritten: content.length
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.WRITE, filePath, content, null, {
        error: message
      }, userId);
      return false;
    }
  }

  /**
   * Edit specific lines in a file
   */
  async editFile(
    workspaceId: string,
    filePath: string,
    edits: { startLine: number; endLine: number; newContent: string }[],
    userId?: string
  ): Promise<EditResult | null> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      const oldContent = await readFile(fullPath, "utf-8");
      const lines = oldContent.split("\n");
      let newContent = [...lines];
      let totalLinesChanged = 0;

      // Apply edits in reverse order to maintain line numbers
      const sortedEdits = [...edits].sort((a, b) => b.startLine - a.startLine);

      for (const edit of sortedEdits) {
        const newLines = edit.newContent.split("\n");
        newContent.splice(edit.startLine - 1, edit.endLine - edit.startLine + 1, ...newLines);
        totalLinesChanged += Math.abs(edit.endLine - edit.startLine + 1);
      }

      const finalContent = newContent.join("\n");

      await writeFile(fullPath, finalContent, "utf-8");

      const diff = this.generateDiff(oldContent, finalContent);

      await this.logOperation(workspaceId, FileOperationType.EDIT, filePath, finalContent, oldContent, {
        linesChanged: totalLinesChanged
      }, userId);

      return {
        success: true,
        oldContent,
        newContent: finalContent,
        diff,
        linesChanged: totalLinesChanged,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.EDIT, filePath, null, null, {
        error: message
      }, userId);
      return null;
    }
  }

  /**
   * Edit using search and replace patterns
   */
  async editFilePattern(
    workspaceId: string,
    filePath: string,
    search: string,
    replace: string,
    options?: { replaceAll?: boolean },
    userId?: string
  ): Promise<EditResult | null> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      const oldContent = await readFile(fullPath, "utf-8");

      let newContent: string;
      let count = 0;

      if (options?.replaceAll) {
        const regex = new RegExp(this.escapeRegex(search), "g");
        newContent = oldContent.replace(regex, replace);
        count = (oldContent.match(regex) || []).length;
      } else {
        if (oldContent.includes(search)) {
          newContent = oldContent.replace(search, replace);
          count = 1;
        } else {
          return null;
        }
      }

      await writeFile(fullPath, newContent, "utf-8");

      const diff = this.generateDiff(oldContent, newContent);

      await this.logOperation(workspaceId, FileOperationType.EDIT, filePath, newContent, oldContent, {
        pattern: search,
        replacement: replace,
        replacements: count
      }, userId);

      return {
        success: true,
        oldContent,
        newContent,
        diff,
        linesChanged: count,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.EDIT, filePath, null, null, {
        error: message
      }, userId);
      return null;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(workspaceId: string, filePath: string, userId?: string): Promise<boolean> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    if (!existsSync(fullPath)) {
      return false;
    }

    try {
      const oldContent = await readFile(fullPath, "utf-8");

      await rm(fullPath);

      await this.logOperation(workspaceId, FileOperationType.DELETE, filePath, null, oldContent, {
        size: oldContent.length
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.DELETE, filePath, null, null, {
        error: message
      }, userId);
      return false;
    }
  }

  /**
   * Move a file or directory
   */
  async moveFile(workspaceId: string, sourcePath: string, destPath: string, userId?: string): Promise<boolean> {
    const fullSource = this.getFullPath(workspaceId, sourcePath);
    const fullDest = this.getFullPath(workspaceId, destPath);
    
    if (!existsSync(fullSource)) {
      return false;
    }

    try {
      // Ensure destination directory exists
      const destDir = dirname(fullDest);
      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true });
      }

      await rename(fullSource, fullDest);

      await this.logOperation(workspaceId, FileOperationType.MOVE, sourcePath, destPath, null, {
        source: sourcePath,
        destination: destPath
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.MOVE, sourcePath, null, null, {
        error: message
      }, userId);
      return false;
    }
  }

  /**
   * Copy a file or directory
   */
  async copyFile(workspaceId: string, sourcePath: string, destPath: string, userId?: string): Promise<boolean> {
    const fullSource = this.getFullPath(workspaceId, sourcePath);
    const fullDest = this.getFullPath(workspaceId, destPath);
    
    if (!existsSync(fullSource)) {
      return false;
    }

    try {
      // Ensure destination directory exists
      const destDir = dirname(fullDest);
      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true });
      }

      await cp(fullSource, fullDest);

      await this.logOperation(workspaceId, FileOperationType.COPY, sourcePath, destPath, null, {
        source: sourcePath,
        destination: destPath
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.COPY, sourcePath, null, null, {
        error: message
      }, userId);
      return false;
    }
  }

  // ==========================================================================
  // DIRECTORY OPERATIONS
  // ==========================================================================

  /**
   * Create a directory
   */
  async createDirectory(workspaceId: string, dirPath: string, userId?: string): Promise<boolean> {
    const fullPath = this.getFullPath(workspaceId, dirPath);
    
    try {
      await mkdir(fullPath, { recursive: true });

      await this.logOperation(workspaceId, FileOperationType.CREATE_DIR, dirPath, null, null, {
        recursive: true
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.CREATE_DIR, dirPath, null, null, {
        error: message
      }, userId);
      return false;
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(workspaceId: string, dirPath: string, recursive: boolean = true, userId?: string): Promise<boolean> {
    const fullPath = this.getFullPath(workspaceId, dirPath);
    
    if (!existsSync(fullPath)) {
      return false;
    }

    try {
      await rm(fullPath, { recursive });

      await this.logOperation(workspaceId, FileOperationType.DELETE_DIR, dirPath, null, null, {
        recursive
      }, userId);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logOperation(workspaceId, FileOperationType.DELETE_DIR, dirPath, null, null, {
        error: message
      }, userId);
      return false;
    }
  }

  // ==========================================================================
  // FILE INFO & LISTING
  // ==========================================================================

  /**
   * Get file information
   */
  async getFileInfo(workspaceId: string, filePath: string): Promise<FileInfo | null> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    
    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      const stats = await stat(fullPath);

      return {
        path: filePath,
        name: basename(filePath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        extension: this.getExtension(filePath),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        permissions: this.formatPermissions(stats.mode),
      };
    } catch {
      return null;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(workspaceId: string, dirPath: string = ""): Promise<FileInfo[]> {
    const fullPath = this.getFullPath(workspaceId, dirPath || ".");
    
    if (!existsSync(fullPath)) {
      return [];
    }

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      const results: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
        const fullEntryPath = this.getFullPath(workspaceId, entryPath);

        try {
          const stats = await stat(fullEntryPath);

          results.push({
            path: entryPath,
            name: entry.name,
            size: stats.size,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            extension: entry.isFile() ? this.getExtension(entry.name) : "",
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            permissions: this.formatPermissions(stats.mode),
          });
        } catch {
          // Skip inaccessible files
        }
      }

      return results.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch {
      return [];
    }
  }

  /**
   * List files recursively
   */
  async listFilesRecursive(workspaceId: string, dirPath: string = ""): Promise<string[]> {
    const fullPath = this.getFullPath(workspaceId, dirPath || ".");
    const results: string[] = [];

    if (!existsSync(fullPath)) {
      return results;
    }

    const entries = await readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        results.push(entryPath + "/");
        const subFiles = await this.listFilesRecursive(workspaceId, entryPath);
        results.push(...subFiles);
      } else {
        results.push(entryPath);
      }
    }

    return results;
  }

  /**
   * Check if file/directory exists
   */
  async exists(workspaceId: string, filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(workspaceId, filePath);
    return existsSync(fullPath);
  }

  // ==========================================================================
  // HISTORY & RECOVERY
  // ==========================================================================

  /**
   * Get operation history for a workspace
   */
  getOperationHistory(workspaceId: string, limit: number = 100): FileOperation[] {
    const history = operationHistory.get(workspaceId) ?? [];
    return history.slice(-limit);
  }

  /**
   * Recover a file to a previous state
   */
  async recoverFile(workspaceId: string, filePath: string, operationIndex: number): Promise<boolean> {
    const history = operationHistory.get(workspaceId) ?? [];
    const operation = history[operationIndex];

    if (!operation || operation.path !== filePath) {
      return false;
    }

    if (operation.oldContent !== null) {
      return this.writeFile(workspaceId, filePath, operation.oldContent, "recovery");
    }

    return false;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private getFullPath(workspaceId: string, filePath: string): string {
    return join(this.basePath, workspaceId, filePath);
  }

  private getExtension(filePath: string): string {
    const parts = filePath.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  }

  private formatPermissions(mode: number): string {
    const perms = [];
    perms.push((mode & 0o100) ? "r" : "-");
    perms.push((mode & 0o80) ? "w" : "-");
    perms.push((mode & 0o40) ? "x" : "-");
    perms.push((mode & 0o20) ? "r" : "-");
    perms.push((mode & 0o10) ? "w" : "-");
    perms.push((mode & 0o8) ? "x" : "-");
    perms.push((mode & 0o4) ? "r" : "-");
    perms.push((mode & 0o2) ? "w" : "-");
    perms.push((mode & 0o1) ? "x" : "-");
    return perms.join("");
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private generateDiff(oldContent: string, newContent: string): string {
    const changes = diffLines(oldContent, newContent);
    let diff = "";

    for (const change of changes) {
      if (change.added) {
        diff += `+ ${change.value}\n`;
      } else if (change.removed) {
        diff += `- ${change.value}\n`;
      }
    }

    return diff;
  }

  private async logOperation(
    workspaceId: string,
    operation: FileOperationTypeType,
    path: string,
    content: string | null,
    oldContent: string | null,
    metadata?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    const op: FileOperation = {
      id: `fop-${crypto.randomUUID()}`,
      workspaceId,
      operation,
      path,
      content,
      oldContent,
      metadata,
      timestamp: new Date(),
      userId,
    };

    // Store in history
    const history = operationHistory.get(workspaceId) ?? [];
    history.push(op);

    // Limit history size
    if (history.length > MAX_HISTORY_PER_WORKSPACE) {
      history.shift();
    }

    operationHistory.set(workspaceId, history);

    // Emit event
    await logEvent({
      missionId: workspaceId, // Using workspaceId as missionId for now
      eventType: operation.includes("tool") ? "tool_completed" : "checkpoint_created",
      severity: "info",
      message: `File operation: ${operation} ${path}`,
      details: { operation, path, workspaceId, ...metadata },
    });
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const fileOperationsEngine = new FileOperationsEngine();
