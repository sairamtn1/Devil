/**
 * DEVIL Ecosystem & Marketplace Platform
 * 
 * Phase 19: Transform DEVIL into an ecosystem operating platform.
 * 
 * Features:
 * - Marketplace Engine
 * - Plugin Platform
 * - Agent Creation Platform
 * - Workflow Marketplace
 * - Template System
 * - Developer Platform
 * - Ecosystem Governance
 * - Revenue & Monetization
 * - Integration Platform
 * - Trust & Security Framework
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

// Asset Types
export const AssetType = {
  PLUGIN: "plugin",
  AGENT: "agent",
  SKILL: "skill",
  TEMPLATE: "template",
  WORKFLOW: "workflow",
  INTEGRATION: "integration",
  MODEL: "model",
  KNOWLEDGE: "knowledge",
  VENTURE: "venture",
} as const;

export type AssetTypeType = typeof AssetType[keyof typeof AssetType];

// Asset Status
export const AssetStatus = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
  DEPRECATED: "deprecated",
  ARCHIVED: "archived",
} as const;

export type AssetStatusType = typeof AssetStatus[keyof typeof AssetStatus];

// Trust Level
export const TrustLevel = {
  UNTRUSTED: "untrusted",
  VERIFIED: "verified",
  TRUSTED: "trusted",
  PREMIUM: "premium",
} as const;

export type TrustLevelType = typeof TrustLevel[keyof typeof TrustLevel];

// Pricing Model
export const PricingModel = {
  FREE: "free",
  ONE_TIME: "one_time",
  SUBSCRIPTION: "subscription",
  USAGE_BASED: "usage_based",
  REVENUE_SHARE: "revenue_share",
} as const;

export type PricingModelType = typeof PricingModel[keyof typeof PricingModel];

// ============================================================================
// DEVELOPER
// ============================================================================

export interface Developer {
  id: string;
  name: string;
  email: string;
  organization?: string;
  trustLevel: TrustLevelType;
  assets: string[];
  totalInstalls: number;
  rating: number;
  revenue: number;
  joinedAt: Date;
  verified: boolean;
}

// ============================================================================
// ASSET
// ============================================================================

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetTypeType;
  version: string;
  status: AssetStatusType;
  developerId: string;
  category: string;
  tags: string[];
  pricing: {
    model: PricingModelType;
    price?: number;
    currency?: string;
  };
  trustLevel: TrustLevelType;
  trustScore: number;
  securityScore: number;
  qualityScore: number;
  installs: number;
  rating: number;
  reviews: number;
  dependencies: string[];
  permissions: string[];
  sandboxed: boolean;
  documentation: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// ============================================================================
// REVIEW
// ============================================================================

export interface Review {
  id: string;
  assetId: string;
  developerId: string;
  rating: number;
  comment: string;
  issues: string[];
  approved: boolean;
  createdAt: Date;
}

// ============================================================================
// INTEGRATION
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  status: "active" | "inactive" | "maintenance";
  rateLimit: number;
  authType: "oauth" | "api_key" | "basic" | "none";
  enabled: boolean;
  createdAt: Date;
}

// ============================================================================
// ECOSYSTEM PLATFORM
// ============================================================================

export class EcosystemPlatform {
  private developers: Map<string, Developer> = new Map();
  private assets: Map<string, Asset> = new Map();
  private reviews: Map<string, Review> = new Map();
  private integrations: Map<string, Integration> = new Map();
  private transactions: { assetId: string; amount: number; type: string; timestamp: Date }[] = [];

  constructor() {
    this.initializeDefaultAssets();
    this.initializeIntegrations();
    this.log("EcosystemPlatform initialized");
  }

  private initializeDefaultAssets() {
    // Sample plugins
    this.createAsset(
      "Advanced Analytics Plugin",
      "Comprehensive analytics and reporting for DEVIL",
      AssetType.PLUGIN,
      "plugin-analytics",
      "Analytics",
      ["reporting", "metrics", "dashboard"],
      PricingModel.SUBSCRIPTION,
      29.99
    );

    // Sample agents
    this.createAsset(
      "Security Auditor Agent",
      "Automated security vulnerability detection and remediation",
      AssetType.AGENT,
      "agent-security",
      "Security",
      ["security", "audit", "vulnerability"],
      PricingModel.FREE,
      0
    );

    // Sample templates
    this.createAsset(
      "SaaS Starter Template",
      "Complete SaaS application template with authentication and billing",
      AssetType.TEMPLATE,
      "template-saas",
      "Templates",
      ["saas", "boilerplate", "starter"],
      PricingModel.ONE_TIME,
      99.99
    );

    // Sample workflows
    this.createAsset(
      "CI/CD Pipeline Workflow",
      "Automated continuous integration and deployment pipeline",
      AssetType.WORKFLOW,
      "workflow-cicd",
      "DevOps",
      ["ci", "cd", "automation"],
      PricingModel.FREE,
      0
    );

    // Sample integrations
    this.createIntegration("GitHub", "git", "Repositories", "active", 5000, "oauth");
    this.createIntegration("GitLab", "git", "Repositories", "active", 5000, "oauth");
    this.createIntegration("Docker Hub", "containers", "Containers", "active", 1000, "api_key");
    this.createIntegration("AWS", "cloud", "Cloud Services", "active", 10000, "iam");
    this.createIntegration("Slack", "communication", "Notifications", "active", 5000, "oauth");
  }

  private initializeIntegrations() {
    // Additional integrations initialized in createAsset
  }

  // ==========================================================================
  // DEVELOPER MANAGEMENT
  // ==========================================================================

  registerDeveloper(name: string, email: string, organization?: string): Developer {
    const id = `dev-${randomUUID().slice(0, 8)}`;

    const developer: Developer = {
      id,
      name,
      email,
      organization,
      trustLevel: TrustLevel.UNTRUSTED,
      assets: [],
      totalInstalls: 0,
      rating: 0,
      revenue: 0,
      joinedAt: new Date(),
      verified: false,
    };

    this.developers.set(id, developer);
    return developer;
  }

  getDeveloper(id: string): Developer | undefined {
    return this.developers.get(id);
  }

  getDevelopers(options?: { trustLevel?: TrustLevelType; verified?: boolean }): Developer[] {
    let devs = Array.from(this.developers.values());
    if (options?.trustLevel) {
      devs = devs.filter(d => d.trustLevel === options.trustLevel);
    }
    if (options?.verified !== undefined) {
      devs = devs.filter(d => d.verified === options.verified);
    }
    return devs.sort((a, b) => b.totalInstalls - a.totalInstalls);
  }

  verifyDeveloper(id: string): Developer | undefined {
    const dev = this.developers.get(id);
    if (dev) {
      dev.verified = true;
      dev.trustLevel = TrustLevel.VERIFIED;
    }
    return dev;
  }

  updateDeveloperTrustLevel(id: string, level: TrustLevelType) {
    const dev = this.developers.get(id);
    if (dev) {
      dev.trustLevel = level;
    }
  }

  // ==========================================================================
  // ASSET MANAGEMENT
  // ==========================================================================

  createAsset(
    name: string,
    description: string,
    type: AssetTypeType,
    developerId: string,
    category: string,
    tags: string[],
    pricingModel: PricingModelType,
    price: number = 0
  ): Asset {
    const id = `asset-${randomUUID().slice(0, 8)}`;

    const asset: Asset = {
      id,
      name,
      description,
      type,
      version: "1.0.0",
      status: AssetStatus.DRAFT,
      developerId,
      category,
      tags,
      pricing: {
        model: pricingModel,
        price: price > 0 ? price : undefined,
        currency: price > 0 ? "USD" : undefined,
      },
      trustLevel: TrustLevel.UNTRUSTED,
      trustScore: 0,
      securityScore: 80,
      qualityScore: 0,
      installs: 0,
      rating: 0,
      reviews: 0,
      dependencies: [],
      permissions: [],
      sandboxed: type === AssetType.PLUGIN,
      documentation: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(id, asset);

    // Link to developer
    const dev = this.developers.get(developerId);
    if (dev) {
      dev.assets.push(id);
    }

    return asset;
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  getAssets(options?: {
    type?: AssetTypeType;
    status?: AssetStatusType;
    category?: string;
    developerId?: string;
  }): Asset[] {
    let assets = Array.from(this.assets.values());
    
    if (options?.type) assets = assets.filter(a => a.type === options.type);
    if (options?.status) assets = assets.filter(a => a.status === options.status);
    if (options?.category) assets = assets.filter(a => a.category === options.category);
    if (options?.developerId) assets = assets.filter(a => a.developerId === options.developerId);

    return assets.sort((a, b) => b.installs - a.installs);
  }

  publishAsset(id: string): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset) {
      asset.status = AssetStatus.PUBLISHED;
      asset.publishedAt = new Date();
      asset.updatedAt = new Date();
    }
    return asset;
  }

  installAsset(id: string): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset && asset.status === AssetStatus.PUBLISHED) {
      asset.installs++;
      
      // Update developer stats
      const dev = this.developers.get(asset.developerId);
      if (dev) {
        dev.totalInstalls++;
      }

      // Update quality score based on installs
      asset.qualityScore = Math.min(100, 50 + Math.log10(asset.installs + 1) * 10);
    }
    return asset;
  }

  rateAsset(id: string, rating: number): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset) {
      const totalRatings = asset.reviews * asset.rating;
      asset.reviews++;
      asset.rating = (totalRatings + rating) / asset.reviews;
    }
    return asset;
  }

  // ==========================================================================
  // GOVERNANCE & REVIEWS
  // ==========================================================================

  submitForReview(id: string): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset) {
      asset.status = AssetStatus.PENDING_REVIEW;
      asset.updatedAt = new Date();
    }
    return asset;
  }

  approveAsset(id: string): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset) {
      asset.status = AssetStatus.APPROVED;
      asset.trustLevel = TrustLevel.VERIFIED;
      asset.trustScore = 70;
      asset.updatedAt = new Date();
    }
    return asset;
  }

  rejectAsset(id: string, reason: string): Asset | undefined {
    const asset = this.assets.get(id);
    if (asset) {
      asset.status = AssetStatus.REJECTED;
      asset.updatedAt = new Date();
    }
    return asset;
  }

  createReview(assetId: string, developerId: string, rating: number, comment: string): Review {
    const id = `review-${randomUUID().slice(0, 8)}`;

    const review: Review = {
      id,
      assetId,
      developerId,
      rating,
      comment,
      issues: [],
      approved: rating >= 4,
      createdAt: new Date(),
    };

    this.reviews.set(id, review);

    // Update asset rating
    this.rateAsset(assetId, rating);

    return review;
  }

  getReviews(assetId: string): Review[] {
    return Array.from(this.reviews.values()).filter(r => r.assetId === assetId);
  }

  // ==========================================================================
  // INTEGRATIONS
  // ==========================================================================

  createIntegration(
    name: string,
    type: string,
    category: string,
    status: Integration["status"],
    rateLimit: number,
    authType: Integration["authType"]
  ): Integration {
    const id = `int-${randomUUID().slice(0, 8)}`;

    const integration: Integration = {
      id,
      name,
      type,
      category,
      status,
      rateLimit,
      authType,
      enabled: true,
      createdAt: new Date(),
    };

    this.integrations.set(id, integration);
    return integration;
  }

  getIntegrations(options?: { type?: string; status?: string }): Integration[] {
    let ints = Array.from(this.integrations.values());
    if (options?.type) ints = ints.filter(i => i.type === options.type);
    if (options?.status) ints = ints.filter(i => i.status === options.status);
    return ints;
  }

  enableIntegration(id: string): Integration | undefined {
    const int = this.integrations.get(id);
    if (int) int.enabled = true;
    return int;
  }

  disableIntegration(id: string): Integration | undefined {
    const int = this.integrations.get(id);
    if (int) int.enabled = false;
    return int;
  }

  // ==========================================================================
  // REVENUE & MONETIZATION
  // ==========================================================================

  recordTransaction(assetId: string, amount: number, type: string) {
    this.transactions.push({
      assetId,
      amount,
      type,
      timestamp: new Date(),
    });

    // Update developer revenue
    const asset = this.assets.get(assetId);
    if (asset) {
      const dev = this.developers.get(asset.developerId);
      if (dev) {
        const platformFee = amount * 0.15; // 15% platform fee
        dev.revenue += amount - platformFee;
      }
    }
  }

  getRevenue(options?: { assetId?: string; developerId?: string }): {
    total: number;
    platformRevenue: number;
    developerRevenue: number;
    transactions: number;
  } {
    let filtered = this.transactions;
    
    if (options?.assetId) {
      filtered = filtered.filter(t => t.assetId === options.assetId);
    }

    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    const platformRevenue = total * 0.15;
    const developerRevenue = total * 0.85;

    return {
      total,
      platformRevenue,
      developerRevenue,
      transactions: filtered.length,
    };
  }

  // ==========================================================================
  // ECOSYSTEM INTELLIGENCE
  // ==========================================================================

  getEcosystemMetrics(): {
    totalDevelopers: number;
    activeDevelopers: number;
    totalAssets: number;
    publishedAssets: number;
    totalInstalls: number;
    totalRevenue: number;
    averageRating: number;
    trustDistribution: Record<string, number>;
    assetDistribution: Record<string, number>;
  } {
    const developers = Array.from(this.developers.values());
    const assets = Array.from(this.assets.values());
    const published = assets.filter(a => a.status === AssetStatus.PUBLISHED);

    const trustDistribution: Record<string, number> = {};
    developers.forEach(d => {
      trustDistribution[d.trustLevel] = (trustDistribution[d.trustLevel] || 0) + 1;
    });

    const assetDistribution: Record<string, number> = {};
    published.forEach(a => {
      assetDistribution[a.type] = (assetDistribution[a.type] || 0) + 1;
    });

    return {
      totalDevelopers: developers.length,
      activeDevelopers: developers.filter(d => d.assets.length > 0).length,
      totalAssets: assets.length,
      publishedAssets: published.length,
      totalInstalls: assets.reduce((sum, a) => sum + a.installs, 0),
      totalRevenue: this.transactions.reduce((sum, t) => sum + t.amount, 0),
      averageRating: assets.length > 0 ? assets.reduce((sum, a) => sum + a.rating, 0) / assets.length : 0,
      trustDistribution,
      assetDistribution,
    };
  }

  // ==========================================================================
  // SEARCH & RECOMMENDATIONS
  // ==========================================================================

  searchAssets(query: string, options?: { type?: AssetTypeType; limit?: number }): Asset[] {
    const lowerQuery = query.toLowerCase();
    let assets = Array.from(this.assets.values())
      .filter(a => 
        a.status === AssetStatus.PUBLISHED &&
        (a.name.toLowerCase().includes(lowerQuery) ||
         a.description.toLowerCase().includes(lowerQuery) ||
         a.tags.some(t => t.toLowerCase().includes(lowerQuery)))
      );

    if (options?.type) {
      assets = assets.filter(a => a.type === options.type);
    }

    // Sort by relevance (installs + rating)
    assets.sort((a, b) => (b.installs * 0.7 + b.rating * 10 * 0.3) - (a.installs * 0.7 + a.rating * 10 * 0.3));

    if (options?.limit) {
      assets = assets.slice(0, options.limit);
    }

    return assets;
  }

  getTrendingAssets(limit: number = 10): Asset[] {
    return Array.from(this.assets.values())
      .filter(a => a.status === AssetStatus.PUBLISHED)
      .sort((a, b) => (b.installs + b.rating * 100) - (a.installs + a.rating * 100))
      .slice(0, limit);
  }

  getRecommendedAssets(developerId: string, limit: number = 5): Asset[] {
    const dev = this.developers.get(developerId);
    if (!dev) return [];

    const devAssets = dev.assets.map(id => this.assets.get(id)).filter(Boolean) as Asset[];
    if (devAssets.length === 0) return this.getTrendingAssets(limit);

    // Get categories the developer is interested in
    const categories = [...new Set(devAssets.map(a => a.category))];
    const tags = [...new Set(devAssets.flatMap(a => a.tags))];

    return Array.from(this.assets.values())
      .filter(a => 
        a.status === AssetStatus.PUBLISHED &&
        !dev.assets.includes(a.id) &&
        (categories.includes(a.category) || a.tags.some(t => tags.includes(t)))
      )
      .sort((a, b) => (b.installs + b.rating * 100) - (a.installs + a.rating * 100))
      .slice(0, limit);
  }

  // ==========================================================================
  // TRUST & SECURITY
  // ==========================================================================

  calculateTrustScore(assetId: string): number {
    const asset = this.assets.get(assetId);
    if (!asset) return 0;

    let score = 50;

    // Base score from status
    if (asset.status === AssetStatus.PUBLISHED) score += 20;
    if (asset.trustLevel === TrustLevel.VERIFIED) score += 10;
    if (asset.trustLevel === TrustLevel.TRUSTED) score += 15;
    if (asset.trustLevel === TrustLevel.PREMIUM) score += 20;

    // Quality factors
    score += asset.securityScore * 0.1;
    score += asset.qualityScore * 0.1;
    score += Math.min(asset.installs / 100, 10);
    score += asset.rating * 2;

    return Math.min(100, score);
  }

  evaluateSecurity(assetId: string): { score: number; issues: string[] } {
    const asset = this.assets.get(assetId);
    if (!asset) return { score: 0, issues: [] };

    let score = 80;
    const issues: string[] = [];

    if (asset.permissions.length > 10) {
      score -= 10;
      issues.push("Too many permissions requested");
    }

    if (!asset.sandboxed) {
      score -= 15;
      issues.push("Not sandboxed - potential security risk");
    }

    if (!asset.documentation) {
      score -= 5;
      issues.push("Missing documentation");
    }

    return { score: Math.max(0, score), issues };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "ecosystem",
      severity: "info",
      message,
      details: { engine: "ecosystem_platform" },
    });
  }

  getDashboard(): {
    metrics: ReturnType<typeof this.getEcosystemMetrics>;
    topAssets: Asset[];
    topDevelopers: Developer[];
    recentActivity: { type: string; count: number }[];
  } {
    const metrics = this.getEcosystemMetrics();
    const topAssets = this.getTrendingAssets(5);
    const topDevelopers = this.getDevelopers().slice(0, 5);

    const recentActivity = [
      { type: "installs", count: metrics.totalInstalls },
      { type: "assets", count: metrics.publishedAssets },
      { type: "developers", count: metrics.totalDevelopers },
    ];

    return { metrics, topAssets, topDevelopers, recentActivity };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const ecosystemPlatform = new EcosystemPlatform();
