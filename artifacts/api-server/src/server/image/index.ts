/**
 * DEVIL Image Studio - Provider Layer & Agent
 * 
 * Image generation, editing, and asset management.
 * - Provider abstraction (OpenAI, Flux, Stable Diffusion)
 * - Brand system integration
 * - Asset library
 * - Prompt pipeline
 */

import { logEvent } from "../control-plane/eventLog";
import { randomUUID } from "crypto";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join, existsSync } from "path";

// ============================================================================
// TYPES
// ============================================================================

// Image Providers
export const ImageProvider = {
  OPENAI: "openai",
  FLUX: "flux",
  STABLE_DIFFUSION: "stable_diffusion",
  // Future
  IDEOGRAM: "ideogram",
  MIDJOURNEY: "midjourney",
  RECRAFT: "recraft",
} as const;

export type ImageProviderType = typeof ImageProvider[keyof typeof ImageProvider];

// Image Types
export const ImageType = {
  LOGO: "logo",
  APP_ICON: "app_icon",
  FAVICON: "favicon",
  LANDING_PAGE: "landing_page",
  DASHBOARD: "dashboard",
  MOBILE_UI: "mobile_ui",
  ILLUSTRATION: "illustration",
  BANNER: "banner",
  MARKETING: "marketing",
  ICON: "icon",
  AVATAR: "avatar",
  THUMBNAIL: "thumbnail",
} as const;

export type ImageTypeType = typeof ImageType[keyof typeof ImageType];

// Image Generation Status
export const ImageStatus = {
  PENDING: "pending",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ImageStatusType = typeof ImageStatus[keyof typeof ImageStatus];

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface ImageProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  provider?: ImageProviderType;
  model?: string;
  width?: number;
  height?: number;
  quality?: "standard" | "hd";
  style?: string;
  seed?: number;
  n?: number; // Number of images
}

export interface GenerationResult {
  id: string;
  provider: ImageProviderType;
  imageUrl?: string;
  base64?: string;
  revisedPrompt?: string;
  seed?: number;
  timings?: {
    inference: number;
    total: number;
  };
  success: boolean;
  error?: string;
}

export interface ImageProviderAdapter {
  name: ImageProviderType;
  generate(request: GenerationRequest): Promise<GenerationResult>;
  edit(imageUrl: string, prompt: string): Promise<GenerationResult>;
  variation(imageUrl: string): Promise<GenerationResult>;
}

// ============================================================================
// OPENAI IMAGES PROVIDER
// ============================================================================

class OpenAIImagesProvider implements ImageProviderAdapter {
  name = ImageProvider.OPENAI;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ImageProviderConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    
    try {
      // In production, make actual API call
      // For now, return mock result
      return {
        id,
        provider: this.name,
        imageUrl: `https://picsum.photos/seed/${id}/${request.width || 1024}/${request.height || 1024}`,
        revisedPrompt: request.prompt,
        success: true,
      };
    } catch (error) {
      return {
        id,
        provider: this.name,
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      };
    }
  }

  async edit(imageUrl: string, prompt: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-edit/1024/1024`,
      revisedPrompt: prompt,
      success: true,
    };
  }

  async variation(imageUrl: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-var/1024/1024`,
      success: true,
    };
  }
}

// ============================================================================
// FLUX PROVIDER
// ============================================================================

