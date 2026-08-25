/**
 * DEVIL Image Studio - Dashboard
 */

import React, { useState, useEffect } from "react";

interface Asset {
  id: string;
  type: string;
  provider: string;
  prompt: string;
  imageUrl: string;
  width: number;
  height: number;
  status: string;
  tags: string[];
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
  colors: { name: string; hex: string }[];
  visualStyle: string;
  createdAt: string;
}

interface Stats {
  totalAssets: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  totalBrands: number;
}

const imageTypes = [
  { value: "logo", label: "Logo", icon: "🏷️" },
  { value: "app_icon", label: "App Icon", icon: "📱" },
  { value: "favicon", label: "Favicon", icon: "🔖" },
  { value: "landing_page", label: "Landing Page", icon: "🌐" },
  { value: "dashboard", label: "Dashboard", icon: "📊" },
  { value: "mobile_ui", label: "Mobile UI", icon: "📲" },
  { value: "illustration", label: "Illustration", icon: "🎨" },
  { value: "banner", label: "Banner", icon: "🖼️" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "icon", label: "Icon", icon: "🔷" },
  { value: "avatar", label: "Avatar", icon: "👤" },
  { value: "thumbnail", label: "Thumbnail", icon: "🖼️" },
];

const providers = [
  { value: "openai", label: "OpenAI DALL-E" },
  { value: "flux", label: "Flux" },
  { value: "stable_diffusion", label: "Stable Diffusion" },
];

const statusColors: Record<string, string> = {
  pending: "bg-gray-500",
  generating: "bg-yellow-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export default function ImageStudioDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"generate" | "assets" | "brands">("generate");
  
  // Generation form
  const [prompt, setPrompt] = useState("");
  const [imageType, setImageType] = useState("logo");
  const [provider, setProvider] = useState("openai");
  const [generating, setGenerating] = useState(false);
  
  // Brand form
  const [brandName, setBrandName] = useState("");
  const [brandColors, setBrandColors] = useState<{ name: string; hex: string }[]>([]);
  const [newColor, setNewColor] = useState({ name: "", hex: "#" });

  const loadData = async () => {
    try {
      const [assetsRes, brandsRes, statsRes] = await Promise.all([
        fetch("/api/image/assets?limit=50"),
        fetch("/api/image/brands"),
        fetch("/api/image/stats"),
      ]);
      
      const assetsData = await assetsRes.json();
      const brandsData = await brandsRes.json();
      const statsData = await statsRes.json();
      
      setAssets(assetsData.assets || []);
      setBrands(brandsData.brands || []);
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
      await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          type: imageType, 
          provider,
          brandId: selectedBrand || undefined,
        }),
      });
      setPrompt("");
      loadData();
    } catch (err) {
      console.error("Generation failed");
    }
    setGenerating(false);
  };

  const handleCreateBrand = async () => {
    if (!brandName.trim()) return;
    
    try {
      await fetch("/api/image/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: brandName, 
          colors: brandColors,
          visualStyle: "modern",
        }),
      });
      setBrandName("");
      setBrandColors([]);
      loadData();
    } catch (err) {
      console.error("Brand creation failed");
    }
  };

  const addColor = () => {
    if (newColor.name && newColor.hex) {
      setBrandColors([...brandColors, { ...newColor }]);
      setNewColor({ name: "", hex: "#" });
    }
  };

  const selectedType = imageTypes.find(t => t.value === imageType);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-purple-400">🎨 DEVIL Image Studio</h1>
              <p className="text-gray-400 text-sm">AI-Powered Image Generation</p>
            </div>
            {stats && (
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalAssets}</p>
                  <p className="text-xs text-gray-400">Assets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalBrands}</p>
                  <p className="text-xs text-gray-400">Brands</p>
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
            { id: "generate", label: "🎨 Generate" },
            { id: "assets", label: "📁 Assets" },
            { id: "brands", label: "🏷️ Brands" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-t ${
                activeTab === tab.id ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
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
              <h3 className="text-lg font-bold mb-4">✨ Generate Image</h3>
              
              <div className="space-y-4">
                {/* Image Type */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Image Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {imageTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setImageType(type.value)}
                        className={`p-2 rounded text-sm ${
                          imageType === type.value
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        <span className="block text-lg">{type.icon}</span>
                        <span className="block text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Provider</label>
                  <div className="flex gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setProvider(p.value)}
                        className={`px-4 py-2 rounded ${
                          provider === p.value
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand (Optional) */}
                {brands.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Brand (Optional)</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                    >
                      <option value="">No brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Prompt {selectedType && `- ${selectedType.icon} ${selectedType.label}`}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe your ${selectedType?.label.toLowerCase() || "image"}...`}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 h-32 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span> Generating...
                    </span>
                  ) : (
                    "🎨 Generate Image"
                  )}
                </button>
              </div>
            </div>

            {/* Recent Assets */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🕐 Recent</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {assets.slice(0, 8).map((asset) => (
                  <div key={asset.id} className="flex gap-3 bg-gray-700 rounded p-2">
                    <div className={`w-16 h-16 rounded bg-gray-600 flex-shrink-0 overflow-hidden ${
                      asset.status === "generating" ? "animate-pulse" : ""
                    }`}>
                      {asset.imageUrl && (
                        <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.type}</p>
                      <p className="text-xs text-gray-400">{asset.provider}</p>
                      <div className={`mt-1 w-2 h-2 rounded-full inline-block ${statusColors[asset.status]}`} />
                    </div>
                  </div>
                ))}
                {assets.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No assets yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "assets" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className={`aspect-square bg-gray-700 relative ${
                  asset.status === "generating" ? "animate-pulse" : ""
                }`}>
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {imageTypes.find(t => t.value === asset.type)?.icon || "🖼️"}
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                    statusColors[asset.status]
                  }`}>
                    {asset.status}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{imageTypes.find(t => t.value === asset.type)?.label}</p>
                  <p className="text-xs text-gray-400 truncate">{asset.prompt}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{asset.provider}</span>
                    <span className="text-xs text-gray-400">{asset.width}x{asset.height}</span>
                  </div>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-full bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No assets yet. Generate some images!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "brands" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Brand */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🏷️ Create Brand</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="My Brand"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Brand Colors</label>
                  <div className="space-y-2">
                    {brandColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border border-gray-600" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="flex-1">{color.name}</span>
                        <span className="text-gray-400">{color.hex}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newColor.name}
                        onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                        placeholder="Color name"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1"
                      />
                      <input
                        type="color"
                        value={newColor.hex}
                        onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                        className="w-10 h-8 rounded cursor-pointer"
                      />
                      <button
                        onClick={addColor}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateBrand}
                  disabled={!brandName.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 rounded"
                >
                  Create Brand
                </button>
              </div>
            </div>

            {/* Brand List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Your Brands</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {brands.map((brand) => (
                  <div key={brand.id} className="bg-gray-700 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{brand.name}</h4>
                      <span className="text-xs text-gray-400">
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {brand.colors.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {brand.colors.map((color, i) => (
                          <div 
                            key={i}
                            className="w-6 h-6 rounded-full border border-gray-600"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      {brand.logoHistory?.length || 0} logos, {brand.iconHistory?.length || 0} icons
                    </p>
                  </div>
                ))}
                {brands.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No brands yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
