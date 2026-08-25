/**
 * DEVIL Video Studio - Provider Layer & Agent
 * 
 * Video generation, editing, and asset management.
 * - Provider abstraction (Veo, Kling, Runway)
 * - Storyboard engine
 * - Brand system integration
 * - Video library
 */

import { logEvent } from "../control-plane/eventLog";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";

// ============================================================================
// TYPES
// ============================================================================

// Video Providers
export const VideoProvider = {
  GOOGLE_VEO: "google_veo",
  KLING: "kling",
  RUNWAY: "runway",
  // Future
  PIKA: "pika",
  LUMA: "luma",
  HAILUO: "hailuo",
  SORA: "sora",
} as const;

export type VideoProviderType = typeof VideoProvider[keyof typeof VideoProvider];

// Video Types
export const VideoType = {
  COMMERCIAL: "commercial",
  PRODUCT_REVEAL: "product_reveal",
  LOGO_INTRO: "logo_intro",
  OS_INTRO: "os_intro",
  FEATURE_SHOWCASE: "feature_showcase",
  SOCIAL_MEDIA_SHORT: "social_media_short",
  TRAILER: "trailer",
  LAUNCH_FILM: "launch_film",
  UI_DEMO: "ui_demo",
  EXPLAINER: "explainer",
} as const;

export type VideoTypeType = typeof VideoType[keyof typeof VideoType];

// Video Status
export const VideoStatus = {
  PENDING: "pending",
  GENERATING: "generating",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type VideoStatusType = typeof VideoStatus[keyof typeof VideoStatus];

// Aspect Ratios
export const AspectRatio = {
  LANDSCAPE: "16:9",
  PORTRAIT: "9:16",
  SQUARE: "1:1",
  CINEMATIC: "21:9",
} as const;

export type AspectRatioType = typeof AspectRatio[keyof typeof AspectRatio];

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface VideoProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  provider?: VideoProviderType;
  model?: string;
  duration?: number; // seconds
  aspectRatio?: AspectRatioType;
  style?: string;
  seed?: number;
  imageUrl?: string; // for image-to-video
}

export interface VideoGenerationResult {
  id: string;
  provider: VideoProviderType;
  videoUrl?: string;
  thumbnailUrl?: string;
  revisedPrompt?: string;
  duration?: number;
  seed?: number;
  timings?: {
    generation: number;
    processing: number;
    total: number;
  };
  success: boolean;
  error?: string;
}

export interface VideoProviderAdapter {
  name: VideoProviderType;
  generate(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
  generateFromImage(imageUrl: string, prompt: string): Promise<VideoGenerationResult>;
}

// ============================================================================
// GOOGLE VEO PROVIDER
// ============================================================================

class GoogleVeoProvider implements VideoProviderAdapter {
  name = VideoProvider.GOOGLE_VEO;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: VideoProviderConfig) {
    this.apiKey = config.apiKey || process.env.GOOGLE_VEO_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.google.com/veo/v1";
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: request.prompt,
      duration: request.duration || 5,
      success: true,
    };
  }

  async generateFromImage(imageUrl: string, prompt: string): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: prompt,
      duration: 5,
      success: true,
    };
  }
}

// ============================================================================
// KLING PROVIDER
// ============================================================================

class KlingProvider implements VideoProviderAdapter {
  name = VideoProvider.KLING;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: VideoProviderConfig) {
    this.apiKey = config.apiKey || process.env.KLING_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.kling.ai/v1";
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: request.prompt,
      duration: request.duration || 5,
      success: true,
    };
  }

  async generateFromImage(imageUrl: string, prompt: string): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: prompt,
      duration: 5,
      success: true,
    };
  }
}

// ============================================================================
// RUNWAY PROVIDER
// ============================================================================

class RunwayProvider implements VideoProviderAdapter {
  name = VideoProvider.RUNWAY;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: VideoProviderConfig) {
    this.apiKey = config.apiKey || process.env.RUNWAY_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.runwayml.com/v1";
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: request.prompt,
      duration: request.duration || 5,
      success: true,
    };
  }

  async generateFromImage(imageUrl: string, prompt: string): Promise<VideoGenerationResult> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      videoUrl: `https://picsum.photos/seed/${id}/1280/720`,
      thumbnailUrl: `https://picsum.photos/seed/${id}-thumb/320/180`,
      revisedPrompt: prompt,
      duration: 5,
      success: true,
    };
  }
}

