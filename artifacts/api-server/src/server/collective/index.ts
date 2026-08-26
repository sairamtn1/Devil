/**
 * DEVIL Collective Intelligence Platform
 * 
 * Phase 21: Transform DEVIL into a unified collective intelligence.
 * 
 * Features:
 * - Collective Intelligence Core
 * - Shared Knowledge Network
 * - Cross-Agent Learning Engine
 * - Agent Communication Bus
 * - Agent Skill Graph
 * - Collective Memory Layer
 * - Collaboration Engine
 * - Reputation Engine
 * - Consensus System
 * - Discovery Engine
 */

import { randomUUID } from "crypto";
import { logEvent } from "../control-plane/eventLog";

// ============================================================================
// TYPES - AGENTS
// ============================================================================

export interface AgentNode {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "collaborating";
  skills: string[];
  specializations: string[];
  reputation: {
    reliability: number;
    quality: number;
    innovation: number;
    collaboration: number;
  };
  collaborations: string[];
  lastActive: Date;
  createdAt: Date;
}

// ============================================================================
// TYPES - KNOWLEDGE
// ============================================================================

export interface SharedKnowledge {
  id: string;
  type: "lesson" | "workflow" | "pattern" | "best_practice" | "discovery";
  content: string;
  sourceAgent: string;
  targetAgents: string[];
  relevance: number;
  validated: boolean;
  validatedBy: string[];
  usageCount: number;
  createdAt: Date;
}

export interface KnowledgeSubscription {
  agentId: string;
  knowledgeTypes: string[];
  priority: "high" | "medium" | "low";
}

// ============================================================================
// TYPES - COLLABORATION
// ============================================================================

export interface CollaborationTask {
  id: string;
  agents: string[];
  type: "task_sharing" | "parallel" | "consensus" | "planning";
  status: "requested" | "in_progress" | "completed" | "failed";
  task: string;
  results: { agentId: string; result: string }[];
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// TYPES - SKILL GRAPH
// ============================================================================

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  agents: string[];
  confidence: number;
  dependencies: string[];
  usageCount: number;
  lastUsed: Date;
}

// ============================================================================
// TYPES - REPUTATION
// ============================================================================

export interface ReputationScore {
  agentId: string;
  overall: number;
  reliability: number;
  quality: number;
  innovation: number;
  collaboration: number;
  history: { metric: string; score: number; date: Date }[];
  updatedAt: Date;
}

// ============================================================================
// TYPES - CONSENSUS
// ============================================================================

export interface ConsensusVote {
  agentId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  vote: "agree" | "disagree" | "abstain";
}

export interface ConsensusDecision {
  id: string;
  topic: string;
  description: string;
  votes: ConsensusVote[];
  outcome: "approved" | "rejected" | "deferred";
  rationale: string;
  createdAt: Date;
  decidedAt: Date;
}

// ============================================================================
// TYPES - COLLECTIVE MEMORY
// ============================================================================

export interface CollectiveMemory {
  id: string;
  type: "mission_lesson" | "workflow_success" | "failure_pattern" | "prompt_improvement" | "tool_optimization" | "discovery";
  content: string;
  contributingAgents: string[];
  validated: boolean;
  applicableAgents: string[];
  usageCount: number;
  createdAt: Date;
}

// ============================================================================
// TYPES - INTELLIGENCE EXCHANGE
// ============================================================================

export interface IntelligenceExchange {
  id: string;
  type: "knowledge" | "skill" | "workflow" | "prompt" | "capability";
  fromAgent: string;
  toAgent: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "integrated";
  createdAt: Date;
}

// ============================================================================
// COLLECTIVE INTELLIGENCE ENGINE
// ============================================================================

export class CollectiveIntelligenceEngine {
  // Agent Network
  private agents: Map<string, AgentNode> = new Map();
  
  // Shared Knowledge
  private knowledge: Map<string, SharedKnowledge> = new Map();
  private subscriptions: Map<string, KnowledgeSubscription> = new Map();
  
