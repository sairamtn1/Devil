/**
 * DEVIL Autonomous Product & Venture Factory
 * 
 * Phase 18: Transform DEVIL into an autonomous venture creation platform.
 * 
 * Features:
 * - Venture Creation Pipeline
 * - Opportunity Discovery Engine
 * - Venture Ideation Engine
 * - Validation Engine
 * - Product Architecture Engine
 * - Product Design Engine
 * - Autonomous Development Engine
 * - Product Launch Engine
 * - Growth Engine
 * - Portfolio Management
 * - Venture Intelligence
 * - Business Simulation
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

// Venture Status
export const VentureStatus = {
  IDEATION: "ideation",
  RESEARCH: "research",
  VALIDATION: "validation",
  DESIGN: "design",
  DEVELOPMENT: "development",
  TESTING: "testing",
  LAUNCH: "launch",
  GROWTH: "growth",
  SCALE: "scale",
  MATURE: "mature",
  ARCHIVED: "archived",
} as const;

export type VentureStatusType = typeof VentureStatus[keyof typeof VentureStatus];

// Opportunity Status
export const OpportunityStatus = {
  DISCOVERED: "discovered",
  EVALUATING: "evaluating",
  VALIDATED: "validated",
  REJECTED: "rejected",
  PURSUING: "pursuing",
} as const;

export type OpportunityStatusType = typeof OpportunityStatus[keyof typeof OpportunityStatus];

// Product Status
export const ProductStatus = {
  PLANNING: "planning",
  DESIGNING: "designing",
  DEVELOPING: "developing",
  TESTING: "testing",
  LAUNCHED: "launched",
  GROWING: "growing",
  OPTIMIZING: "optimizing",
} as const;

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];

// ============================================================================
// OPPORTUNITY
// ============================================================================

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: "market_gap" | "unsolved_problem" | "emerging_trend" | "tech_shift" | "pain_point" | "revenue";
  status: OpportunityStatusType;
  strategicValue: number;
  marketSize: number;
  feasibility: number;
  competition: number;
  risk: number;
  expectedROI: number;
  confidenceScore: number;
  createdAt: Date;
}

// ============================================================================
// VENTURE
// ============================================================================

export interface Venture {
  id: string;
  name: string;
  description: string;
  status: VentureStatusType;
  opportunityId?: string;
  products: string[];
  team: string[];
  budget: number;
  spent: number;
  revenue: number;
  customers: number;
  growth: number;
  confidenceScore: number;
  milestones: { milestone: string; completed: boolean; date?: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRODUCT
// ============================================================================

export interface Product {
  id: string;
  ventureId: string;
  name: string;
  description: string;
  type: "saas" | "mobile" | "api" | "platform" | "ai" | "automation" | "content";
  status: ProductStatusType;
  features: { name: string; priority: number; status: string }[];
  users: number;
  revenue: number;
  mrr: number;
  retention: number;
  acquisition: number;
  conversion: number;
  createdAt: Date;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  id: string;
  ventureId: string;
  demandValid: boolean;
  competitionValid: boolean;
  feasibilityValid: boolean;
  complexityValid: boolean;
  costValid: boolean;
  viabilityValid: boolean;
  confidenceScore: number;
  risks: string[];
  recommendations: string[];
  validatedAt: Date;
}

// ============================================================================
// GROWTH METRICS
// ============================================================================

export interface GrowthMetrics {
  retention: number;
  acquisition: number;
  revenue: number;
  conversion: number;
  engagement: number;
  nps: number;
  churn: number;
  ltv: number;
  cac: number;
}

// ============================================================================
// VENTURE FACTORY
// ============================================================================

export class VentureFactory {
  private opportunities: Map<string, Opportunity> = new Map();
  private ventures: Map<string, Venture> = new Map();
  private products: Map<string, Product> = new Map();
  private validations: Map<string, ValidationResult> = new Map();
  private growthMetrics: Map<string, GrowthMetrics> = new Map();

  constructor() {
    this.initializeDefaultVentures();
    this.log("VentureFactory initialized");
  }

  private initializeDefaultVentures() {
    // Initialize with some sample ventures
    this.addOpportunity(
      "AI-Powered Analytics Platform",
      "Build a comprehensive analytics platform with AI-driven insights",
      "tech_shift",
      85, 5000000, 75, 40, 25, 3.5
    );

    this.addOpportunity(
      "Automated Code Review SaaS",
      "AI-powered code review and security scanning service",
      "market_gap",
      80, 2000000, 85, 50, 20, 4.0
    );

    this.addOpportunity(
      "No-Code ML Platform",
      "Democratize machine learning with no-code tools",
      "emerging_trend",
      90, 10000000, 60, 35, 40, 2.5
    );
  }

  // ==========================================================================
  // OPPORTUNITY DISCOVERY ENGINE
  // ==========================================================================

  addOpportunity(
    title: string,
    description: string,
    category: Opportunity["category"],
    strategicValue: number,
    marketSize: number,
    feasibility: number,
    competition: number,
    risk: number,
    expectedROI: number
  ): Opportunity {
    const id = `opp-${randomUUID().slice(0, 8)}`;

    // Calculate confidence score
    const confidenceScore = (
      strategicValue * 0.2 +
      Math.min(marketSize / 100000, 1) * 0.2 +
      feasibility * 0.2 +
      (100 - competition) * 0.2 +
      (100 - risk) * 0.1 +
      Math.min(expectedROI / 5, 1) * 0.1
    ) * 100;

    const opportunity: Opportunity = {
      id,
      title,
      description,
      category,
      status: OpportunityStatus.DISCOVERED,
      strategicValue: Math.max(0, Math.min(100, strategicValue)),
      marketSize,
      feasibility: Math.max(0, Math.min(100, feasibility)),
      competition: Math.max(0, Math.min(100, competition)),
      risk: Math.max(0, Math.min(100, risk)),
      expectedROI,
      confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
      createdAt: new Date(),
    };

    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  getOpportunities(status?: OpportunityStatusType): Opportunity[] {
    let opportunities = Array.from(this.opportunities.values());
    if (status) {
      opportunities = opportunities.filter(o => o.status === status);
    }
    return opportunities.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  evaluateOpportunity(id: string): Opportunity {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) throw new Error(`Opportunity ${id} not found`);

    opportunity.status = OpportunityStatus.EVALUATING;
    return opportunity;
  }

  validateOpportunity(id: string): Opportunity {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) throw new Error(`Opportunity ${id} not found`);

    if (opportunity.confidenceScore >= 60) {
      opportunity.status = OpportunityStatus.VALIDATED;
    } else {
      opportunity.status = OpportunityStatus.REJECTED;
    }

    return opportunity;
  }

  // ==========================================================================
  // VENTURE IDEATION ENGINE
  // ==========================================================================

  createVenture(
    name: string,
    description: string,
    opportunityId?: string
  ): Venture {
    const id = `venture-${randomUUID().slice(0, 8)}`;

    const venture: Venture = {
      id,
      name,
      description,
      status: VentureStatus.IDEATION,
      opportunityId,
      products: [],
      team: [],
      budget: 0,
      spent: 0,
      revenue: 0,
      customers: 0,
      growth: 0,
      confidenceScore: 75,
      milestones: [
        { milestone: "Ideation", completed: true },
        { milestone: "Research", completed: false },
        { milestone: "Validation", completed: false },
        { milestone: "Design", completed: false },
        { milestone: "Development", completed: false },
        { milestone: "Launch", completed: false },
        { milestone: "Growth", completed: false },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ventures.set(id, venture);
    this.log(`Venture created: ${name}`);
    return venture;
  }

  getVentures(status?: VentureStatusType): Venture[] {
    let ventures = Array.from(this.ventures.values());
    if (status) {
      ventures = ventures.filter(v => v.status === status);
    }
    return ventures.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  getVenture(id: string): Venture | undefined {
    return this.ventures.get(id);
  }

  updateVentureStatus(id: string, status: VentureStatusType) {
    const venture = this.ventures.get(id);
    if (venture) {
      venture.status = status;
      venture.updatedAt = new Date();

      // Update milestones
      const milestoneMap: Record<VentureStatusType, number> = {
        [VentureStatus.IDEATION]: 0,
        [VentureStatus.RESEARCH]: 1,
        [VentureStatus.VALIDATION]: 2,
        [VentureStatus.DESIGN]: 3,
        [VentureStatus.DEVELOPMENT]: 4,
        [VentureStatus.TESTING]: 4,
        [VentureStatus.LAUNCH]: 5,
        [VentureStatus.GROWTH]: 6,
        [VentureStatus.SCALE]: 6,
        [VentureStatus.MATURE]: 6,
        [VentureStatus.ARCHIVED]: 6,
      };

      const milestoneIndex = milestoneMap[status];
      venture.milestones = venture.milestones.map((m, i) => ({
        ...m,
        completed: i <= milestoneIndex,
        date: i <= milestoneIndex ? new Date() : undefined,
      }));
    }
  }

  // ==========================================================================
  // VALIDATION ENGINE
  // ==========================================================================

  validateVenture(ventureId: string): ValidationResult {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    const id = `validation-${randomUUID().slice(0, 8)}`;

    // Simulate validation
    const demandValid = Math.random() > 0.2;
    const competitionValid = Math.random() > 0.3;
    const feasibilityValid = Math.random() > 0.15;
    const complexityValid = Math.random() > 0.25;
    const costValid = Math.random() > 0.2;
    const viabilityValid = demandValid && feasibilityValid && costValid;

    const confidenceScore = (
      (demandValid ? 20 : 0) +
      (competitionValid ? 15 : 0) +
      (feasibilityValid ? 25 : 0) +
      (complexityValid ? 15 : 0) +
      (costValid ? 15 : 0) +
      (viabilityValid ? 10 : 0)
    );

    const result: ValidationResult = {
      id,
      ventureId,
      demandValid,
      competitionValid,
      feasibilityValid,
      complexityValid,
      costValid,
      viabilityValid,
      confidenceScore,
      risks: this.generateRisks(demandValid, competitionValid, feasibilityValid),
      recommendations: this.generateRecommendations(viabilityValid),
      validatedAt: new Date(),
    };

    this.validations.set(id, result);

    // Update venture status
    if (viabilityValid) {
      this.updateVentureStatus(ventureId, VentureStatus.DESIGN);
      venture.confidenceScore = confidenceScore;
    }

    return result;
  }

  private generateRisks(demand: boolean, competition: boolean, feasibility: boolean): string[] {
    const risks: string[] = [];
    if (!demand) risks.push("Market demand uncertain - requires validation");
    if (!competition) risks.push("Strong competitive landscape");
    if (!feasibility) risks.push("Technical feasibility challenges");
    if (risks.length === 0) risks.push("No significant risks identified");
    return risks;
  }

  private generateRecommendations(viability: boolean): string[] {
    if (!viability) {
      return [
        "Re-evaluate market opportunity",
        "Consider pivoting to adjacent market",
        "Reduce scope to validate core hypothesis",
      ];
    }
    return [
      "Proceed with product development",
      "Build MVP to validate assumptions",
      "Monitor key metrics closely",
    ];
  }

  // ==========================================================================
  // PRODUCT MANAGEMENT
  // ==========================================================================

  createProduct(
    ventureId: string,
    name: string,
    description: string,
    type: Product["type"]
  ): Product {
    const id = `product-${randomUUID().slice(0, 8)}`;

    const product: Product = {
      id,
      ventureId,
      name,
      description,
      type,
      status: ProductStatus.PLANNING,
      features: [],
      users: 0,
      revenue: 0,
      mrr: 0,
      retention: 0,
      acquisition: 0,
      conversion: 0,
      createdAt: new Date(),
    };

    this.products.set(id, product);

    // Link to venture
    const venture = this.ventures.get(ventureId);
    if (venture) {
      venture.products.push(id);
      venture.updatedAt = new Date();
    }

    return product;
  }

  getProducts(ventureId?: string): Product[] {
    let products = Array.from(this.products.values());
    if (ventureId) {
      products = products.filter(p => p.ventureId === ventureId);
    }
    return products;
  }

  updateProductStatus(productId: string, status: ProductStatusType) {
    const product = this.products.get(productId);
    if (product) {
      product.status = status;
    }
  }

  // ==========================================================================
  // GROWTH ENGINE
  // ==========================================================================

  updateGrowthMetrics(ventureId: string, metrics: Partial<GrowthMetrics>) {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    const currentMetrics = this.growthMetrics.get(ventureId) || {
      retention: 0,
      acquisition: 0,
      revenue: 0,
      conversion: 0,
      engagement: 0,
      nps: 0,
      churn: 0,
      ltv: 0,
      cac: 0,
    };

    const newMetrics = { ...currentMetrics, ...metrics };
    this.growthMetrics.set(ventureId, newMetrics);

    // Update venture metrics
    venture.revenue = newMetrics.revenue;
    venture.customers = Math.floor(newMetrics.acquisition * 100);
    venture.growth = newMetrics.retention;

    // Calculate MRR for products
    for (const productId of venture.products) {
      const product = this.products.get(productId);
      if (product) {
        product.mrr = Math.floor(venture.revenue / venture.products.length);
        product.retention = newMetrics.retention;
        product.acquisition = newMetrics.acquisition;
        product.conversion = newMetrics.conversion;
        product.users = Math.floor(newMetrics.acquisition * 100);
      }
    }
  }

  getGrowthMetrics(ventureId: string): GrowthMetrics | undefined {
    return this.growthMetrics.get(ventureId);
  }

  // ==========================================================================
  // PORTFOLIO MANAGEMENT
  // ==========================================================================

  getPortfolioSummary(): {
    totalVentures: number;
    activeVentures: number;
    totalRevenue: number;
    totalCustomers: number;
    averageGrowth: number;
    topPerformers: Venture[];
    pipeline: { stage: string; count: number }[];
  } {
    const ventures = this.getVentures();
    const activeVentures = ventures.filter(v => 
      v.status !== VentureStatus.ARCHIVED && v.status !== VentureStatus.MATURE
    );

    const totalRevenue = ventures.reduce((sum, v) => sum + v.revenue, 0);
    const totalCustomers = ventures.reduce((sum, v) => sum + v.customers, 0);
    const averageGrowth = ventures.length > 0 
      ? ventures.reduce((sum, v) => sum + v.growth, 0) / ventures.length 
      : 0;

    const topPerformers = [...ventures]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    const pipeline = Object.values(VentureStatus).map(status => ({
      stage: status,
      count: ventures.filter(v => v.status === status).length,
    }));

    return {
      totalVentures: ventures.length,
      activeVentures: activeVentures.length,
      totalRevenue,
      totalCustomers,
      averageGrowth,
      topPerformers,
      pipeline,
    };
  }

  // ==========================================================================
  // BUSINESS SIMULATION
  ==========================================================================

  simulateVenture(ventureId: string): {
    projectedRevenue: number;
    projectedCustomers: number;
    projectedGrowth: number;
    breakEvenMonth: number;
    confidenceLevel: number;
    scenarios: {
      pessimistic: { revenue: number; customers: number; probability: number };
      expected: { revenue: number; customers: number; probability: number };
      optimistic: { revenue: number; customers: number; probability: number };
    };
  } {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    const baseRevenue = venture.revenue || 10000;
    const baseCustomers = venture.customers || 100;

    return {
      projectedRevenue: baseRevenue * 12 * (1 + venture.growth / 100),
      projectedCustomers: baseCustomers * 12 * (1 + venture.growth / 100),
      projectedGrowth: venture.growth + Math.random() * 10,
      breakEvenMonth: Math.floor(Math.random() * 12) + 6,
      confidenceLevel: venture.confidenceScore,
      scenarios: {
        pessimistic: {
          revenue: baseRevenue * 6,
          customers: baseCustomers * 0.5,
          probability: 0.2,
        },
        expected: {
          revenue: baseRevenue * 12,
          customers: baseCustomers * 1.0,
          probability: 0.5,
        },
        optimistic: {
          revenue: baseRevenue * 24,
          customers: baseCustomers * 2.0,
          probability: 0.3,
        },
      },
    };
  }

  // ==========================================================================
  // VENTURE INTELLIGENCE
  // ==========================================================================

  getVentureIntelligence(ventureId: string): {
    health: "healthy" | "at_risk" | "critical";
    score: number;
    factors: { factor: string; score: number; trend: "up" | "down" | "stable" }[];
    recommendations: string[];
  } {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    const metrics = this.growthMetrics.get(ventureId);
    
    const factors = [
      { factor: "Revenue Growth", score: venture.revenue > 100000 ? 90 : venture.revenue > 10000 ? 70 : 50, trend: "up" as const },
      { factor: "Customer Acquisition", score: metrics?.acquisition || 60, trend: "stable" as const },
      { factor: "Retention", score: metrics?.retention || 65, trend: "up" as const },
      { factor: "Burn Rate", score: venture.spent < venture.budget * 0.5 ? 80 : 50, trend: "stable" as const },
    ];

    const score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;

    let health: "healthy" | "at_risk" | "critical" = "healthy";
    if (score < 50) health = "critical";
    else if (score < 70) health = "at_risk";

    const recommendations: string[] = [];
    if (score < 70) recommendations.push("Focus on revenue growth");
    if (metrics?.retention && metrics.retention < 70) recommendations.push("Improve customer retention");
    if (venture.growth < 5) recommendations.push("Accelerate growth initiatives");

    return { health, score, factors, recommendations };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "venture_factory",
      severity: "info",
      message,
      details: { engine: "venture_factory" },
    });
  }

  getDashboard(): {
    opportunities: { total: number; highValue: number };
    ventures: { total: number; byStatus: Record<string, number> };
    products: { total: number; launched: number };
    revenue: { total: number; projected: number };
  } {
    const opportunities = this.getOpportunities();
    const ventures = this.getVentures();
    const products = this.getProducts();

    const byStatus: Record<string, number> = {};
    for (const v of ventures) {
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    }

    const totalRevenue = ventures.reduce((sum, v) => sum + v.revenue, 0);
    const projectedRevenue = ventures.reduce((sum, v) => {
      const sim = this.simulateVenture(v.id);
      return sum + sim.projectedRevenue;
    }, 0);

    return {
      opportunities: {
        total: opportunities.length,
        highValue: opportunities.filter(o => o.confidenceScore >= 70).length,
      },
      ventures: {
        total: ventures.length,
        byStatus,
      },
      products: {
        total: products.length,
        launched: products.filter(p => p.status === ProductStatus.LAUNCHED).length,
      },
      revenue: {
        total: totalRevenue,
        projected: projectedRevenue,
      },
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const ventureFactory = new VentureFactory();
