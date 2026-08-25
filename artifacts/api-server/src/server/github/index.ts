/**
 * DEVIL GitHub Agent Foundation
 * 
 * Repository-aware software engineering capabilities.
 * - Analyze repositories
 * - Manage branches
 * - Generate commits
 * - Create pull requests
 * - Track repository state
 */

import { logEvent } from "../control-plane/eventLog";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface GitHubConfig {
  token?: string;
  workingDir?: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  localPath?: string;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
  description?: string;
  createdAt: Date;
  lastAnalyzed?: Date;
}

export interface RepositoryAnalysis {
  repository: Repository;
  languages: LanguageInfo[];
  frameworks: string[];
  packageManagers: string[];
  buildSystems: string[];
  testSystems: string[];
  hasDockerfile: boolean;
  hasCI: boolean;
  hasGitHubActions: boolean;
  structure: RepositoryStructure;
  summary: string;
  architectureSummary: string;
  riskLevel: "low" | "medium" | "high";
  risks: RiskItem[];
  suggestions: Suggestion[];
  analyzedAt: Date;
}

export interface LanguageInfo {
  name: string;
  percentage: number;
  files: number;
  lines: number;
}

export interface RepositoryStructure {
  rootFiles: string[];
  directories: string[];
  sourceDirs: string[];
  configFiles: string[];
  testDirs: string[];
  docFiles: string[];
}

export interface RiskItem {
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
  recommendation: string;
}

export interface Suggestion {
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedEffort: "small" | "medium" | "large";
}

export interface Branch {
  name: string;
  isProtected: boolean;
  isDefault: boolean;
  lastCommit: string;
  lastCommitDate: Date;
  aheadBy: number;
  behindBy: number;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: Date;
  files: string[];
  additions: number;
  deletions: number;
}

export interface CommitRequest {
  message: string;
  files: string[];
  branch?: string;
}

export interface CommitResult {
  success: boolean;
  hash?: string;
  message?: string;
  files?: string[];
  riskScore?: number;
  error?: string;
}

export interface PullRequest {
  number?: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  changedFiles: string[];
  additions: number;
  deletions: number;
  draft: boolean;
}

export interface PullRequestResult {
  success: boolean;
  url?: string;
  number?: number;
  title?: string;
  error?: string;
}

export interface AuditEntry {
  id: string;
  action: GitHubAction;
  repository: string;
  details: Record<string, unknown>;
  actor: string;
  timestamp: Date;
  approved?: boolean;
  approvedBy?: string;
}

export type GitHubAction =
  | "clone"
  | "fetch"
  | "branch_create"
  | "branch_delete"
  | "commit"
  | "pr_create"
  | "pr_view"
  | "analyze";

// ============================================================================
// GITHub AGENT
// ============================================================================

export class GitHubAgent {
  private token?: string;
  private workingDir: string;
  private repositories: Map<string, Repository> = new Map();
  private auditLog: AuditEntry[] = [];
  private memoryStore: Map<string, unknown> = new MemoryStore();

  constructor(config?: GitHubConfig) {
    this.token = config?.token;
    this.workingDir = config?.workingDir ?? "/tmp/devil-github";
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    try {
      await mkdir(this.workingDir, { recursive: true });
      
      await logEvent({
        eventType: "system_recovery",
        severity: "info",
        message: "GitHub agent initialized",
        details: { workingDir: this.workingDir }
      });
    } catch (error) {
      console.error("Failed to initialize GitHub agent:", error);
    }
  }

  // ==========================================================================
  // REPOSITORY CLONE & FETCH
  // ==========================================================================

