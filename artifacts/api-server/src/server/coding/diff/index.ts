/**
 * DEVIL Coding Agent Foundation - Diff Engine
 * 
 * Generates file and line diffs for change tracking.
 */

import { fileOperationsEngine } from "../fileOperations";
import { diffLines, diffWords, diffChars } from "diff";
import { logEvent } from "../../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

export interface FileDiff {
  path: string;
  status: DiffStatus;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  raw: string;
}

export type DiffStatus = "added" | "deleted" | "modified" | "unchanged";

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface WorkspaceDiff {
  workspaceId: string;
  baseSnapshot?: string;
  files: FileDiff[];
  summary: {
    totalFiles: number;
    filesAdded: number;
    filesDeleted: number;
    filesModified: number;
    totalAdditions: number;
    totalDeletions: number;
  };
  timestamp: Date;
}

export interface LineDiff {
  oldLineNumber: number;
  newLineNumber: number;
  type: "add" | "remove" | "modify";
  oldContent: string;
  newContent: string;
}

// ============================================================================
// DIFF ENGINE
// ============================================================================

export class DiffEngine {
  /**
   * Compare two files
   */
  async diffFiles(
    workspaceId: string,
    oldPath: string,
    newPath: string
  ): Promise<FileDiff | null> {
    const [oldContent, newContent] = await Promise.all([
      fileOperationsEngine.readFile(workspaceId, oldPath),
      fileOperationsEngine.readFile(workspaceId, newPath)
    ]);

    if (!oldContent && !newContent) {
      return null;
    }

    const oldText = oldContent?.content ?? "";
    const newText = newContent?.content ?? "";

    return this.generateFileDiff(newPath, oldText, newText);
  }

  /**
   * Compare content to empty (for new files)
   */
  async diffNewFile(workspaceId: string, filePath: string): Promise<FileDiff | null> {
    const content = await fileOperationsEngine.readFile(workspaceId, filePath);
    
    if (!content) {
      return null;
    }

    return this.generateFileDiff(filePath, "", content.content, "added");
  }

  /**
   * Compare content to empty (for deleted files)
   */
  async diffDeletedFile(workspaceId: string, filePath: string): Promise<FileDiff | null> {
    const content = await fileOperationsEngine.readFile(workspaceId, filePath);
    
    if (!content) {
      return null;
    }

    return this.generateFileDiff(filePath, content.content, "", "deleted");
  }

  /**
   * Generate workspace diff
   */
  async diffWorkspace(workspaceId: string, baseSnapshot?: string): Promise<WorkspaceDiff> {
    const files = await fileOperationsEngine.listFilesRecursive(workspaceId);
    
    const diffs: FileDiff[] = [];
    let filesAdded = 0;
    let filesDeleted = 0;
    let filesModified = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const file of files) {
      if (file.endsWith("/")) continue; // Skip directories
      
      const diff = await this.diffNewFile(workspaceId, file);
      if (diff) {
        diffs.push(diff);
        
        switch (diff.status) {
          case "added":
            filesAdded++;
            totalAdditions += diff.additions;
            break;
          case "deleted":
            filesDeleted++;
            totalDeletions += diff.deletions;
            break;
          case "modified":
            filesModified++;
            totalAdditions += diff.additions;
            totalDeletions += diff.deletions;
            break;
        }
      }
    }