  // Skill Graph
  private skills: Map<string, SkillNode> = new Map();
  
  // Reputation
  private reputations: Map<string, ReputationScore> = new Map();
  
  // Consensus
  private consensusDecisions: ConsensusDecision[] = [];
  
  // Collective Memory
  private collectiveMemory: Map<string, CollectiveMemory> = new Map();
  
  // Intelligence Exchange
  private exchanges: Map<string, IntelligenceExchange> = new Map();
  
  // Active Collaborations
  private collaborations: Map<string, CollaborationTask> = new Map();
  
  // Communication Bus
  private messageBus: {
    id: string;
    from: string;
    to: string;
    type: "request" | "response" | "broadcast" | "event";
    content: string;
    timestamp: Date;
  }[] = [];

  constructor() {
    this.initializeAgents();
    this.initializeSkills();
    this.log("CollectiveIntelligenceEngine initialized");
  }

  // ==========================================================================
  // AGENT MANAGEMENT
  // ==========================================================================

  private initializeAgents() {
    const defaultAgents = [
      { name: "Control Plane", type: "control", skills: ["mission_management", "approval", "validation"] },
      { name: "Brain", type: "reasoning", skills: ["analysis", "planning", "decision_making"] },
      { name: "Executor", type: "execution", skills: ["task_execution", "automation", "recovery"] },
      { name: "Architect", type: "design", skills: ["architecture", "system_design", "risk_analysis"] },
      { name: "Coding Agent", type: "development", skills: ["coding", "testing", "debugging"] },
      { name: "Research", type: "research", skills: ["analysis", "discovery", "hypothesis"] },
      { name: "Memory", type: "storage", skills: ["retrieval", "storage", "search"] },
      { name: "Evolution", type: "improvement", skills: ["optimization", "learning", "meta_cognition"] },
      { name: "Image Studio", type: "creative", skills: ["image_generation", "design", "branding"] },
      { name: "Video Studio", type: "creative", skills: ["video_generation", "storytelling", "editing"] },
      { name: "Deployment", type: "operations", skills: ["deployment", "infrastructure", "monitoring"] },
      { name: "GitHub", type: "vcs", skills: ["version_control", "code_review", "collaboration"] },
      { name: "Marketplace", type: "ecosystem", skills: ["asset_management", "governance", "discovery"] },
    ];

    for (const agent of defaultAgents) {
      this.registerAgent(agent.name, agent.type, agent.skills);
    }
  }

  registerAgent(name: string, type: string, skills: string[]): AgentNode {
    const id = `agent-${randomUUID().slice(0, 8)}`;
    
    const agent: AgentNode = {
      id,
      name,
      type,
      status: "active",
      skills,
      specializations: skills.slice(0, 3),
      reputation: {
        reliability: 80 + Math.random() * 15,
        quality: 80 + Math.random() * 15,
        innovation: 75 + Math.random() * 20,
        collaboration: 85 + Math.random() * 10,
      },
      collaborations: [],
      lastActive: new Date(),
      createdAt: new Date(),
    };

    this.agents.set(id, agent);
    
    // Initialize reputation
    this.reputations.set(id, {
      agentId: id,
      overall: 80,
      reliability: agent.reputation.reliability,
      quality: agent.reputation.quality,
      innovation: agent.reputation.innovation,
      collaboration: agent.reputation.collaboration,
      history: [],
      updatedAt: new Date(),
    });

    // Register skills
    for (const skill of skills) {
      this.registerSkill(skill, id);
    }

    return agent;
  }

  getAgents(): AgentNode[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): AgentNode | undefined {
    return this.agents.get(id);
  }

