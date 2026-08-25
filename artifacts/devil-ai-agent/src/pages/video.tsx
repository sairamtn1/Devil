/**
 * DEVIL Video Studio - Dashboard
 */

import React, { useState, useEffect } from "react";

interface Video {
  id: string;
  type: string;
  provider: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  aspectRatio: string;
  status: string;
  tags: string[];
  createdAt: string;
}

interface Storyboard {
  id: string;
  name: string;
  type: string;
  scenes: any[];
  totalDuration: number;
  createdAt: string;
}

interface Stats {
  totalVideos: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  totalStoryboards: number;
}

const videoTypes = [
  { value: "commercial", label: "Commercial", icon: "📺" },
  { value: "product_reveal", label: "Product Reveal", icon: "🎁" },
  { value: "logo_intro", label: "Logo Intro", icon: "🎬" },
  { value: "os_intro", label: "OS Intro", icon: "💻" },
  { value: "feature_showcase", label: "Feature Showcase", icon: "✨" },
  { value: "social_media_short", label: "Social Media", icon: "📱" },
  { value: "trailer", label: "Trailer", icon: "🎥" },
  { value: "launch_film", label: "Launch Film", icon: "🚀" },
  { value: "ui_demo", label: "UI Demo", icon: "🖥️" },
  { value: "explainer", label: "Explainer", icon: "📖" },
];

const providers = [
  { value: "google_veo", label: "Google Veo" },
  { value: "kling", label: "Kling" },
  { value: "runway", label: "Runway" },
];

const aspectRatios = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "21:9", label: "Cinematic (21:9)" },
];

const statusColors: Record<string, string> = {
  pending: "bg-gray-500",
  generating: "bg-yellow-500 animate-pulse",
  processing: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export default function VideoStudioDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "videos" | "storyboards">("generate");
  
  // Generation form
  const [prompt, setPrompt] = useState("");
  const [videoType, setVideoType] = useState("commercial");
  const [provider, setProvider] = useState("google_veo");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      const [videosRes, storyboardsRes, statsRes] = await Promise.all([
        fetch("/api/video/assets?limit=50"),
        fetch("/api/video/storyboards"),
        fetch("/api/video/stats"),
      ]);
      
      const videosData = await videosRes.json();
      const storyboardsData = await storyboardsRes.json();
      const statsData = await statsRes.json();
      
      setVideos(videosData.videos || []);
      setStoryboards(storyboardsData.storyboards || []);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          type: videoType, 
          provider,
          aspectRatio,
          duration,
        }),
      });
      setPrompt("");
      loadData();
    } catch (err) {
      console.error("Generation failed");
    }
    setGenerating(false);
  };

  const selectedType = videoTypes.find(t => t.value === videoType);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">🎬 DEVIL Video Studio</h1>
              <p className="text-gray-400 text-sm">AI-Powered Video Generation</p>
            </div>
            {stats && (
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  <p className="text-xs text-gray-400">Videos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalStoryboards}</p>
                  <p className="text-xs text-gray-400">Storyboards</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {stats.byStatus.completed || 0}
                  </p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {[
            { id: "generate", label: "🎬 Generate" },
            { id: "videos", label: "📹 Videos" },
            { id: "storyboards", label: "📋 Storyboards" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-t ${
                activeTab === tab.id ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Form */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">✨ Generate Video</h3>
              
              <div className="space-y-4">
                {/* Video Type */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Video Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {videoTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setVideoType(type.value)}
                        className={`p-2 rounded text-sm ${
                          videoType === type.value
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        <span className="block text-lg">{type.icon}</span>
                        <span className="block text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider & Aspect */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Provider</label>
                    <div className="flex gap-2">
                      {providers.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setProvider(p.value)}
                          className={`flex-1 px-3 py-2 rounded text-sm ${
                            provider === p.value
                              ? "bg-cyan-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                    >
                      {aspectRatios.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Duration: {duration}s
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Prompt {selectedType && `- ${selectedType.icon} ${selectedType.label}`}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe your ${selectedType?.label.toLowerCase() || "video"}...`}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 h-32 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span> Generating...
                    </span>
                  ) : (
                    "🎬 Generate Video"
                  )}
                </button>
              </div>
            </div>

            {/* Recent Videos */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🕐 Recent</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {videos.slice(0, 6).map((video) => (
                  <div key={video.id} className="flex gap-3 bg-gray-700 rounded p-2">
                    <div className={`w-20 h-12 rounded bg-gray-600 flex-shrink-0 overflow-hidden ${
                      video.status === "generating" || video.status === "processing" ? "animate-pulse" : ""
                    }`}>
                      {video.thumbnailUrl && (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {videoTypes.find(t => t.value === video.type)?.icon} {video.type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-400">{video.duration}s • {video.aspectRatio}</p>
                      <div className={`mt-1 w-2 h-2 rounded-full inline-block ${statusColors[video.status]}`} />
                    </div>
                  </div>
                ))}
                {videos.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No videos yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "videos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className={`aspect-video bg-gray-700 relative ${
                  video.status === "generating" || video.status === "processing" ? "animate-pulse" : ""
                }`}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {videoTypes.find(t => t.value === video.type)?.icon || "🎬"}
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                    statusColors[video.status]
                  }`}>
                    {video.status}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
                    {video.duration}s • {video.aspectRatio}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">
                    {videoTypes.find(t => t.value === video.type)?.label || video.type}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{video.prompt}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {providers.find(p => p.value === video.provider)?.label || video.provider}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="col-span-full bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No videos yet. Generate some videos!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "storyboards" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Storyboard Templates */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">📋 Quick Templates</h3>
              <div className="space-y-3">
                {videoTypes.slice(0, 5).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setVideoType(type.value);
                      setActiveTab("generate");
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 rounded p-4 text-left"
                  >
                    <span className="text-xl mr-3">{type.icon}</span>
                    <span className="font-medium">Create {type.label}</span>
                    <span className="text-xs text-gray-400 float-right">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Storyboard List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Your Storyboards</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {storyboards.map((sb) => (
                  <div key={sb.id} className="bg-gray-700 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{sb.name}</h4>
                      <span className="text-xs text-gray-400">
                        {videoTypes.find(t => t.value === sb.type)?.icon} {sb.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {sb.scenes?.length || 0} scenes • {sb.totalDuration}s total
                    </p>
                  </div>
                ))}
                {storyboards.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No storyboards yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