    await logEvent({
      missionId: workspaceId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Workspace diff generated`,
      details: { 
        workspaceId, 
        filesAdded, 
        filesModified, 
        filesDeleted,
        totalChanges: totalAdditions + totalDeletions
      }
    });

    return {
      workspaceId,
      baseSnapshot,
      files: diffs,
      summary: {
        totalFiles: files.length,
        filesAdded,
        filesDeleted,
        filesModified,
        totalAdditions,
        totalDeletions
      },
      timestamp: new Date()
    };
  }

  /**
   * Generate line-by-line diff
   */
  async diffLines(workspaceId: string, filePath: string): Promise<LineDiff[]> {
    const content = await fileOperationsEngine.readFile(workspaceId, filePath);
    
    if (!content) {
      return [];
    }

    const changes = diffLines("", content.content);
    const lineDiffs: LineDiff[] = [];
    let oldLine = 0;
    let newLine = 0;

    for (const change of changes) {
      const lines = change.value.split("\n").filter((_, i, arr) => 
        i < arr.length - 1 || arr[i] !== ""
      );

      for (const line of lines) {
        if (change.added) {
          newLine++;
          lineDiffs.push({
            oldLineNumber: oldLine,
            newLineNumber: newLine,
            type: "add",
            oldContent: "",
            newContent: line
          });
        } else if (change.removed) {
          oldLine++;
          lineDiffs.push({
            oldLineNumber: oldLine,
            newLineNumber: newLine,
            type: "remove",
            oldContent: line,
            newContent: ""
          });
        } else {
          oldLine++;
          newLine++;
          lineDiffs.push({
            oldLineNumber: oldLine,
            newLineNumber: newLine,
            type: "modify",
            oldContent: line,
            newContent: line
          });
        }
      }
    }

    return lineDiffs;
  }

  /**
   * Generate unified diff string
   */
  async generateUnifiedDiff(
    workspaceId: string,
    oldPath: string,
    newPath: string,
    context: number = 3
  ): Promise<string> {
    const [oldContent, newContent] = await Promise.all([
      fileOperationsEngine.readFile(workspaceId, oldPath),
      fileOperationsEngine.readFile(workspaceId, newPath)
    ]);

    const oldText = oldContent?.content ?? "";
    const newText = newContent?.content ?? "";

    const changes = diffLines(oldText, newText);
    
    let result = `--- ${oldPath}\n+++ ${newPath}\n`;
    let oldLine = 1;
    let newLine = 1;
    let hunkStart = 0;
    let hunkLines: string[] = [];
    let inHunk = false;

    const flushHunk = () => {
      if (hunkLines.length > 0) {
        const start = Math.max(0, hunkLines.length - context * 2 - 1);
        result += `@@ -${oldLine},${hunkLines.filter(l => !l.startsWith("+")).length} +${newLine},${hunkLines.filter(l => !l.startsWith("-")).length} @@\n`;
        result += hunkLines.join("\n") + "\n";
        hunkLines = [];
      }
      inHunk = false;
    };

    for (const change of changes) {
      const lines = change.value.split("\n");
      lines.pop(); // Remove empty last element

      for (const line of lines) {
        if (change.added) {
          newLine++;
          if (!inHunk) {
            oldLine--;
            inHunk = true;
          }
          hunkLines.push("+" + line);
        } else if (change.removed) {
          oldLine++;
          if (!inHunk) {
            newLine--;
            inHunk = true;
          }
          hunkLines.push("-" + line);
        } else {
          if (inHunk) {
            hunkLines.push(" " + line);
            if (hunkLines.length >= context * 2 + 1) {
              flushHunk();
            }
          }
          oldLine++;
          newLine++;
        }
      }
    }

    flushHunk();

    return result;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateFileDiff(
    path: string,
    oldContent: string,
    newContent: string,
    forcedStatus?: DiffStatus
  ): FileDiff {
    const changes = diffLines(oldContent, newContent);
    
    let additions = 0;
    let deletions = 0;
    let oldLine = 1;
    let newLine = 1;
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    const rawLines: string[] = [];

    for (const change of changes) {
      const lines = change.value.split("\n");
      lines.pop(); // Remove trailing empty

      for (const line of lines) {
        rawLines.push(
          change.added ? `+${line}` :
          change.removed ? `-${line}` :
          ` ${line}`
        );

        if (change.added) {
          additions++;
          newLine++;
          
          if (!currentHunk) {
            currentHunk = {
              header: `@@ -${oldLine} +${newLine - 1} @@`,
              lines: [],
              oldStart: oldLine,
              oldLines: 0,
              newStart: newLine - 1,
              newLines: 0
            };
          }
          
          currentHunk.lines.push({
            type: "add",
            content: line,
            newLineNumber: newLine - 1
          });
          currentHunk.newLines++;
        } else if (change.removed) {
          deletions++;
          oldLine++;
          
          if (!currentHunk) {
            currentHunk = {
              header: `@@ -${oldLine - 1} +${newLine} @@`,
              lines: [],
              oldStart: oldLine - 1,
              oldLines: 0,
              newStart: newLine,
              newLines: 0
            };
          }
          
          currentHunk.lines.push({
            type: "remove",
            content: line,
            oldLineNumber: oldLine - 1
          });
          currentHunk.oldLines++;
        } else {
          oldLine++;
          newLine++;
          
          if (currentHunk) {
            currentHunk.lines.push({
              type: "context",
              content: line,
              oldLineNumber: oldLine - 1,
              newLineNumber: newLine - 1
            });
            
            // End hunk after context lines
            if (currentHunk.lines.length > 10) {
              hunks.push(currentHunk);
              currentHunk = null;
            }
          }
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    // Determine status
    let status: DiffStatus;
    if (forcedStatus) {
      status = forcedStatus;
    } else if (additions === 0 && deletions === 0) {
      status = "unchanged";
    } else if (oldContent === "") {
      status = "added";
    } else if (newContent === "") {
      status = "deleted";
    } else {
      status = "modified";
    }

    return {
      path,
      status,
      additions,
      deletions,
      hunks,
      raw: rawLines.join("\n")
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const diffEngine = new DiffEngine();