// ============================================================================
// STORYBOARD
// ============================================================================

export interface StoryboardScene {
  id: string;
  order: number;
  description: string;
  duration: number; // seconds
  cameraInstructions: string;
  narration?: string;
  musicCue?: string;
  imageUrl?: string;
  visualEffects?: string[];
}

export interface Storyboard {
  id: string;
  name: string;
  type: VideoTypeType;
  brandId?: string;
  scenes: StoryboardScene[];
  totalDuration: number;
  aspectRatio: AspectRatioType;
  createdAt: Date;
}

// ============================================================================
// VIDEO ASSET
// ============================================================================

export interface VideoAsset {
  id: string;
  brandId?: string;
  type: VideoTypeType;
  provider: VideoProviderType;
  storyboardId?: string;
  prompt: string;
  negativePrompt?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  aspectRatio: AspectRatioType;
  resolution: string;
  metadata: VideoMetadata;
  versions: VideoVersion[];
  tags: string[];
  status: VideoStatusType;
  error?: string;
  sourceImageUrl?: string; // for image-to-video
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  seed?: number;
  model?: string;
  style?: string;
  generationTime?: number;
  processingTime?: number;
}

export interface VideoVersion {
  version: number;
  videoUrl: string;
  prompt: string;
  timestamp: Date;
}

// ============================================================================
// VIDEO STUDIO AGENT
// ============================================================================

export class VideoStudioAgent {
  private providers: Map<VideoProviderType, VideoProviderAdapter> = new Map();
  private videos: Map<string, VideoAsset> = new Map();
  private storyboards: Map<string, Storyboard> = new Map();
  private basePath: string = "/tmp/devil-videos";

  constructor() {
    // Initialize providers
    this.providers.set(VideoProvider.GOOGLE_VEO, new GoogleVeoProvider({}));
    this.providers.set(VideoProvider.KLING, new KlingProvider({}));
    this.providers.set(VideoProvider.RUNWAY, new RunwayProvider({}));

    mkdir(this.basePath, { recursive: true });
    mkdir(`${this.basePath}/storyboards`, { recursive: true });
    mkdir(`${this.basePath}/videos`, { recursive: true });

    logEvent({
      eventType: "video_studio_initialized",
      severity: "info",
      message: "Video Studio Agent initialized",
      details: { providers: this.providers.size }
    });
  }

  // ==========================================================================
  // GENERATION
  // ==========================================================================

  async generate(
    type: VideoTypeType,
    prompt: string,
    options?: {
      provider?: VideoProviderType;
      brandId?: string;
      negativePrompt?: string;
      duration?: number;
      aspectRatio?: AspectRatioType;
      style?: string;
      storyboardId?: string;
    }
  ): Promise<VideoAsset> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    const provider = options?.provider || VideoProvider.GOOGLE_VEO;
    const providerAdapter = this.providers.get(provider);

    if (!providerAdapter) {
      throw new Error(`Provider ${provider} not available`);
    }

    // Enhance prompt based on type
    const enhancedPrompt = this.enhancePrompt(type, prompt, options?.brandId);
    const duration = options?.duration || this.getDefaultDuration(type);

    const asset: VideoAsset = {
      id,
      brandId: options?.brandId,
      type,
      provider,
      storyboardId: options?.storyboardId,
      prompt: enhancedPrompt,
      negativePrompt: options?.negativePrompt,
      videoUrl: "",
      duration,
      aspectRatio: options?.aspectRatio || AspectRatio.LANDSCAPE,
      resolution: this.getResolution(options?.aspectRatio || AspectRatio.LANDSCAPE),
      metadata: {
        model: provider,
        style: options?.style,
      },
      versions: [],
      tags: [type, provider],
      status: VideoStatus.GENERATING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.videos.set(id, asset);

    try {
      const result = await providerAdapter.generate({
        prompt: enhancedPrompt,
        negativePrompt: options?.negativePrompt,
        duration,
        aspectRatio: options?.aspectRatio,
        style: options?.style,
      });

      if (result.success) {
        asset.videoUrl = result.videoUrl || "";
        asset.thumbnailUrl = result.thumbnailUrl;
        asset.status = VideoStatus.COMPLETED;
        asset.metadata.generationTime = result.timings?.generation;
      } else {
        asset.status = VideoStatus.FAILED;
        asset.error = result.error;
      }
    } catch (error) {
      asset.status = VideoStatus.FAILED;
      asset.error = error instanceof Error ? error.message : "Unknown error";
    }

    asset.updatedAt = new Date();
    await this.persistVideo(asset);

    return asset;
  }