  async cloneRepository(url: string, branch?: string): Promise<Repository> {
    const repoId = randomUUID();
    const repoName = this.extractRepoName(url);
    const localPath = join(this.workingDir, repoId);

    try {
      await mkdir(localPath, { recursive: true });

      let cloneUrl = url;
      if (this.token && url.includes("github.com")) {
        cloneUrl = url.replace("https://", `https://x-access-token:${this.token}@`);
      }

      const branchFlag = branch ? `-b ${branch}` : "";
      await execAsync(`git clone ${branchFlag} ${cloneUrl} "${localPath}"`);

      // Get repo info
      const remotes = await this.execGit(localPath, "remote -v");
      const defaultBranch = await this.getDefaultBranch(localPath);

      const repository: Repository = {
        id: repoId,
        name: repoName,
        owner: this.extractOwner(url),
        url,
        localPath,
        defaultBranch,
        isPrivate: false,
        createdAt: new Date(),
      };

      this.repositories.set(repoId, repository);

      await this.logAction("clone", repoName, { url, branch, localPath }, "system");

      await logEvent({
        eventType: "checkpoint_created",
        severity: "info",
        message: `Repository cloned: ${repoName}`,
        details: { repository: repoName, localPath }
      });

      return repository;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logAction("clone", url, { error: message }, "system");
      throw new Error(`Failed to clone repository: ${message}`);
    }
  }

