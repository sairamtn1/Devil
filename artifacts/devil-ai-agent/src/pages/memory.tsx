/**
 * DEVIL Memory System - Memory Dashboard
 */

import React, { useState, useEffect } from "react";

interface MemoryEntry {
  id: string;
  type: string;
  entityId: string;
  state: string;
  data: Record<string, unknown>;
  importance: number;
  confidence: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  byState: Record<string, number>;
}

const typeColors: Record<string, string> = {
  user: "bg-blue-600",
  project: "bg-green-600",
  mission: "bg-purple-600",
  repository: "bg-yellow-600",
  execution: "bg-orange-600",
  knowledge: "bg-pink-600",
};

const typeIcons: Record<string, string> = {
  user: "👤",
  project: "📁",
  mission: "🎯",
  repository: "📦",
  execution: "⚡",
  knowledge: "💡",
};

export default function MemoryDashboard() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newMemory, setNewMemory] = useState({
    type: "knowledge",
    entityId: "",
    title: "",
    content: "",
    category: "",
    importance: 50,
    tags: "",
  });

  // Load memories
  const loadMemories = async (type?: string) => {
    setLoading(true);
    try {
      const url = type && type !== "all" 
        ? `/api/memory?type=${type}`
        : "/api/memory";
      const response = await fetch(url);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Failed to load memories");
    }
    setLoading(false);
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await fetch("/api/memory/stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  // Search memories
  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Search failed");
    }
    setLoading(false);
  };

  // Create memory
  const handleCreate = async () => {
    if (!newMemory.content) {
      setError("Content is required");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        type: newMemory.type,
        entityId: newMemory.entityId || newMemory.category,
        data: {
          content: newMemory.content,
          title: newMemory.title,
          category: newMemory.category,
        },
        importance: newMemory.importance,
        tags: newMemory.tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      // Type-specific data
      if (newMemory.type === "knowledge") {
        (payload.data as any).knowledgeId = crypto.randomUUID();
      }

      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setShowCreateModal(false);
      setNewMemory({
        type: "knowledge",
        entityId: "",
        title: "",
        content: "",
        category: "",
        importance: 50,
        tags: "",
      });
      loadMemories(activeTab);
      loadStats();
    } catch (err) {
      setError("Failed to create memory");
    }
  };

  // Delete memory
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this memory?")) return;

    try {
      await fetch(`/api/memory/${id}`, { method: "DELETE" });
      loadMemories(activeTab);
      loadStats();
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      setError("Failed to delete memory");
    }
  };

  // Archive memory
  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}/archive`, { method: "POST" });
      loadMemories(activeTab);
      loadStats();
    } catch (err) {
      setError("Failed to archive memory");
    }
  };

  // Initial load
  useEffect(() => {
    loadMemories();
    loadStats();
  }, []);

  const types = ["all", "user", "project", "mission", "repository", "execution", "knowledge"];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">🧠 DEVIL Memory System</h1>
              <p className="text-gray-400 text-sm">Persistent intelligence platform</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              ➕ Add Memory
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Memories</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-400">{stats.byState?.ACTIVE || 0}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Archived</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.byState?.ARCHIVED || 0}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">By Type</p>
              <p className="text-sm text-gray-300">
                {Object.entries(stats.byType || {})
                  .filter(([_, v]) => v > 0)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchMemories()}
            placeholder="Search memories..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2"
          />
          <button
            onClick={searchMemories}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                loadMemories(type);
              }}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                activeTab === type
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {typeIcons[type] || "📋"} {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Memory List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg">No memories found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  Create your first memory
                </button>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`bg-gray-800 rounded-lg p-4 border cursor-pointer hover:border-gray-600 ${
                    selectedEntry?.id === entry.id ? "border-red-500" : "border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${typeColors[entry.type] || "bg-gray-600"}`}>
                        {typeIcons[entry.type]} {entry.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.state === "ACTIVE" ? "bg-green-900 text-green-400" :
                        entry.state === "ARCHIVED" ? "bg-yellow-900 text-yellow-400" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {entry.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold mb-1">
                    {entry.data?.title || entry.data?.name || entry.entityId || entry.type}
                  </h3>
                  
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {entry.data?.content || entry.data?.objective || JSON.stringify(entry.data).slice(0, 100)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {entry.tags?.length > 3 && (
                      <span className="text-gray-500 text-xs">+{entry.tags.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>📊 {entry.importance}%</span>
                    <span>🎯 {entry.confidence}%</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedEntry ? (
              <div className="bg-gray-800 rounded-lg p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Memory Details</h2>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">ID</label>
                    <p className="font-mono text-sm bg-gray-900 p-2 rounded">
                      {selectedEntry.id}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-gray-400 text-sm">Type</label>
                      <p className="font-bold">{selectedEntry.type}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-400 text-sm">State</label>
                      <p className="font-bold">{selectedEntry.state}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Entity ID</label>
                    <p className="font-mono">{selectedEntry.entityId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Importance</label>
                      <p className="font-bold">{selectedEntry.importance}%</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Confidence</label>
                      <p className="font-bold">{selectedEntry.confidence}%</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEntry.tags?.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Data</label>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-64 mt-1">
                      {JSON.stringify(selectedEntry.data, null, 2)}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-400 text-sm">Created</label>
                      <p>{new Date(selectedEntry.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Updated</label>
                      <p>{new Date(selectedEntry.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {selectedEntry.state === "ACTIVE" && (
                      <button
                        onClick={() => handleArchive(selectedEntry.id)}
                        className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                      >
                        📦 Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedEntry.id)}
                      className="flex-1 px-3 py-2 bg-red-900 hover:bg-red-800 rounded text-sm"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center sticky top-4">
                <p className="text-gray-400">Select a memory to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Memory</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="user">👤 User</option>
                  <option value="project">📁 Project</option>
                  <option value="mission">🎯 Mission</option>
                  <option value="repository">📦 Repository</option>
                  <option value="execution">⚡ Execution</option>
                  <option value="knowledge">💡 Knowledge</option>
                </select>
              </div>

              {newMemory.type === "knowledge" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={newMemory.category}
                    onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                    placeholder="e.g., preferences, architecture, patterns"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
              )}

              {newMemory.type === "knowledge" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                    placeholder="Brief title"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  placeholder="What should DEVIL remember?"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-32"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                  placeholder="fastapi, mongodb, railway"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Importance: {newMemory.importance}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newMemory.importance}
                  onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold"
                >
                  Create Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