class FluxProvider implements ImageProviderAdapter {
  name = ImageProvider.FLUX;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ImageProviderConfig) {
    this.apiKey = config.apiKey || process.env.FLUX_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.flux.ai/v1";
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-flux/1024/1024`,
      revisedPrompt: request.prompt,
      success: true,
    };
  }

  async edit(imageUrl: string, prompt: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-flux-edit/1024/1024`,
      success: true,
    };
  }

  async variation(imageUrl: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-flux-var/1024/1024`,
      success: true,
    };
  }
}

// ============================================================================
// STABLE DIFFUSION PROVIDER
// ============================================================================

class StableDiffusionProvider implements ImageProviderAdapter {
  name = ImageProvider.STABLE_DIFFUSION;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ImageProviderConfig) {
    this.apiKey = config.apiKey || process.env.SD_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.stability.ai/v1";
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-sd/1024/1024`,
      revisedPrompt: request.prompt,
      success: true,
    };
  }

  async edit(imageUrl: string, prompt: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-sd-edit/1024/1024`,
      success: true,
    };
  }

  async variation(imageUrl: string): Promise<GenerationResult> {
    const id = `img-${randomUUID().slice(0, 8)}`;
    return {
      id,
      provider: this.name,
      imageUrl: `https://picsum.photos/seed/${id}-sd-var/1024/1024`,
      success: true,
    };
  }
}

// ============================================================================
// BRAND SYSTEM
// ============================================================================

