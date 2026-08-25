/**
 * DEVIL GitHub Agent - GitHub Dashboard
 */

import React, { useState, useCallback } from "react";

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  localPath?: string;
  defaultBranch: string;
  lastAnalyzed?: string;
}

interface Analysis {
  repository: Repository;
  languages: { name: string; percentage: number; files: number }[];
  frameworks: string[];
  packageManagers: string[];
  buildSystems: string[];
  testSystems: string[];
  hasDockerfile: boolean;
  hasCI: boolean;
  riskLevel: "low" | "medium" | "high";
  risks: { category: string; severity: string; description: string }[];
  suggestions: { title: string; description: string; priority: string }[];
  summary: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface AuditEntry {
  id: string;
  action: string;
  repository: string;
  timestamp: string;
  details: Record<string, unknown>;
}

interface Branch {
  name: string;
  isProtected: boolean;
  isDefault: boolean;
}

export default function GitHubDashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"repos" | "clone" | "history">("clone");
  const [newBranchName, setNewBranchName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [prDraft, setPrDraft] = useState(false);

  // Clone repository
  const handleClone = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, branch: branch || undefined }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to clone");
      }

      const repo = await response.json();
      setRepositories((prev) => [...prev, repo]);
      setSelectedRepo(repo);
      setActiveTab("repos");
      setRepoUrl("");
      setBranch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone repository");
    }

    setLoading(false);
  };

  // Analyze repository
  const handleAnalyze = async (repo: Repository) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/analyze/${repo.id}`, {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to analyze");
      }

      const data = await response.json();
      setAnalysis(data);
      setSelectedRepo(repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    }

    setLoading(false);
  };

  // Load branches
  const loadBranches = async (repo: Repository) => {
    try {
      const response = await fetch(`/api/github/repositories/${repo.id}/branches`);
      const data = await response.json();
      setBranches(data.branches);
    } catch (err) {
      console.error("Failed to load branches");
    }
  };

  // Load commits
  const loadCommits = async (repo: Repository) => {
    try {
      const response = await fetch(`/api/github/repositories/${repo.id}/commits?limit=20`);
      const data = await response.json();
      setCommits(data.commits);
    } catch (err) {
      console.error("Failed to load commits");
    }
  };

  // Create branch
  const handleCreateBranch = async () => {
    if (!selectedRepo || !newBranchName.trim()) return;

    try {
      await fetch(`/api/github/repositories/${selectedRepo.id}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBranchName }),
      });

      await loadBranches(selectedRepo);
      setNewBranchName("");
    } catch (err) {
      setError("Failed to create branch");
    }
  };

  // Create PR
  const handleCreatePR = async () => {
    if (!selectedRepo || !prTitle.trim()) return;

    try {
      await fetch(`/api/github/repositories/${selectedRepo.id}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prTitle,
          description: prDescription,
          sourceBranch: newBranchName || selectedRepo.defaultBranch,
          targetBranch: selectedRepo.defaultBranch,
          draft: prDraft,
        }),
      });

      alert("PR created! Check GitHub to review and merge.");
      setPrTitle("");
      setPrDescription("");
    } catch (err) {
      setError("Failed to create PR");
    }
  };

  // Load audit log
  const loadAuditLog = async () => {
    try {
      const response = await fetch("/api/github/audit");
      const data = await response.json();
      setAuditLog(data.entries);
    } catch (err) {
      console.error("Failed to load audit log");
    }
  };

  // Select repository
  const handleSelectRepo = async (repo: Repository) => {
    setSelectedRepo(repo);
    await Promise.all([
      loadBranches(repo),
      loadCommits(repo),
      handleAnalyze(repo),
    ]);
  };

  const riskColors = {
    low: "bg-green-600",
    medium: "bg-yellow-600",
    high: "bg-red-600",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🐙 DEVIL GitHub Agent</h1>
              <p className="text-gray-400 text-sm">Repository-aware software engineering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("clone")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "clone"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📥 Clone Repository
          </button>
          <button
            onClick={() => setActiveTab("repos")}
            className={`px-4 py-2 rounded-t ${
              activeTab === "repos"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📁 Repositories ({repositories.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              loadAuditLog();
            }}
            className={`px-4 py-2 rounded-t ${
              activeTab === "history"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📜 Audit Trail
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-300 hover:text-red-100 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Clone Tab */}
        {activeTab === "clone" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Clone a Repository</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Repository URL</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Branch (optional)</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <button
                onClick={handleClone}
                disabled={loading || !repoUrl.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded font-bold"
              >
                {loading ? "Cloning..." : "📥 Clone Repository"}
              </button>
            </div>
          </div>
        )}

        {/* Repositories Tab */}
        {activeTab === "repos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Repository List */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-4">Your Repositories</h3>
              
              {repositories.length === 0 ? (
                <p className="text-gray-400 text-sm">No repositories cloned yet</p>
              ) : (
                <div className="space-y-2">
                  {repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className={`w-full text-left p-3 rounded ${
                        selectedRepo?.id === repo.id
                          ? "bg-red-900/50 border border-red-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <p className="font-bold">{repo.name}</p>
                      <p className="text-gray-400 text-sm">{repo.owner}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Repository Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedRepo ? (
                <>
                  {/* Repo Info */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedRepo.name}</h2>
                        <p className="text-gray-400">{selectedRepo.owner}</p>
                      </div>
                      <button
                        onClick={() => handleAnalyze(selectedRepo)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
                      >
                        🔍 Analyze
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded p-3">
                        <p className="text-gray-400 text-sm">Default Branch</p>
                        <p className="font-bold">{selectedRepo.defaultBranch}</p>
                      </div>
                      <div className="bg-gray-700 rounded p-3">
                        <p className="text-gray-400 text-sm">Local Path</p>
                        <p className="font-mono text-sm truncate">{selectedRepo.localPath}</p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Results */}
                  {analysis && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-xl font-bold mb-4">📊 Analysis Results</h3>

                      {/* Risk Level */}
                      <div className="mb-6">
                        <span className={`px-4 py-2 rounded font-bold ${riskColors[analysis.riskLevel]}`}>
                          Risk Level: {analysis.riskLevel.toUpperCase()}
                        </span>
                      </div>

                      {/* Languages */}
                      <div className="mb-6">
                        <h4 className="font-bold mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.languages.map((lang) => (
                            <span key={lang.name} className="bg-gray-700 px-3 py-1 rounded text-sm">
                              {lang.name} ({lang.percentage}%)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Frameworks & Tools */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="font-bold mb-2">Frameworks</h4>
                          <p className="text-gray-400">
                            {analysis.frameworks.join(", ") || "None detected"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-2">Package Managers</h4>
                          <p className="text-gray-400">
                            {analysis.packageManagers.join(", ") || "None detected"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-2">Test Systems</h4>
                          <p className="text-gray-400">
                            {analysis.testSystems.join(", ") || "None detected"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-2">Infrastructure</h4>
                          <p className="text-gray-400">
                            {analysis.hasDockerfile && "🐳 Docker"}
                            {analysis.hasCI && " ⚙️ CI/CD"}
                          </p>
                        </div>
                      </div>

                      {/* Risks */}
                      {analysis.risks.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold mb-2 text-red-400">⚠️ Risks</h4>
                          <div className="space-y-2">
                            {analysis.risks.map((risk, i) => (
                              <div key={i} className="bg-red-900/30 border border-red-800 rounded p-3">
                                <p className="font-bold text-sm">
                                  [{risk.severity.toUpperCase()}] {risk.category}
                                </p>
                                <p className="text-gray-300 text-sm">{risk.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {analysis.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-2 text-green-400">💡 Suggestions</h4>
                          <div className="space-y-2">
                            {analysis.suggestions.map((sug, i) => (
                              <div key={i} className="bg-green-900/30 border border-green-800 rounded p-3">
                                <p className="font-bold text-sm">{sug.title}</p>
                                <p className="text-gray-300 text-sm">{sug.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Branches */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">🌿 Branches</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="feature/new-feature"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2"
                      />
                      <button
                        onClick={handleCreateBranch}
                        disabled={!newBranchName.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
                      >
                        Create
                      </button>
                    </div>

                    <div className="space-y-2">
                      {branches.map((br) => (
                        <div
                          key={br.name}
                          className="bg-gray-700 rounded p-3 flex items-center justify-between"
                        >
                          <span>{br.name}</span>
                          {br.isDefault && (
                            <span className="bg-blue-600 px-2 py-1 rounded text-xs">Default</span>
                          )}
                          {br.isProtected && (
                            <span className="bg-yellow-600 px-2 py-1 rounded text-xs">Protected</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Commits */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">📝 Recent Commits</h3>
                    
                    <div className="space-y-2">
                      {commits.slice(0, 10).map((commit) => (
                        <div key={commit.hash} className="bg-gray-700 rounded p-3">
                          <p className="font-mono text-xs text-gray-400">
                            {commit.hash.substring(0, 7)}
                          </p>
                          <p className="text-sm">{commit.message}</p>
                          <p className="text-xs text-gray-400">
                            {commit.author} • {new Date(commit.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create PR */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">🔄 Create Pull Request</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                          type="text"
                          value={prTitle}
                          onChange={(e) => setPrTitle(e.target.value)}
                          placeholder="feat: Add new feature"
                          className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                          value={prDescription}
                          onChange={(e) => setPrDescription(e.target.value)}
                          placeholder="Describe your changes..."
                          className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 h-24"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={prDraft}
                            onChange={(e) => setPrDraft(e.target.checked)}
                          />
                          <span className="text-sm">Create as draft</span>
                        </label>
                      </div>

                      <button
                        onClick={handleCreatePR}
                        disabled={!prTitle.trim()}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded font-bold"
                      >
                        🚀 Create Pull Request
                      </button>

                      <p className="text-sm text-gray-400">
                        ⚠️ DEVIL will never merge automatically. You must review and merge on GitHub.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                  <p className="text-gray-400 text-lg">Select a repository to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📜 Audit Trail</h3>
            
            <div className="space-y-2">
              {auditLog.length === 0 ? (
                <p className="text-gray-400">No actions recorded yet</p>
              ) : (
                auditLog.slice().reverse().map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-blue-600 px-3 py-1 rounded text-sm">
                        {entry.action.replace("_", " ")}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-bold">{entry.repository}</span>
                      {" • "}
                      <span className="text-gray-400">{entry.actor}</span>
                    </p>
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-800 rounded p-2 overflow-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