  updateAgentStatus(id: string, status: AgentNode["status"]) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.lastActive = new Date();
    }
  }

  // ==========================================================================
  // SKILL GRAPH
  // ==========================================================================

  private initializeSkills() {
    const defaultSkills = [
      { name: "mission_management", category: "control", agents: ["control_plane"] },
      { name: "reasoning", category: "cognitive", agents: ["brain"] },
      { name: "task_execution", category: "execution", agents: ["executor"] },
      { name: "architecture", category: "design", agents: ["architect"] },
      { name: "coding", category: "development", agents: ["coding_agent"] },
      { name: "research", category: "knowledge", agents: ["research"] },
      { name: "memory", category: "storage", agents: ["memory"] },
      { name: "optimization", category: "improvement", agents: ["evolution"] },
      { name: "image_generation", category: "creative", agents: ["image_studio"] },
      { name: "video_generation", category: "creative", agents: ["video_studio"] },
      { name: "deployment", category: "operations", agents: ["deployment"] },
    ];

    for (const skill of defaultSkills) {
      this.skills.set(skill.name, {
        id: `skill-${skill.name}`,
        name: skill.name,
        category: skill.category,
        agents: skill.agents,
        confidence: 80,
        dependencies: [],
        usageCount: 0,
        lastUsed: new Date(),
      });
    }
  }

  registerSkill(skillName: string, agentId: string) {
    let skill = this.skills.get(skillName);
    
    if (!skill) {
      skill = {
        id: `skill-${randomUUID().slice(0, 8)}`,
        name: skillName,
        category: "general",
        agents: [],
        confidence: 50,
        dependencies: [],
        usageCount: 0,
        lastUsed: new Date(),
      };
      this.skills.set(skillName, skill);
    }

    if (!skill.agents.includes(agentId)) {
      skill.agents.push(agentId);
    }
  }

  getSkills(): SkillNode[] {
    return Array.from(this.skills.values());
  }

  getSkillGraph(): { nodes: SkillNode[]; relationships: { from: string; to: string; type: string }[] } {
    const nodes = this.getSkills();
    const relationships: { from: string; to: string; type: string }[] = [];
    
    for (const skill of nodes) {
      for (const dep of skill.dependencies) {
        relationships.push({ from: skill.id, to: dep, type: "depends_on" });
      }
    }

    return { nodes, relationships };
  }

  // ==========================================================================
  // SHARED KNOWLEDGE NETWORK
  // ==========================================================================

  publishKnowledge(
    type: SharedKnowledge["type"],
    content: string,
    sourceAgent: string,
    targetAgents: string[]
  ): SharedKnowledge {
    const id = `knowledge-${randomUUID().slice(0, 8)}`;

    const knowledge: SharedKnowledge = {
      id,
      type,
      content,
      sourceAgent,
      targetAgents,
      relevance: 0.8,
      validated: false,
      validatedBy: [],
      usageCount: 0,
      createdAt: new Date(),
    };

    this.knowledge.set(id, knowledge);
    
    // Broadcast to subscribers
    this.broadcastKnowledge(knowledge);

    return knowledge;
  }

  private broadcastKnowledge(knowledge: SharedKnowledge) {
    // Simulate knowledge propagation
    for (const [subId, subscription] of this.subscriptions) {
      if (knowledge.targetAgents.includes(subId) || knowledge.targetAgents.length === 0) {
        if (subscription.knowledgeTypes.includes(knowledge.type)) {
          // Knowledge delivered to subscriber
          logEvent({
            eventType: "collective_knowledge",
            severity: "info",
            message: `Knowledge ${knowledge.id} broadcast to ${subId}`,
            details: { knowledgeId: knowledge.id, subscriber: subId },
          });
        }
      }
    }
  }

  subscribeToKnowledge(agentId: string, types: string[], priority: KnowledgeSubscription["priority"]) {
    this.subscriptions.set(agentId, {
      agentId,
      knowledgeTypes: types,
      priority,
    });
  }

  getKnowledge(): SharedKnowledge[] {
    return Array.from(this.knowledge.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  validateKnowledge(knowledgeId: string, agentId: string) {
    const knowledge = this.knowledge.get(knowledgeId);
    if (knowledge && !knowledge.validatedBy.includes(agentId)) {
      knowledge.validatedBy.push(agentId);
      if (knowledge.validatedBy.length >= 2) {
        knowledge.validated = true;
      }
    }
  }

  // ==========================================================================
  // CROSS-AGENT LEARNING
  // ==========================================================================

  propagateLearning(fromAgent: string, learning: { type: string; content: string; relevance: number }) {
    const fromAgentNode = this.agents.get(fromAgent);
    if (!fromAgentNode) return;

    // Find relevant agents based on skills
    const relevantAgents = Array.from(this.agents.values())
      .filter(agent => {
        if (agent.id === fromAgent) return false;
        return agent.skills.some(s => 
          learning.content.toLowerCase().includes(s.toLowerCase())
        );
      });

    // Publish knowledge to relevant agents
    const knowledge = this.publishKnowledge(
      learning.type as SharedKnowledge["type"],
      learning.content,
      fromAgent,
      relevantAgents.map(a => a.id)
    );

    // Update agent collaborations
    for (const agent of relevantAgents) {
      if (!fromAgentNode.collaborations.includes(agent.id)) {
        fromAgentNode.collaborations.push(agent.id);
      }
      if (!agent.collaborations.includes(fromAgent)) {
        agent.collaborations.push(fromAgent);
      }
    }

    // Store in collective memory
    this.storeInCollectiveMemory(
      "discovery",
      learning.content,
      [fromAgent, ...relevantAgents.map(a => a.id)]
    );

    return knowledge;
  }

  // ==========================================================================
  // AGENT COMMUNICATION BUS
  // ==========================================================================

  sendMessage(from: string, to: string, type: "request" | "response" | "broadcast" | "event", content: string) {
    const message = {
      id: `msg-${randomUUID().slice(0, 8)}`,
      from,
      to,
      type,
      content,
      timestamp: new Date(),
    };

    this.messageBus.push(message);

    // Update agent activity
    this.updateAgentStatus(from, "active");
    if (to !== "*") {
      this.updateAgentStatus(to, "active");
    }

    return message;
  }

  getMessages(agentId: string): typeof this.messageBus {
    return this.messageBus.filter(m => 
      m.to === agentId || m.to === "*" || m.from === agentId
    );
  }

  // ==========================================================================
  // COLLABORATION ENGINE
  // ==========================================================================

  initiateCollaboration(agents: string[], type: CollaborationTask["type"], task: string): CollaborationTask {
    const id = `collab-${randomUUID().slice(0, 8)}`;

    const collaboration: CollaborationTask = {
      id,
      agents,
      type,
      status: "requested",
      task,
      results: [],
      createdAt: new Date(),
    };

    this.collaborations.set(id, collaboration);

    // Update agent statuses
    for (const agentId of agents) {
      this.updateAgentStatus(agentId, "collaborating");
    }

    return collaboration;
  }

  updateCollaboration(id: string, status: CollaborationTask["status"], results?: { agentId: string; result: string }[]) {
    const collaboration = this.collaborations.get(id);
    if (collaboration) {
      collaboration.status = status;
      if (results) {
        collaboration.results = results;
      }
      if (status === "completed" || status === "failed") {
        collaboration.completedAt = new Date();
        
        // Reset agent statuses
        for (const agentId of collaboration.agents) {
          this.updateAgentStatus(agentId, "active");
        }
      }
    }
    return collaboration;
  }

  getCollaborations(): CollaborationTask[] {
    return Array.from(this.collaborations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==========================================================================
  // REPUTATION ENGINE
  // ==========================================================================

  updateReputation(agentId: string, metric: "reliability" | "quality" | "innovation" | "collaboration", score: number) {
    let reputation = this.reputations.get(agentId);
    
    if (!reputation) {
      reputation = {
        agentId,
        overall: 0,
        reliability: 0,
        quality: 0,
        innovation: 0,
        collaboration: 0,
        history: [],
        updatedAt: new Date(),
      };
      this.reputations.set(agentId, reputation);
    }

    reputation[metric] = Math.max(0, Math.min(100, score));
    reputation.history.push({ metric, score, date: new Date() });
    
    // Recalculate overall
    reputation.overall = (
      reputation.reliability * 0.3 +
      reputation.quality * 0.3 +
      reputation.innovation * 0.2 +
      reputation.collaboration * 0.2
    );
    
    reputation.updatedAt = new Date();
    
    // Update agent node
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.reputation[metric] = score;
    }

    return reputation;
  }

  getReputations(): ReputationScore[] {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.overall - a.overall);
  }

  getReputation(agentId: string): ReputationScore | undefined {
    return this.reputations.get(agentId);
  }

  // ==========================================================================
  // CONSENSUS SYSTEM
  // ==========================================================================

  initiateConsensus(topic: string, description: string): ConsensusDecision {
    const id = `consensus-${randomUUID().slice(0, 8)}`;

    const decision: ConsensusDecision = {
      id,
      topic,
      description,
      votes: [],
      outcome: "deferred",
      rationale: "",
      createdAt: new Date(),
      decidedAt: new Date(),
    };

    this.consensusDecisions.push(decision);
    return decision;
  }

  castVote(decisionId: string, agentId: string, vote: ConsensusVote["vote"], reasoning: string, confidence: number) {
    const decision = this.consensusDecisions.find(d => d.id === decisionId);
    if (decision) {
      const existingVote = decision.votes.find(v => v.agentId === agentId);
      
      if (existingVote) {
        existingVote.vote = vote;
        existingVote.reasoning = reasoning;
        existingVote.confidence = confidence;
      } else {
        decision.votes.push({
          agentId,
          decision: decision.topic,
          reasoning,
          confidence,
          vote,
        });
      }

      // Check if consensus reached
      this.evaluateConsensus(decision);
    }
  }

  private evaluateConsensus(decision: ConsensusDecision) {
    if (decision.votes.length < 2) return;

    const agree = decision.votes.filter(v => v.vote === "agree").length;
    const disagree = decision.votes.filter(v => v.vote === "disagree").length;
    const total = decision.votes.length;

    if (agree / total >= 0.6) {
      decision.outcome = "approved";
      decision.rationale = `Consensus reached: ${agree}/${total} agents agreed`;
    } else if (disagree / total >= 0.6) {
      decision.outcome = "rejected";
      decision.rationale = `Consensus rejected: ${disagree}/${total} agents disagreed`;
    }

    decision.decidedAt = new Date();
  }

  getConsensusDecisions(): ConsensusDecision[] {
    return this.consensusDecisions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==========================================================================
  // COLLECTIVE MEMORY
  // ==========================================================================

  storeInCollectiveMemory(type: CollectiveMemory["type"], content: string, contributingAgents: string[]) {
    const id = `memory-${randomUUID().slice(0, 8)}`;

    const memory: CollectiveMemory = {
      id,
      type,
      content,
      contributingAgents,
      validated: false,
      applicableAgents: [],
      usageCount: 0,
      createdAt: new Date(),
    };

    // Determine applicable agents
    for (const [agentId, agent] of this.agents) {
      const isApplicable = contributingAgents.includes(agentId) || 
        agent.skills.some(s => content.toLowerCase().includes(s.toLowerCase()));
      
      if (isApplicable) {
        memory.applicableAgents.push(agentId);
      }
    }

    this.collectiveMemory.set(id, memory);
    return memory;
  }

  getCollectiveMemory(): CollectiveMemory[] {
    return Array.from(this.collectiveMemory.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  useMemory(id: string) {
    const memory = this.collectiveMemory.get(id);
    if (memory) {
      memory.usageCount++;
      memory.validated = true;
    }
  }

  // ==========================================================================
  // INTELLIGENCE EXCHANGE
  // ==========================================================================

  initiateExchange(
    type: IntelligenceExchange["type"],
    fromAgent: string,
    toAgent: string,
    content: string
  ): IntelligenceExchange {
    const id = `exchange-${randomUUID().slice(0, 8)}`;

    const exchange: IntelligenceExchange = {
      id,
      type,
      fromAgent,
      toAgent,
      content,
      status: "pending",
      createdAt: new Date(),
    };

    this.exchanges.set(id, exchange);
    return exchange;
  }

  updateExchangeStatus(id: string, status: IntelligenceExchange["status"]) {
    const exchange = this.exchanges.get(id);
    if (exchange) {
      exchange.status = status;
      
      // If integrated, propagate to skill graph
      if (status === "integrated") {
        const skillMatch = exchange.content.match(/skill:\s*(\w+)/i);
        if (skillMatch) {
          this.registerSkill(skillMatch[1], exchange.toAgent);
        }
      }
    }
    return exchange;
  }

  getExchanges(): IntelligenceExchange[] {
    return Array.from(this.exchanges.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==========================================================================
  // DISCOVERY ENGINE
  // ==========================================================================

  discoverOpportunities(): {
    newSkills: string[];
    newSynergies: { agents: string[]; reason: string }[];
    knowledgeGaps: string[];
  } {
    const newSkills: string[] = [];
    const newSynergies: { agents: string[]; reason: string }[] = [];
    const knowledgeGaps: string[] = [];

    // Find agents that could collaborate
    const agents = Array.from(this.agents.values());
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a1 = agents[i];
        const a2 = agents[j];
        
        const sharedSkills = a1.skills.filter(s => a2.skills.includes(s));
        const complementarySkills = a1.skills.filter(s => !a2.skills.includes(s));
        
        if (complementarySkills.length > 0 && sharedSkills.length > 0) {
          newSynergies.push({
            agents: [a1.id, a2.id],
            reason: `${a1.name} and ${a2.name} share ${sharedSkills.join(", ")} but ${a2.name} has ${complementarySkills[0]}`,
          });
        }
      }
    }

    // Identify knowledge gaps
    const memoryTypes = new Set(Array.from(this.collectiveMemory.values()).map(m => m.type));
    const requiredTypes = ["mission_lesson", "workflow_success", "failure_pattern", "discovery"];
    
    for (const type of requiredTypes) {
      if (!memoryTypes.has(type as any)) {
        knowledgeGaps.push(`No ${type} in collective memory`);
      }
    }

    return { newSkills, newSynergies, knowledgeGaps };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private log(message: string) {
    logEvent({
      eventType: "collective_intelligence",
      severity: "info",
      message,
      details: { engine: "collective_intelligence" },
    });
  }

  getNetworkStats(): {
    totalAgents: number;
    activeAgents: number;
    totalKnowledge: number;
    totalSkills: number;
    totalCollaborations: number;
    averageReputation: number;
    collectiveIntelligenceScore: number;
  } {
    const agents = this.getAgents();
    const activeAgents = agents.filter(a => a.status === "active").length;
    const reputations = this.getReputations();
    const avgReputation = reputations.length > 0
      ? reputations.reduce((sum, r) => sum + r.overall, 0) / reputations.length
      : 0;

    return {
      totalAgents: agents.length,
      activeAgents,
      totalKnowledge: this.knowledge.size,
      totalSkills: this.skills.size,
      totalCollaborations: this.collaborations.size,
      averageReputation: avgReputation,
      collectiveIntelligenceScore: avgReputation * (activeAgents / Math.max(agents.length, 1)),
    };
  }

  getDashboard(): {
    network: ReturnType<typeof this.getNetworkStats>;
    agents: AgentNode[];
    recentKnowledge: SharedKnowledge[];
    activeCollaborations: CollaborationTask[];
    topReputations: ReputationScore[];
    consensusHistory: ConsensusDecision[];
    discoveries: ReturnType<typeof this.discoverOpportunities>;
  } {
    return {
      network: this.getNetworkStats(),
      agents: this.getAgents(),
      recentKnowledge: this.getKnowledge().slice(0, 10),
      activeCollaborations: this.getCollaborations().filter(c => c.status === "in_progress"),
      topReputations: this.getReputations().slice(0, 5),
      consensusHistory: this.getConsensusDecisions().slice(0, 5),
      discoveries: this.discoverOpportunities(),
    };
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const collectiveIntelligence = new CollectiveIntelligenceEngine();