export interface Brand {
  id: string;
  name: string;
  userId?: string;
  colors: BrandColor[];
  typography: BrandTypography;
  visualStyle: string;
  logoHistory: BrandAsset[];
  iconHistory: BrandAsset[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export interface BrandTypography {
  heading: string;
  body: string;
  accent?: string;
}

export interface BrandAsset {
  assetId: string;
  type: ImageTypeType;
  prompt: string;
  imageUrl: string;
  approved: boolean;
  timestamp: Date;
}

// ============================================================================
// ASSET
// ============================================================================

export interface Asset {
  id: string;
  brandId?: string;
  type: ImageTypeType;
  provider: ImageProviderType;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  metadata: AssetMetadata;
  versions: AssetVersion[];
  tags: string[];
  status: ImageStatusType;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetMetadata {
  seed?: number;
  steps?: number;
  cfgScale?: number;
  model?: string;
  style?: string;
  inferenceTime?: number;
}

export interface AssetVersion {
  version: number;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

// ============================================================================
// IMAGE STUDIO AGENT
// ============================================================================

export class ImageStudioAgent {
  private providers: Map<ImageProviderType, ImageProviderAdapter> = new Map();
  private assets: Map<string, Asset> = new Map();
  private brands: Map<string, Brand> = new Map();
  private basePath: string = "/tmp/devil-images";

  constructor() {
    // Initialize providers
    this.providers.set(ImageProvider.OPENAI, new OpenAIImagesProvider({}));
    this.providers.set(ImageProvider.FLUX, new FluxProvider({}));
    this.providers.set(ImageProvider.STABLE_DIFFUSION, new StableDiffusionProvider({}));

    // Ensure directories exist
    mkdir(this.basePath, { recursive: true });
    mkdir(`${this.basePath}/brands`, { recursive: true });
    mkdir(`${this.basePath}/assets`, { recursive: true });

    logEvent({
      eventType: "image_studio_initialized",
      severity: "info",
      message: "Image Studio Agent initialized",
      details: { providers: this.providers.size }
    });
  }

  // ==========================================================================
  // GENERATION
  // ==========================================================================

  async generate(
    type: ImageTypeType,
    prompt: string,
    options?: {
      provider?: ImageProviderType;
      brandId?: string;
      negativePrompt?: string;
      width?: number;
      height?: number;
      style?: string;
      userId?: string;
    }
  ): Promise<Asset> {
    const id = `asset-${randomUUID().slice(0, 8)}`;
    const provider = options?.provider || ImageProvider.OPENAI;
    const providerAdapter = this.providers.get(provider);

    if (!providerAdapter) {
      throw new Error(`Provider ${provider} not available`);
    }

    // Enhance prompt based on type
    const enhancedPrompt = this.enhancePrompt(type, prompt, options?.brandId);

    // Create pending asset
    const asset: Asset = {
      id,
      brandId: options?.brandId,
      type,
      provider,
      prompt: enhancedPrompt,
      negativePrompt: options?.negativePrompt,
      imageUrl: "",
      width: options?.width || 1024,
      height: options?.height || 1024,
      metadata: {
        model: provider,
        style: options?.style,
      },
      versions: [],
      tags: [type, provider],
      status: ImageStatus.GENERATING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(id, asset);

    try {
      const result = await providerAdapter.generate({
        prompt: enhancedPrompt,
        negativePrompt: options?.negativePrompt,
        width: options?.width || 1024,
        height: options?.height || 1024,
        style: options?.style,
      });

      if (result.success) {
        asset.imageUrl = result.imageUrl || "";
        asset.status = ImageStatus.COMPLETED;
        asset.metadata.inferenceTime = result.timings?.inference;
      } else {
        asset.status = ImageStatus.FAILED;
        asset.error = result.error;
      }

      logEvent({
        eventType: "image_generated",
        severity: result.success ? "info" : "error",
        message: `Image ${result.success ? "generated" : "failed"}: ${type}`,
        details: { assetId: id, provider, success: result.success }
      });
    } catch (error) {
      asset.status = ImageStatus.FAILED;
      asset.error = error instanceof Error ? error.message : "Unknown error";
    }

    asset.updatedAt = new Date();
    await this.persistAsset(asset);

    return asset;
  }

  private enhancePrompt(
    type: ImageTypeType,
    prompt: string,
    brandId?: string
  ): string {
    const typeEnhancements: Record<ImageTypeType, string> = {
      [ImageType.LOGO]: "professional logo design, vector style, clean lines, simple, minimal",
      [ImageType.APP_ICON]: "iOS app icon, rounded corners, 1024x1024, simple, recognizable",
      [ImageType.FAVICON]: "favicon, tiny, simple, 16x16, recognizable at small size",
      [ImageType.LANDING_PAGE]: "landing page mockup, modern, clean design, UI/UX",
      [ImageType.DASHBOARD]: "dashboard UI mockup, data visualization, modern design",
      [ImageType.MOBILE_UI]: "mobile app screen, iOS or Android, modern UI, clean",
      [ImageType.ILLUSTRATION]: "digital illustration, vibrant colors, detailed, artistic",
      [ImageType.BANNER]: "banner design, horizontal, marketing asset, eye-catching",
      [ImageType.MARKETING]: "marketing asset, professional, high quality, promotional",
      [ImageType.ICON]: "icon design, flat, modern, consistent stroke width",
      [ImageType.AVATAR]: "avatar, portrait, professional, clean background",
      [ImageType.THUMBNAIL]: "thumbnail, YouTube/blog, eye-catching, high contrast",
    };

    let enhanced = prompt;
    
    if (typeEnhancements[type]) {
      enhanced = `${prompt}, ${typeEnhancements[type]}`;
    }

    // Add brand context if available
    if (brandId) {
      const brand = this.brands.get(brandId);
      if (brand) {
        const colorNames = brand.colors.map(c => c.name).join(", ");
        if (colorNames) {
          enhanced += `, brand colors: ${colorNames}`;
        }
      }
    }

    return enhanced;
  }

  // ==========================================================================
  // EDITING
  // ==========================================================================

  async edit(
    assetId: string,
    prompt: string,
    options?: { provider?: ImageProviderType }
  ): Promise<Asset> {
    const original = this.assets.get(assetId);
    if (!original) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const provider = options?.provider || original.provider;
    const providerAdapter = this.providers.get(provider);

    if (!providerAdapter) {
      throw new Error(`Provider ${provider} not available`);
    }

    const newAsset: Asset = {
      ...original,
      id: `asset-${randomUUID().slice(0, 8)}`,
      prompt,
      imageUrl: "",
      versions: [
        ...original.versions,
        {
          version: original.versions.length + 1,
          imageUrl: original.imageUrl,
          prompt: original.prompt,
          timestamp: new Date(),
        },
      ],
      status: ImageStatus.GENERATING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(newAsset.id, newAsset);

    try {
      const result = await providerAdapter.edit(original.imageUrl, prompt);

      if (result.success) {
        newAsset.imageUrl = result.imageUrl || "";
        newAsset.status = ImageStatus.COMPLETED;
      } else {
        newAsset.status = ImageStatus.FAILED;
        newAsset.error = result.error;
      }
    } catch (error) {
      newAsset.status = ImageStatus.FAILED;
      newAsset.error = error instanceof Error ? error.message : "Unknown error";
    }

    newAsset.updatedAt = new Date();
    return newAsset;
  }

  async createVariation(
    assetId: string,
    options?: { provider?: ImageProviderType }
  ): Promise<Asset> {
    const original = this.assets.get(assetId);
    if (!original) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const provider = options?.provider || original.provider;
    const providerAdapter = this.providers.get(provider);

    if (!providerAdapter) {
      throw new Error(`Provider ${provider} not available`);
    }

    const newAsset: Asset = {
      ...original,
      id: `asset-${randomUUID().slice(0, 8)}`,
      imageUrl: "",
      versions: [],
      status: ImageStatus.GENERATING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(newAsset.id, newAsset);

    try {
      const result = await providerAdapter.variation(original.imageUrl);

      if (result.success) {
        newAsset.imageUrl = result.imageUrl || "";
        newAsset.status = ImageStatus.COMPLETED;
      } else {
        newAsset.status = ImageStatus.FAILED;
        newAsset.error = result.error;
      }
    } catch (error) {
      newAsset.status = ImageStatus.FAILED;
      newAsset.error = error instanceof Error ? error.message : "Unknown error";
    }

    newAsset.updatedAt = new Date();
    return newAsset;
  }

  // ==========================================================================
  // ASSET MANAGEMENT
  // ==========================================================================

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  getAssets(options?: {
    brandId?: string;
    type?: ImageTypeType;
    status?: ImageStatusType;
    tags?: string[];
    limit?: number;
  }): Asset[] {
    let assets = Array.from(this.assets.values());

    if (options?.brandId) {
      assets = assets.filter(a => a.brandId === options.brandId);
    }
    if (options?.type) {
      assets = assets.filter(a => a.type === options.type);
    }
    if (options?.status) {
      assets = assets.filter(a => a.status === options.status);
    }
    if (options?.tags && options.tags.length > 0) {
      assets = assets.filter(a =>
        options.tags!.some(tag => a.tags.includes(tag))
      );
    }

    // Sort by newest first
    assets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      assets = assets.slice(0, options.limit);
    }

    return assets;
  }

  addTags(assetId: string, tags: string[]): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.tags = [...new Set([...asset.tags, ...tags])];
    asset.updatedAt = new Date();
    return true;
  }

  deleteAsset(id: string): boolean {
    return this.assets.delete(id);
  }

  // ==========================================================================
  // BRAND MANAGEMENT
  // ==========================================================================

  createBrand(data: {
    name: string;
    userId?: string;
    colors?: BrandColor[];
    typography?: BrandTypography;
    visualStyle?: string;
  }): Brand {
    const id = `brand-${randomUUID().slice(0, 8)}`;

    const brand: Brand = {
      id,
      name: data.name,
      userId: data.userId,
      colors: data.colors || [],
      typography: data.typography || { heading: "Arial", body: "Arial" },
      visualStyle: data.visualStyle || "modern",
      logoHistory: [],
      iconHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.brands.set(id, brand);
    this.persistBrand(brand);

    logEvent({
      eventType: "brand_created",
      severity: "info",
      message: `Brand created: ${name}`,
      details: { brandId: id }
    });

    return brand;
  }

  getBrand(id: string): Brand | undefined {
    return this.brands.get(id);
  }

  getBrands(userId?: string): Brand[] {
    let brands = Array.from(this.brands.values());

    if (userId) {
      brands = brands.filter(b => b.userId === userId);
    }

    return brands;
  }

  updateBrand(id: string, updates: Partial<Brand>): Brand | undefined {
    const brand = this.brands.get(id);
    if (!brand) return undefined;

    Object.assign(brand, updates, { updatedAt: new Date() });
    this.persistBrand(brand);

    return brand;
  }

  addBrandAsset(
    brandId: string,
    assetId: string,
    type: ImageTypeType,
    prompt: string,
    imageUrl: string
  ): boolean {
    const brand = this.brands.get(brandId);
    if (!brand) return false;

    const asset: BrandAsset = {
      assetId,
      type,
      prompt,
      imageUrl,
      approved: false,
      timestamp: new Date(),
    };

    if (type === ImageType.LOGO || type === ImageType.FAVICON || type === ImageType.APP_ICON) {
      brand.logoHistory.push(asset);
    } else if (type === ImageType.ICON) {
      brand.iconHistory.push(asset);
    }

    brand.updatedAt = new Date();
    this.persistBrand(brand);

    return true;
  }

  approveBrandAsset(brandId: string, assetId: string): boolean {
    const brand = this.brands.get(brandId);
    if (!brand) return false;

    const allAssets = [...brand.logoHistory, ...brand.iconHistory];
    const asset = allAssets.find(a => a.assetId === assetId);
    if (asset) {
      asset.approved = true;
      brand.updatedAt = new Date();
      this.persistBrand(brand);
    }

    return true;
  }

  // ==========================================================================
  // PROMPT PIPELINE
  // ==========================================================================

  buildPrompt(
    type: ImageTypeType,
    description: string,
    context?: {
      brandId?: string;
      style?: string;
      colors?: string[];
      mood?: string;
    }
  ): string {
    let prompt = description;

    // Add type-specific enhancements
    prompt = this.enhancePrompt(type, description, context?.brandId);

    // Add style context
    if (context?.style) {
      prompt += `, ${context.style} style`;
    }

    // Add mood context
    if (context?.mood) {
      prompt += `, ${context.mood} mood`;
    }

    // Add color preferences
    if (context?.colors && context.colors.length > 0) {
      prompt += `, colors: ${context.colors.join(", ")}`;
    }

    return prompt;
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  getStats(): {
    totalAssets: number;
    byStatus: Record<ImageStatusType, number>;
    byType: Record<ImageTypeType, number>;
    byProvider: Record<ImageProviderType, number>;
    totalBrands: number;
  } {
    const assets = Array.from(this.assets.values());

    return {
      totalAssets: assets.length,
      byStatus: {
        [ImageStatus.PENDING]: assets.filter(a => a.status === ImageStatus.PENDING).length,
        [ImageStatus.GENERATING]: assets.filter(a => a.status === ImageStatus.GENERATING).length,
        [ImageStatus.COMPLETED]: assets.filter(a => a.status === ImageStatus.COMPLETED).length,
        [ImageStatus.FAILED]: assets.filter(a => a.status === ImageStatus.FAILED).length,
      },
      byType: Object.fromEntries(
        Object.values(ImageType).map(type => [
          type,
          assets.filter(a => a.type === type).length
        ])
      ) as Record<ImageTypeType, number>,
      byProvider: Object.fromEntries(
        Object.values(ImageProvider).map(provider => [
          provider,
          assets.filter(a => a.provider === provider).length
        ])
      ) as Record<ImageProviderType, number>,
      totalBrands: this.brands.size,
    };
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  private async persistAsset(asset: Asset): Promise<void> {
    try {
      await writeFile(
        join(this.basePath, "assets", `${asset.id}.json`),
        JSON.stringify(asset, null, 2)
      );
    } catch (error) {
      console.error("Failed to persist asset:", error);
    }
  }

  private async persistBrand(brand: Brand): Promise<void> {
    try {
      await writeFile(
        join(this.basePath, "brands", `${brand.id}.json`),
        JSON.stringify(brand, null, 2)
      );
    } catch (error) {
      console.error("Failed to persist brand:", error);
    }
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const imageStudio = new ImageStudioAgent();