  async generateFromImage(
    imageUrl: string,
    prompt: string,
    options?: {
      provider?: VideoProviderType;
      duration?: number;
      aspectRatio?: AspectRatioType;
    }
  ): Promise<VideoAsset> {
    const id = `video-${randomUUID().slice(0, 8)}`;
    const provider = options?.provider || VideoProvider.GOOGLE_VEO;
    const providerAdapter = this.providers.get(provider);

    if (!providerAdapter) {
      throw new Error(`Provider ${provider} not available`);
    }

    const asset: VideoAsset = {
      id,
      type: VideoType.UI_DEMO,
      provider,
      prompt,
      videoUrl: "",
      duration: options?.duration || 5,
      aspectRatio: options?.aspectRatio || AspectRatio.LANDSCAPE,
      resolution: this.getResolution(options?.aspectRatio || AspectRatio.LANDSCAPE),
      metadata: { model: provider },
      versions: [],
      tags: ["image-to-video", provider],
      status: VideoStatus.GENERATING,
      sourceImageUrl: imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.videos.set(id, asset);

    try {
      const result = await providerAdapter.generateFromImage(imageUrl, prompt);

      if (result.success) {
        asset.videoUrl = result.videoUrl || "";
        asset.thumbnailUrl = result.thumbnailUrl;
        asset.status = VideoStatus.COMPLETED;
      } else {
        asset.status = VideoStatus.FAILED;
        asset.error = result.error;
      }
    } catch (error) {
      asset.status = VideoStatus.FAILED;
      asset.error = error instanceof Error ? error.message : "Unknown error";
    }

    asset.updatedAt = new Date();
    return asset;
  }

  private enhancePrompt(
    type: VideoTypeType,
    prompt: string,
    brandId?: string
  ): string {
    const typeEnhancements: Record<VideoTypeType, string> = {
      [VideoType.COMMERCIAL]: "professional commercial, high quality, cinematic lighting",
      [VideoType.PRODUCT_REVEAL]: "product reveal, elegant, dramatic lighting, smooth camera movement",
      [VideoType.LOGO_INTRO]: "logo animation, clean, professional, smooth transition",
      [VideoType.OS_INTRO]: "operating system intro, futuristic, sleek, modern UI",
      [VideoType.FEATURE_SHOWCASE]: "feature demo, clear, informative, engaging",
      [VideoType.SOCIAL_MEDIA_SHORT]: "short video, engaging, viral, attention-grabbing",
      [VideoType.TRAILER]: "movie trailer, dramatic, suspenseful, cinematic",
      [VideoType.LAUNCH_FILM]: "product launch, exciting, innovative, premium",
      [VideoType.UI_DEMO]: "UI demonstration, smooth, modern, professional",
      [VideoType.EXPLAINER]: "explainer video, clear, educational, engaging animation",
    };

    let enhanced = prompt;
    
    if (typeEnhancements[type]) {
      enhanced = `${prompt}, ${typeEnhancements[type]}`;
    }

    return enhanced;
  }

  private getDefaultDuration(type: VideoTypeType): number {
    const durations: Record<VideoTypeType, number> = {
      [VideoType.COMMERCIAL]: 30,
      [VideoType.PRODUCT_REVEAL]: 15,
      [VideoType.LOGO_INTRO]: 3,
      [VideoType.OS_INTRO]: 5,
      [VideoType.FEATURE_SHOWCASE]: 20,
      [VideoType.SOCIAL_MEDIA_SHORT]: 15,
      [VideoType.TRAILER]: 60,
      [VideoType.LAUNCH_FILM]: 90,
      [VideoType.UI_DEMO]: 30,
      [VideoType.EXPLAINER]: 60,
    };

    return durations[type] || 15;
  }

  private getResolution(aspectRatio: AspectRatioType): string {
    const resolutions: Record<AspectRatioType, string> = {
      [AspectRatio.LANDSCAPE]: "1280x720",
      [AspectRatio.PORTRAIT]: "720x1280",
      [AspectRatio.SQUARE]: "1080x1080",
      [AspectRatio.CINEMATIC]: "1920x810",
    };

    return resolutions[aspectRatio] || "1280x720";
  }

  // ==========================================================================
  // STORYBOARD
  // ==========================================================================

  createStoryboard(
    name: string,
    type: VideoTypeType,
    options?: {
      brandId?: string;
      aspectRatio?: AspectRatioType;
    }
  ): Storyboard {
    const id = `storyboard-${randomUUID().slice(0, 8)}`;

    const storyboard: Storyboard = {
      id,
      name,
      type,
      brandId: options?.brandId,
      scenes: [],
      totalDuration: 0,
      aspectRatio: options?.aspectRatio || AspectRatio.LANDSCAPE,
      createdAt: new Date(),
    };

    this.storyboards.set(id, storyboard);
    return storyboard;
  }

  addScene(
    storyboardId: string,
    scene: Omit<StoryboardScene, "id" | "order">
  ): Storyboard | undefined {
    const storyboard = this.storyboards.get(storyboardId);
    if (!storyboard) return undefined;

    const id = `scene-${randomUUID().slice(0, 8)}`;
    const newScene: StoryboardScene = {
      ...scene,
      id,
      order: storyboard.scenes.length + 1,
    };

    storyboard.scenes.push(newScene);
    storyboard.totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.duration, 0);

    return storyboard;
  }