  async fetch(repositoryId: string): Promise<void> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    try {
      await this.execGit(repo.localPath, "fetch --all");
      await this.logAction("fetch", repo.name, {}, "system");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch: ${message}`);
    }
  }

  // ==========================================================================
  // REPOSITORY ANALYSIS
  // ==========================================================================

  async analyzeRepository(repositoryId: string): Promise<RepositoryAnalysis> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    const analysis: RepositoryAnalysis = {
      repository: repo,
      languages: [],
      frameworks: [],
      packageManagers: [],
      buildSystems: [],
      testSystems: [],
      hasDockerfile: false,
      hasCI: false,
      hasGitHubActions: false,
      structure: {
        rootFiles: [],
        directories: [],
        sourceDirs: [],
        configFiles: [],
        testDirs: [],
        docFiles: [],
      },
      summary: "",
      architectureSummary: "",
      riskLevel: "low",
      risks: [],
      suggestions: [],
      analyzedAt: new Date(),
    };

    try {
      // Analyze languages
      analysis.languages = await this.analyzeLanguages(repo.localPath);

      // Detect frameworks
      analysis.frameworks = await this.detectFrameworks(repo.localPath);

      // Detect package managers
      analysis.packageManagers = await this.detectPackageManagers(repo.localPath);

      // Detect build systems
      analysis.buildSystems = await this.detectBuildSystems(repo.localPath);

      // Detect test systems
      analysis.testSystems = await this.detectTestSystems(repo.localPath);

      // Check for Docker
      analysis.hasDockerfile = existsSync(join(repo.localPath, "Dockerfile")) ||
                               existsSync(join(repo.localPath, "docker-compose.yml"));

      // Check for CI/CD
      analysis.hasGitHubActions = existsSync(join(repo.localPath, ".github/workflows"));

      // Analyze structure
      analysis.structure = await this.analyzeStructure(repo.localPath);

      // Generate summaries
      analysis.summary = this.generateSummary(analysis);
      analysis.architectureSummary = this.generateArchitectureSummary(analysis);

      // Identify risks
      analysis.risks = this.identifyRisks(analysis);
      analysis.suggestions = this.generateSuggestions(analysis);

      // Calculate risk level
      const highRisks = analysis.risks.filter(r => r.severity === "high").length;
      const mediumRisks = analysis.risks.filter(r => r.severity === "medium").length;
      
      if (highRisks > 0) analysis.riskLevel = "high";
      else if (mediumRisks > 2) analysis.riskLevel = "high";
      else if (mediumRisks > 0) analysis.riskLevel = "medium";

      // Update repo
      repo.lastAnalyzed = new Date();

      await this.logAction("analyze", repo.name, { 
        languages: analysis.languages.length,
        riskLevel: analysis.riskLevel
      }, "system");

      await logEvent({
        eventType: "checkpoint_created",
        severity: "info",
        message: `Repository analyzed: ${repo.name}`,
        details: { repository: repo.name, riskLevel: analysis.riskLevel }
      });

      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to analyze repository: ${message}`);
    }
  }

  // ==========================================================================
  // BRANCH MANAGEMENT
  // ==========================================================================

  async createBranch(repositoryId: string, branchName: string, baseBranch?: string): Promise<Branch> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    try {
      const currentBranch = await this.getCurrentBranch(repo.localPath);
      const target = baseBranch ?? currentBranch;

      await this.execGit(repo.localPath, `checkout -b ${branchName} ${target}`);
      await this.execGit(repo.localPath, `push -u origin ${branchName}`);

      await this.logAction("branch_create", repo.name, { branch: branchName, base: target }, "system");

      await logEvent({
        eventType: "checkpoint_created",
        severity: "info",
        message: `Branch created: ${branchName}`,
        details: { repository: repo.name, branch: branchName }
      });

      return {
        name: branchName,
        isProtected: false,
        isDefault: false,
        lastCommit: await this.getLastCommit(repo.localPath),
        lastCommitDate: new Date(),
        aheadBy: 0,
        behindBy: 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create branch: ${message}`);
    }
  }

  async listBranches(repositoryId: string): Promise<Branch[]> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    try {
      const output = await this.execGit(repo.localPath, "branch -a");
      const lines = output.split("\n").filter(l => l.trim());
      const branches: Branch[] = [];

      for (const line of lines) {
        const name = line.replace(/^\*?\s*/, "").trim();
        const isCurrent = line.includes("*");
        
        if (name && !name.includes("->")) {
          branches.push({
            name: name.replace(/^remotes\/origin\//, ""),
            isProtected: ["main", "master", "develop"].some(p => name.includes(p)),
            isDefault: name === repo.defaultBranch || (isCurrent && name === repo.defaultBranch),
            lastCommit: isCurrent ? await this.getLastCommit(repo.localPath) : "",
            lastCommitDate: new Date(),
            aheadBy: 0,
            behindBy: 0,
          });
        }
      }

      return branches;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list branches: ${message}`);
    }
  }

  async checkoutBranch(repositoryId: string, branchName: string): Promise<void> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    try {
      await this.execGit(repo.localPath, `checkout ${branchName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to checkout branch: ${message}`);
    }
  }

  // ==========================================================================
  // COMMIT MANAGEMENT
  // ==========================================================================

  async generateCommitMessage(changes: { files: string[]; diff?: string }): Promise<{
    type: string;
    scope?: string;
    message: string;
    body?: string;
  }> {
    // Analyze changes to generate appropriate commit message
    const types = ["feat", "fix", "refactor", "docs", "test", "chore", "perf", "ci"];
    
    // Simple heuristic based on file changes
    let type = "chore";
    let scope = "";
    let message = "";

    const hasTest = changes.files.some(f => f.includes("test") || f.includes("spec"));
    const hasDocs = changes.files.some(f => f.includes("README") || f.includes("docs"));
    const hasConfig = changes.files.some(f => 
      f.includes("config") || f.includes(".json") || f.includes(".yaml")
    );

    if (hasTest) type = "test";
    else if (hasDocs) type = "docs";
    else if (hasConfig) type = "chore";

    // Generate message based on file patterns
    const mainFiles = changes.files.slice(0, 3).map(f => {
      const parts = f.split("/");
      return parts[parts.length - 1].replace(/\.[^.]+$/, "");
    });

    message = mainFiles.length > 1 
      ? `update ${mainFiles.slice(0, 2).join(" and ")}`
      : `update ${mainFiles[0]}`;

    return {
      type,
      scope,
      message,
      body: `Changes in ${changes.files.length} file(s)`
    };
  }

  async createCommit(repositoryId: string, request: CommitRequest): Promise<CommitResult> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      return { success: false, error: "Repository not found" };
    }

    try {
      // Stage files
      const fileList = request.files.join(" ");
      await this.execGit(repo.localPath, `add ${fileList}`);

      // Check staged changes
      const status = await this.execGit(repo.localPath, "status --porcelain");
      if (!status.trim()) {
        return { success: false, error: "No changes to commit" };
      }

      // Get diff for risk analysis
      const diff = await this.execGit(repo.localPath, "diff --staged");
      const riskScore = this.calculateRiskScore(diff);

      // Create commit
      const fullMessage = request.message;
      await this.execGit(repo.localPath, `commit -m "${fullMessage.replace(/"/g, '\\"')}"`);

      // Get commit hash
      const hash = await this.execGit(repo.localPath, "rev-parse HEAD");

      // Push to remote
      const currentBranch = await this.getCurrentBranch(repo.localPath);
      await this.execGit(repo.localPath, `push origin ${currentBranch}`);

      await this.logAction("commit", repo.name, { 
        hash: hash.substring(0, 7), 
        message: request.message,
        files: request.files 
      }, "system");

      await logEvent({
        eventType: "checkpoint_created",
        severity: "info",
        message: `Commit created: ${hash.substring(0, 7)}`,
        details: { repository: repo.name, hash, message: request.message }
      });

      return {
        success: true,
        hash,
        message: request.message,
        files: request.files,
        riskScore
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async getCommitHistory(repositoryId: string, limit: number = 50): Promise<Commit[]> {
    const repo = this.repositories.get(repositoryId);
    if (!repo || !repo.localPath) {
      throw new Error("Repository not found or not cloned locally");
    }

    try {
      const output = await this.execGit(
        repo.localPath,
        `log --format="%H|%s|%an|%ae|%ai" -n ${limit}`
      );

      const lines = output.split("\n").filter(l => l.trim());
      const commits: Commit[] = [];

      for (const line of lines) {
        const [hash, message, author, email, date] = line.split("|");
        
        commits.push({
          hash,
          message,
          author,
          authorEmail: email,
          date: new Date(date),
          files: [],
          additions: 0,
          deletions: 0
        });
      }

      return commits;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get commit history: ${message}`);
    }
  }

  // ==========================================================================
  // PULL REQUEST MANAGEMENT
  // ==========================================================================

  async createPullRequest(
    repositoryId: string,
    pr: PullRequest
  ): Promise<PullRequestResult> {
    const repo = this.repositories.get(repositoryId);
    if (!repo) {
      return { success: false, error: "Repository not found" };
    }

    try {
      // Use GitHub CLI if available, otherwise use API
      const ghAvailable = await this.isGhAvailable();
      
      if (ghAvailable && this.token) {
        const bodyFile = `/tmp/pr-body-${randomUUID()}.txt`;
        await writeFile(bodyFile, pr.description);

        const draftFlag = pr.draft ? "--draft" : "";
        const result = await execAsync(
          `gh pr create --repo ${repo.owner}/${repo.name} --title "${pr.title}" --body-file "${bodyFile}" --base ${pr.targetBranch} ${draftFlag}`,
          {
            env: { ...process.env, GH_TOKEN: this.token, GITHUB_TOKEN: this.token }
          }
        );

        await this.logAction("pr_create", repo.name, { 
          title: pr.title, 
          source: pr.sourceBranch, 
          target: pr.targetBranch 
        }, "system");

        return {
          success: true,
          url: result.stdout.trim(),
        };
      }

      // Fallback: Return instructions for manual PR creation
      await this.logAction("pr_create", repo.name, { 
        title: pr.title, 
        source: pr.sourceBranch, 
        target: pr.targetBranch,
        manual: true
      }, "system");

      return {
        success: true,
        url: `https://github.com/${repo.owner}/${repo.name}/compare/${pr.targetBranch}...${pr.sourceBranch}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // ==========================================================================
  // AUDIT LOG
  // ==========================================================================

  getAuditLog(repositoryId?: string): AuditEntry[] {
    if (repositoryId) {
      const repo = this.repositories.get(repositoryId);
      if (repo) {
        return this.auditLog.filter(e => e.repository === repo.name);
      }
    }
    return [...this.auditLog];
  }

  private async logAction(
    action: GitHubAction,
    repository: string,
    details: Record<string, unknown>,
    actor: string
  ): Promise<void> {
    const entry: AuditEntry = {
      id: randomUUID(),
      action,
      repository,
      details,
      actor,
      timestamp: new Date(),
    };

    this.auditLog.push(entry);

    // Keep last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async execGit(cwd: string, command: string): Promise<string> {
    const { stdout } = await execAsync(command, { cwd, timeout: 30000 });
    return stdout.trim();
  }

  private extractRepoName(url: string): string {
    const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
    return match?.[1] ?? "unknown";
  }

  private extractOwner(url: string): string {
    const match = url.match(/github\.com[/:]([^\/]+)/);
    return match?.[1] ?? "unknown";
  }

  private async getDefaultBranch(cwd: string): Promise<string> {
    try {
      return await this.execGit(cwd, "rev-parse --abbrev-ref HEAD");
    } catch {
      return "main";
    }
  }

  private async getCurrentBranch(cwd: string): Promise<string> {
    return await this.execGit(cwd, "rev-parse --abbrev-ref HEAD");
  }

  private async getLastCommit(cwd: string): Promise<string> {
    try {
      return await this.execGit(cwd, "log -1 --format=%H");
    } catch {
      return "";
    }
  }

  private async isGhAvailable(): Promise<boolean> {
    try {
      await execAsync("which gh");
      return true;
    } catch {
      return false;
    }
  }

  private async analyzeLanguages(cwd: string): Promise<LanguageInfo[]> {
    try {
      const output = await this.execGit(cwd, "ls-files");
      const files = output.split("\n").filter(f => f.trim());

      const extensions: Record<string, string> = {
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".py": "Python",
        ".java": "Java",
        ".go": "Go",
        ".rs": "Rust",
        ".rb": "Ruby",
        ".php": "PHP",
        ".cs": "C#",
        ".cpp": "C++",
        ".c": "C",
        ".swift": "Swift",
        ".kt": "Kotlin",
      };

      const counts: Record<string, number> = {};
      
      for (const file of files) {
        const ext = "." + file.split(".").pop();
        if (extensions[ext]) {
          counts[extensions[ext]] = (counts[extensions[ext]] ?? 0) + 1;
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          percentage: Math.round((count / total) * 100),
          files: count,
          lines: 0
        }))
        .sort((a, b) => b.percentage - a.percentage);
    } catch {
      return [];
    }
  }

  private async detectFrameworks(cwd: string): Promise<string[]> {
    const frameworks: string[] = [];
    
    try {
      const pkgFiles = await this.findFiles(cwd, "package.json");
      const reqFiles = await this.findFiles(cwd, "requirements.txt");
      
      for (const file of pkgFiles) {
        const content = await readFile(join(cwd, file), "utf-8");
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.react) frameworks.push("React");
        if (deps.next) frameworks.push("Next.js");
        if (deps.vue) frameworks.push("Vue");
        if (deps.angular) frameworks.push("Angular");
        if (deps.express) frameworks.push("Express");
        if (deps.fastify) frameworks.push("Fastify");
      }
      
      for (const file of reqFiles) {
        const content = await readFile(join(cwd, file), "utf-8");
        if (content.includes("fastapi")) frameworks.push("FastAPI");
        if (content.includes("django")) frameworks.push("Django");
        if (content.includes("flask")) frameworks.push("Flask");
      }
    } catch {
      // Ignore errors
    }

    return [...new Set(frameworks)];
  }

  private async detectPackageManagers(cwd: string): Promise<string[]> {
    const managers: string[] = [];
    
    if (existsSync(join(cwd, "package.json"))) managers.push("npm");
    if (existsSync(join(cwd, "pnpm-lock.yaml"))) managers.push("pnpm");
    if (existsSync(join(cwd, "yarn.lock"))) managers.push("yarn");
    if (existsSync(join(cwd, "requirements.txt"))) managers.push("pip");
    if (existsSync(join(cwd, "Pipfile"))) managers.push("pipenv");
    if (existsSync(join(cwd, "go.mod"))) managers.push("go");
    if (existsSync(join(cwd, "Cargo.toml"))) managers.push("cargo");
    if (existsSync(join(cwd, "Gemfile"))) managers.push("bundler");

    return managers;
  }

  private async detectBuildSystems(cwd: string): Promise<string[]> {
    const systems: string[] = [];
    
    if (existsSync(join(cwd, "Makefile"))) systems.push("Make");
    if (existsSync(join(cwd, "CMakeLists.txt"))) systems.push("CMake");
    if (existsSync(join(cwd, "webpack.config.js"))) systems.push("Webpack");
    if (existsSync(join(cwd, "vite.config.ts"))) systems.push("Vite");
    if (existsSync(join(cwd, "tsconfig.json"))) systems.push("TypeScript");
    if (existsSync(join(cwd, "gradlew"))) systems.push("Gradle");
    if (existsSync(join(cwd, "pom.xml"))) systems.push("Maven");

    return systems;
  }

  private async detectTestSystems(cwd: string): Promise<string[]> {
    const systems: string[] = [];
    
    if (existsSync(join(cwd, "jest.config.js"))) systems.push("Jest");
    if (existsSync(join(cwd, "vitest.config.ts"))) systems.push("Vitest");
    if (existsSync(join(cwd, "pytest.ini")) || existsSync(join(cwd, "pytest.cfg"))) systems.push("Pytest");
    if (existsSync(join(cwd, "pytest.ini"))) systems.push("Python unittest");
    if (existsSync(join(cwd, "go.mod"))) {
      const content = await readFile(join(cwd, "go.mod"), "utf-8");
      if (content.includes("testing")) systems.push("Go testing");
    }

    return systems;
  }

  private async analyzeStructure(cwd: string): Promise<RepositoryStructure> {
    const structure: RepositoryStructure = {
      rootFiles: [],
      directories: [],
      sourceDirs: [],
      configFiles: [],
      testDirs: [],
      docFiles: [],
    };

    try {
      const output = await execAsync("ls -la", { cwd });
      const lines = output.stdout.split("\n").slice(1);

      for (const line of lines) {
        const parts = line.split(/\s+/);
        const name = parts[parts.length - 1];
        
        if (name === "." || name === "..") continue;

        if (line.startsWith("d")) {
          structure.directories.push(name);
          
          const lowerName = name.toLowerCase();
          if (["src", "lib", "app", "source"].includes(lowerName)) {
            structure.sourceDirs.push(name);
          }
          if (["test", "tests", "spec", "__tests__"].includes(lowerName)) {
            structure.testDirs.push(name);
          }
          if (["docs", "doc", "documentation"].includes(lowerName)) {
            structure.docFiles.push(name);
          }
        } else {
          structure.rootFiles.push(name);
          
          if (name.endsWith(".json") || name.endsWith(".yaml") || name.endsWith(".yml") || name.endsWith(".toml")) {
            structure.configFiles.push(name);
          }
          if (name.includes("README") || name.includes("LICENSE") || name.includes("CHANGELOG")) {
            structure.docFiles.push(name);
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return structure;
  }

  private async findFiles(cwd: string, pattern: string): Promise<string[]> {
    try {
      const output = await execAsync(`find . -name "${pattern}" -type f`, { cwd });
      return output.stdout.split("\n").filter(f => f.trim());
    } catch {
      return [];
    }
  }

  private generateSummary(analysis: RepositoryAnalysis): string {
    const primaryLang = analysis.languages[0]?.name ?? "Unknown";
    const frameworks = analysis.frameworks.slice(0, 2).join(", ") || "None detected";
    const packageMgrs = analysis.packageManagers.join(", ") || "None detected";

    return `${analysis.repository.name} is a ${primaryLang} project${analysis.frameworks.length > 0 ? ` using ${frameworks}` : ""}. ` +
           `Managed with ${packageMgrs}. ` +
           `Contains ${analysis.testSystems.length} test system(s) and ${analysis.hasCI ? "has CI/CD" : "no CI/CD"} configured.`;
  }

  private generateArchitectureSummary(analysis: RepositoryAnalysis): string {
    let summary = "Architecture Overview:\n\n";

    if (analysis.sourceDirs.length > 0) {
      summary += `• Source directories: ${analysis.sourceDirs.join(", ")}\n`;
    }
    if (analysis.testDirs.length > 0) {
      summary += `• Test directories: ${analysis.testDirs.join(", ")}\n`;
    }
    if (analysis.configFiles.length > 0) {
      summary += `• Config files: ${analysis.configFiles.join(", ")}\n`;
    }

    if (analysis.hasDockerfile) {
      summary += "• Uses Docker for containerization\n";
    }
    if (analysis.hasGitHubActions) {
      summary += "• GitHub Actions for CI/CD\n";
    }

    return summary;
  }

  private identifyRisks(analysis: RepositoryAnalysis): RiskItem[] {
    const risks: RiskItem[] = [];

    // No tests
    if (analysis.testSystems.length === 0) {
      risks.push({
        category: "testing",
        severity: "high",
        description: "No test framework detected",
        recommendation: "Add tests to ensure code quality and prevent regressions"
      });
    }

    // No CI/CD
    if (!analysis.hasCI && !analysis.hasGitHubActions) {
      risks.push({
        category: "ci-cd",
        severity: "medium",
        description: "No CI/CD pipeline configured",
        recommendation: "Add GitHub Actions for automated builds and tests"
      });
    }

    // No Dockerfile
    if (!analysis.hasDockerfile) {
      risks.push({
        category: "infrastructure",
        severity: "low",
        description: "No Dockerfile found",
        recommendation: "Consider adding Docker for consistent deployments"
      });
    }

    // Old package managers
    if (analysis.packageManagers.includes("npm") && !analysis.packageManagers.includes("pnpm") && !analysis.packageManagers.includes("yarn")) {
      risks.push({
        category: "dependencies",
        severity: "low",
        description: "Using npm without pnpm or yarn",
        recommendation: "Consider pnpm for faster and more efficient dependency management"
      });
    }

    return risks;
  }

  private generateSuggestions(analysis: RepositoryAnalysis): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (analysis.frameworks.includes("React") && !analysis.frameworks.includes("Next.js")) {
      suggestions.push({
        category: "modernization",
        title: "Consider Next.js for SSR/SSG",
        description: "Next.js provides server-side rendering and static generation for better performance and SEO",
        priority: "medium",
        estimatedEffort: "medium"
      });
    }

    if (analysis.languages.includes("JavaScript") && !analysis.languages.includes("TypeScript")) {
      suggestions.push({
        category: "type-safety",
        title: "Add TypeScript",
        description: "TypeScript provides better type safety and developer experience",
        priority: "high",
        estimatedEffort: "medium"
      });
    }

    suggestions.push({
      category: "documentation",
      title: "Improve documentation",
      description: "Add comprehensive README and API documentation",
      priority: "medium",
      estimatedEffort: "small"
    });

    return suggestions;
  }

  private calculateRiskScore(diff: string): number {
    let score = 0;

    // High risk patterns
    if (diff.includes("eval(")) score += 30;
    if (diff.includes("innerHTML")) score += 25;
    if (diff.includes("process.env")) score += 15;

    // Medium risk patterns
    if (diff.includes("console.log")) score += 5;
    if (diff.includes("// TODO")) score += 3;
    if (diff.includes("as any")) score += 10;

    return Math.min(100, score);
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  getRepository(id: string): Repository | undefined {
    return this.repositories.get(id);
  }

  getRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }

  getRepositoryByName(name: string): Repository | undefined {
    return Array.from(this.repositories.values()).find(r => r.name === name);
  }
}

// ============================================================================
// MEMORY STORE
// ============================================================================

class MemoryStore {
  private store: Map<string, unknown> = new Map();

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const defaultGitHubAgent = new GitHubAgent();
