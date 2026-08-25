/**
 * DEVIL Coding Agent Foundation - Code Review Engine
 * 
 * Reviews generated code for:
 * - Syntax issues
 * - Type issues
 * - Security risks
 * - Performance issues
 * - Missing files
 */

import { fileOperationsEngine } from "../fileOperations";
import { workspaceManager } from "../workspace";
import { logEvent } from "../../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

export interface CodeReview {
  workspaceId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  issues: ReviewIssue[];
  recommendations: string[];
  summary: {
    totalFiles: number;
    filesReviewed: number;
    critical: number;
    errors: number;
    warnings: number;
    suggestions: number;
  };
  fileReports: FileReport[];
}

export interface ReviewIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  rule?: string;
}

export type IssueSeverity = "critical" | "error" | "warning" | "suggestion";

export type IssueCategory = 
  | "syntax"
  | "typescript"
  | "security"
  | "performance"
  | "best-practice"
  | "structure"
  | "documentation"
  | "missing";

export interface FileReport {
  file: string;
  score: number;
  issues: ReviewIssue[];
  metrics: {
    lines: number;
    complexity?: number;
    maintainability?: number;
  };
}

// ============================================================================
// REVIEW RULES
// ============================================================================

const REVIEW_RULES: ReviewRule[] = [
  // Security rules
  {
    id: "SEC001",
    category: "security",
    severity: "critical",
    pattern: /eval\s*\(/,
    message: "Use of 'eval' is a security risk",
    suggestion: "Avoid using eval. Use safer alternatives like JSON.parse for data."
  },
  {
    id: "SEC002",
    category: "security",
    severity: "critical",
    pattern: /innerHTML\s*=/,
    message: "Direct innerHTML assignment can lead to XSS",
    suggestion: "Use textContent or sanitize HTML before insertion"
  },
  {
    id: "SEC003",
    category: "security",
    severity: "error",
    pattern: /password\s*=\s*['"`]/i,
    message: "Hardcoded password detected",
    suggestion: "Use environment variables for sensitive data"
  },
  {
    id: "SEC004",
    category: "security",
    severity: "error",
    pattern: /api[_-]?key\s*=\s*['"`]/i,
    message: "Hardcoded API key detected",
    suggestion: "Use environment variables for API keys"
  },
  {
    id: "SEC005",
    category: "security",
    severity: "warning",
    pattern: /process\.env\.[A-Z_]+(?!\w)/,
    message: "Environment variable access without validation",
    suggestion: "Validate and provide defaults for environment variables"
  },

  // TypeScript rules
  {
    id: "TS001",
    category: "typescript",
    severity: "warning",
    pattern: /:\s*any\b/,
    message: "Use of 'any' type loses type safety",
    suggestion: "Define proper types or use 'unknown' with type guards"
  },
  {
    id: "TS002",
    category: "typescript",
    severity: "warning",
    pattern: /@ts-ignore/,
    message: "TypeScript ignore directive found",
    suggestion: "Fix the underlying type issue instead of ignoring it"
  },
  {
    id: "TS003",
    category: "typescript",
    severity: "error",
    pattern: /\.tsx?:\d+:\d+/,
    message: "Potential TypeScript error detected",
    suggestion: "Check for type errors and fix them"
  },

  // Best practice rules
  {
    id: "BP001",
    category: "best-practice",
    severity: "warning",
    pattern: /console\.(log|debug)\s*\(/,
    message: "Console statement found in code",
    suggestion: "Remove console statements or use a proper logging library"
  },
  {
    id: "BP002",
    category: "best-practice",
    severity: "warning",
    pattern: /setTimeout\s*\([^,]+,\s*0\s*\)/,
    message: "setTimeout with 0 delay detected",
    suggestion: "Consider using queueMicrotask or nextTick for async operations"
  },
  {
    id: "BP003",
    category: "best-practice",
    severity: "suggestion",
    pattern: /var\s+\w+/,
    message: "Use of 'var' instead of 'let' or 'const'",
    suggestion: "Use 'let' for mutable values or 'const' for constants"
  },
  {
    id: "BP004",
    category: "best-practice",
    severity: "suggestion",
    pattern: /==(?!=|\s*null)/,
    message: "Use of '==' instead of '==='",
    suggestion: "Use strict equality (===) to avoid type coercion issues"
  },

  // Performance rules
  {
    id: "PER001",
    category: "performance",
    severity: "warning",
    pattern: /\.forEach\s*\(/,
    message: "forEach used instead of more efficient alternatives",
    suggestion: "Consider using for...of or map/filter/reduce for better performance"
  },
  {
    id: "PER002",
    category: "performance",
    severity: "warning",
    pattern: /document\.getElementById|document\.querySelector/,
    message: "DOM query inside render/loop",
    suggestion: "Query DOM outside of render functions or use refs"
  },
  {
    id: "PER003",
    category: "performance",
    severity: "suggestion",
    pattern: /new\s+Object\s*\(/,
    message: "Use object literal instead of 'new Object()'",
    suggestion: "Use {} or Object.create(null) for better performance"
  },

  // Structure rules
  {
    id: "ST001",
    category: "structure",
    severity: "error",
    pattern: /export\s+default\s+/,
    message: "Mixed export styles",
    suggestion: "Consider using named exports for better tree-shaking"
  },
  {
    id: "ST002",
    category: "structure",
    severity: "warning",
    pattern: /import\s+\*\s+as\s+\w+\s+from/,
    message: "Wildcard import may include unused code",
    suggestion: "Import only what you need"
  },

  // Documentation rules
  {
    id: "DOC001",
    category: "documentation",
    severity: "suggestion",
    pattern: /function\s+(\w+)\s*\(/,
    message: "Function without JSDoc comment",
    suggestion: "Add JSDoc comments to improve documentation"
  },
  {
    id: "DOC002",
    category: "documentation",
    severity: "suggestion",
    pattern: /class\s+(\w+)/,
    message: "Class without JSDoc comment",
    suggestion: "Add JSDoc comments to explain class purpose"
  }
];

export interface ReviewRule {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  pattern: RegExp;
  message: string;
  suggestion?: string;
}

// ============================================================================
// CODE REVIEW ENGINE
// ============================================================================

export class CodeReviewEngine {
  /**
   * Perform complete code review on workspace
   */
  async reviewWorkspace(workspaceId: string): Promise<CodeReview> {
    const workspace = await workspaceManager.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "validation_passed",
      severity: "info",
      message: `Starting code review for workspace`,
      details: { workspaceId }
    });

    const files = await fileOperationsEngine.listFilesRecursive(workspaceId);
    const codeFiles = files.filter(f => this.isCodeFile(f));
    const fileReports: FileReport[] = [];
    const allIssues: ReviewIssue[] = [];

    // Review each file
    for (const file of codeFiles) {
      const report = await this.reviewFile(workspaceId, file);
      fileReports.push(report);
      allIssues.push(...report.issues);
    }

    // Check for missing files
    const missingIssues = await this.checkMissingFiles(workspace, fileReports);
    allIssues.push(...missingIssues);

    // Calculate summary
    const summary = {
      totalFiles: codeFiles.length,
      filesReviewed: fileReports.length,
      critical: allIssues.filter(i => i.severity === "critical").length,
      errors: allIssues.filter(i => i.severity === "error").length,
      warnings: allIssues.filter(i => i.severity === "warning").length,
      suggestions: allIssues.filter(i => i.severity === "suggestion").length
    };

    // Calculate overall score
    const overallScore = this.calculateScore(summary);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues);

    await logEvent({
      missionId: workspace.missionId ?? undefined,
      eventType: "validation_passed",
      severity: summary.critical > 0 ? "warning" : "info",
      message: `Code review completed`,
      details: { 
        workspaceId, 
        issues: allIssues.length,
        score: overallScore
      }
    });

    return {
      workspaceId,
      timestamp: new Date(),
      overallScore,
      issues: allIssues,
      recommendations,
      summary,
      fileReports
    };
  }

  /**
   * Review a single file
   */
  async reviewFile(workspaceId: string, filePath: string): Promise<FileReport> {
    const content = await fileOperationsEngine.readFile(workspaceId, filePath);
    const issues: ReviewIssue[] = [];

    if (!content) {
      return {
        file: filePath,
        score: 100,
        issues: [],
        metrics: { lines: 0 }
      };
    }

    const lines = content.content.split("\n");

    // Apply review rules
    for (const rule of REVIEW_RULES) {
      const matches = content.content.match(new RegExp(rule.pattern, "g"));
      
      if (matches) {
        for (const match of matches) {
          // Find line number
          const lineIndex = content.content.indexOf(match);
          const beforeMatch = content.content.substring(0, lineIndex);
          const lineNumber = beforeMatch.split("\n").length;

          issues.push({
            id: `${rule.id}-${issues.length + 1}`,
            severity: rule.severity,
            category: rule.category,
            file: filePath,
            line: lineNumber,
            message: rule.message,
            suggestion: rule.suggestion,
            rule: rule.id
          });
        }
      }
    }

    // Calculate file metrics
    const metrics = {
      lines: lines.length,
      complexity: this.calculateComplexity(content.content),
      maintainability: this.calculateMaintainability(content.content)
    };

    const score = this.calculateFileScore(issues, lines.length);

    return {
      file: filePath,
      score,
      issues,
      metrics
    };
  }

  /**
   * Quick syntax check
   */
  async syntaxCheck(workspaceId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic syntax checks
    const files = await fileOperationsEngine.listFilesRecursive(workspaceId);
    const codeFiles = files.filter(f => this.isCodeFile(f));

    for (const file of codeFiles) {
      const content = await fileOperationsEngine.readFile(workspaceId, file);
      
      if (content) {
        // Check for basic syntax issues
        const syntaxIssues = this.checkBasicSyntax(content.content, file);
        errors.push(...syntaxIssues);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      ".ts", ".tsx", ".js", ".jsx", ".py", ".java",
      ".go", ".rs", ".rb", ".php", ".c", ".cpp", ".cs"
    ];
    
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  private async checkMissingFiles(workspace: any, fileReports: FileReport[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    const reviewedFiles = new Set(fileReports.map(r => r.file));

    // Check for package.json in Node.js projects
    if (workspace.projectType !== "fastapi") {
      if (!reviewedFiles.has("package.json")) {
        issues.push({
          id: "MISS001",
          severity: "error",
          category: "missing",
          file: "package.json",
          message: "package.json is missing",
          suggestion: "Create a package.json with name, version, scripts, and dependencies"
        });
      }

      // Check for README
      if (!reviewedFiles.has("README.md")) {
        issues.push({
          id: "MISS002",
          severity: "warning",
          category: "missing",
          file: "README.md",
          message: "README.md is missing",
          suggestion: "Add a README with project description and setup instructions"
        });
      }
    }

    // Check for requirements.txt in Python projects
    if (workspace.projectType === "fastapi") {
      if (!reviewedFiles.has("requirements.txt")) {
        issues.push({
          id: "MISS003",
          severity: "error",
          category: "missing",
          file: "requirements.txt",
          message: "requirements.txt is missing",
          suggestion: "Create requirements.txt with project dependencies"
        });
      }
    }

    return issues;
  }

  private checkBasicSyntax(content: string, file: string): string[] {
    const errors: string[] = [];
    
    // Check for mismatched brackets
    const brackets: Record<string, string> = { "{": "}", "[": "]", "(": ")" };
    const stack: string[] = [];
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (brackets[char]) {
        stack.push(brackets[char]);
      } else if (Object.values(brackets).includes(char)) {
        if (stack.length === 0 || stack.pop() !== char) {
          errors.push(`${file}:${i}: Mismatched bracket '${char}'`);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`${file}: Unclosed brackets: ${stack.join(", ")}`);
    }

    return errors;
  }

  private calculateComplexity(content: string): number {
    // Simple cyclomatic complexity estimation
    let complexity = 1;
    
    const patterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*[^:]+\s*:/g, // ternary
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateMaintainability(content: string): number {
    // Simplified maintainability index
    const lines = content.split("\n").length;
    const avgLineLength = content.length / lines;
    
    // Score based on line length (ideal: 20-60 chars)
    let score = 100;
    
    if (avgLineLength > 100) score -= 20;
    else if (avgLineLength > 60) score -= 10;
    
    if (lines > 500) score -= 15;
    else if (lines > 200) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateScore(summary: CodeReview["summary"]): number {
    let score = 100;
    
    // Deduct for issues
    score -= summary.critical * 20;
    score -= summary.errors * 10;
    score -= summary.warnings * 3;
    score -= summary.suggestions * 1;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateFileScore(issues: ReviewIssue[], totalLines: number): number {
    if (totalLines === 0) return 100;
    
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case "critical": score -= 15; break;
        case "error": score -= 8; break;
        case "warning": score -= 3; break;
        case "suggestion": score -= 1; break;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(issues: ReviewIssue[]): string[] {
    const recommendations: string[] = [];
    const byCategory = new Map<IssueCategory, ReviewIssue[]>();

    // Group by category
    for (const issue of issues) {
      const categoryIssues = byCategory.get(issue.category) ?? [];
      categoryIssues.push(issue);
      byCategory.set(issue.category, categoryIssues);
    }

    // Generate recommendations
    if (byCategory.has("security")) {
      recommendations.push("🔒 Security: Address all critical security issues before deployment");
    }
    
    if (byCategory.has("typescript")) {
      recommendations.push("📝 Types: Add proper TypeScript types to eliminate 'any' usage");
    }
    
    if (byCategory.has("performance")) {
      recommendations.push("⚡ Performance: Optimize loops and DOM queries for better performance");
    }
    
    if (byCategory.has("documentation")) {
      recommendations.push("📚 Documentation: Add JSDoc comments to improve code documentation");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Code quality is good. No critical issues found.");
    }

    return recommendations;
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const codeReviewEngine = new CodeReviewEngine();