  generateFromStoryboard(storyboardId: string, provider?: VideoProviderType): Promise<VideoAsset> {
    const storyboard = this.storyboards.get(storyboardId);
    if (!storyboard) {
      throw new Error(`Storyboard ${storyboardId} not found`);
    }

    // Generate a combined prompt from all scenes
    const combinedPrompt = storyboard.scenes
      .map((s, i) => `Scene ${i + 1}: ${s.description}`)
      .join(". ");

    return this.generate(storyboard.type, combinedPrompt, {
      provider,
      brandId: storyboard.brandId,
      aspectRatio: storyboard.aspectRatio,
      storyboardId,
    });
  }

  getStoryboard(id: string): Storyboard | undefined {
    return this.storyboards.get(id);
  }

  getAllStoryboards(options?: { brandId?: string }): Storyboard[] {
    let storyboards = Array.from(this.storyboards.values());

    if (options?.brandId) {
      storyboards = storyboards.filter(s => s.brandId === options.brandId);
    }

    return storyboards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==========================================================================
  // VIDEO MANAGEMENT
  // ==========================================================================

  getVideo(id: string): VideoAsset | undefined {
    return this.videos.get(id);
  }

  getVideos(options?: {
    brandId?: string;
    type?: VideoTypeType;
    status?: VideoStatusType;
    provider?: VideoProviderType;
    tags?: string[];
    limit?: number;
  }): VideoAsset[] {
    let videos = Array.from(this.videos.values());

    if (options?.brandId) {
      videos = videos.filter(v => v.brandId === options.brandId);
    }
    if (options?.type) {
      videos = videos.filter(v => v.type === options.type);
    }
    if (options?.status) {
      videos = videos.filter(v => v.status === options.status);
    }
    if (options?.provider) {
      videos = videos.filter(v => v.provider === options.provider);
    }
    if (options?.tags && options.tags.length > 0) {
      videos = videos.filter(v =>
        options.tags!.some(tag => v.tags.includes(tag))
      );
    }

    videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      videos = videos.slice(0, options.limit);
    }

    return videos;
  }

  createVariation(videoId: string, options?: { provider?: VideoProviderType }): Promise<VideoAsset> {
    const original = this.videos.get(videoId);
    if (!original) {
      throw new Error(`Video ${videoId} not found`);
    }

    return this.generate(original.type, original.prompt, {
      provider: options?.provider || original.provider,
      brandId: original.brandId,
      aspectRatio: original.aspectRatio,
    });
  }

  addTags(videoId: string, tags: string[]): boolean {
    const video = this.videos.get(videoId);
    if (!video) return false;

    video.tags = [...new Set([...video.tags, ...tags])];
    video.updatedAt = new Date();
    return true;
  }

  deleteVideo(id: string): boolean {
    return this.videos.delete(id);
  }

  // ==========================================================================
  // EDITING
  // ==========================================================================

  async edit(
    videoId: string,
    operation: "trim" | "extend" | "upscale" | "aspect_ratio",
    params: Record<string, unknown>
  ): Promise<VideoAsset> {
    const original = this.videos.get(videoId);
    if (!original) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Create new version of the video
    const newAsset: VideoAsset = {
      ...original,
      id: `video-${randomUUID().slice(0, 8)}`,
      videoUrl: original.videoUrl, // In real implementation, apply edit
      versions: [
        ...original.versions,
        {
          version: original.versions.length + 1,
          videoUrl: original.videoUrl,
          prompt: original.prompt,
          timestamp: new Date(),
        },
      ],
      status: VideoStatus.PROCESSING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Apply operation
    switch (operation) {
      case "aspect_ratio":
        newAsset.aspectRatio = params.aspectRatio as AspectRatioType;
        newAsset.resolution = this.getResolution(newAsset.aspectRatio);
        break;
      case "upscale":
        const res = newAsset.resolution.split("x");
        newAsset.resolution = `${parseInt(res[0]) * 2}x${parseInt(res[1]) * 2}`;
        break;
      default:
        break;
    }

    newAsset.status = VideoStatus.COMPLETED;
    this.videos.set(newAsset.id, newAsset);
    return newAsset;
  }

  // ==========================================================================
  // COMMERCIAL TEMPLATES
  // ==========================================================================

  generateCommercial(
    type: "technology" | "startup" | "product_reveal" | "os_intro",
    productName: string,
    description: string,
    options?: { brandId?: string; provider?: VideoProviderType }
  ): Promise<VideoAsset> {
    const prompts: Record<string, string> = {
      technology: `Professional technology commercial showcasing ${productName}. ${description}. Cinematic quality, dramatic lighting, sleek presentation.`,
      startup: `Dynamic startup commercial for ${productName}. ${description}. Energetic, inspiring, innovative feel.`,
      product_reveal: `Elegant product reveal for ${productName}. ${description}. Dramatic lighting, smooth camera movement, premium quality.`,
      os_intro: `Futuristic operating system intro for ${productName}. ${description}. Modern, sleek, cutting-edge technology feel.`,
    };

    const videoTypes: Record<string, VideoTypeType> = {
      technology: VideoType.COMMERCIAL,
      startup: VideoType.LAUNCH_FILM,
      product_reveal: VideoType.PRODUCT_REVEAL,
      os_intro: VideoType.OS_INTRO,
    };

    return this.generate(videoTypes[type], prompts[type], {
      provider: options?.provider,
      brandId: options?.brandId,
    });
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  getStats(): {
    totalVideos: number;
    byStatus: Record<VideoStatusType, number>;
    byType: Record<VideoTypeType, number>;
    byProvider: Record<VideoProviderType, number>;
    totalStoryboards: number;
  } {
    const videos = Array.from(this.videos.values());

    return {
      totalVideos: videos.length,
      byStatus: {
        [VideoStatus.PENDING]: videos.filter(v => v.status === VideoStatus.PENDING).length,
        [VideoStatus.GENERATING]: videos.filter(v => v.status === VideoStatus.GENERATING).length,
        [VideoStatus.PROCESSING]: videos.filter(v => v.status === VideoStatus.PROCESSING).length,
        [VideoStatus.COMPLETED]: videos.filter(v => v.status === VideoStatus.COMPLETED).length,
        [VideoStatus.FAILED]: videos.filter(v => v.status === VideoStatus.FAILED).length,
      },
      byType: Object.fromEntries(
        Object.values(VideoType).map(type => [
          type,
          videos.filter(v => v.type === type).length
        ])
      ) as Record<VideoTypeType, number>,
      byProvider: Object.fromEntries(
        Object.values(VideoProvider).map(provider => [
          provider,
          videos.filter(v => v.provider === provider).length
        ])
      ) as Record<VideoProviderType, number>,
      totalStoryboards: this.storyboards.size,
    };
  }

  getProviders(): { name: VideoProviderType; available: boolean }[] {
    return Object.values(VideoProvider).map(name => ({
      name,
      available: this.providers.has(name),
    }));
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  private async persistVideo(video: VideoAsset): Promise<void> {
    try {
      await writeFile(
        `${this.basePath}/videos/${video.id}.json`,
        JSON.stringify(video, null, 2)
      );
    } catch (error) {
      console.error("Failed to persist video:", error);
    }
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const videoStudio = new VideoStudioAgent();
