/**
 * DEVIL Collective Intelligence - API Routes
 */

import { Router, Request, Response } from "express";
import { 
  collectiveIntelligence,
} from "../../server/collective";

const router = Router();

// ============================================================================
// AGENTS
// ============================================================================

// Get all agents
router.get("/agents", async (req: Request, res: Response) => {
  try {
    const agents = collectiveIntelligence.getAgents();
    return res.json({ agents, total: agents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get agent
router.get("/agent/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = collectiveIntelligence.getAgent(id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    return res.json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Register agent
router.post("/agent", async (req: Request, res: Response) => {
  try {
    const { name, type, skills } = req.body;

    if (!name || !type || !skills) {
      return res.status(400).json({ error: "name, type, and skills are required" });
    }

    const agent = collectiveIntelligence.registerAgent(name, type, skills);
    return res.status(201).json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update agent status
router.patch("/agent/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    collectiveIntelligence.updateAgentStatus(id, status);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// SKILLS
// ============================================================================

// Get skill graph
router.get("/skills", async (req: Request, res: Response) => {
  try {
    const skills = collectiveIntelligence.getSkills();
    return res.json({ skills, total: skills.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get skill graph visualization
router.get("/skills/graph", async (req: Request, res: Response) => {
  try {
    const graph = collectiveIntelligence.getSkillGraph();
    return res.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// KNOWLEDGE
// ============================================================================

// Publish knowledge
router.post("/knowledge", async (req: Request, res: Response) => {
  try {
    const { type, content, sourceAgent, targetAgents } = req.body;

    if (!type || !content || !sourceAgent) {
      return res.status(400).json({ error: "type, content, and sourceAgent are required" });
    }

    const knowledge = collectiveIntelligence.publishKnowledge(type, content, sourceAgent, targetAgents || []);
    return res.status(201).json(knowledge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get knowledge
router.get("/knowledge", async (req: Request, res: Response) => {
  try {
    const knowledge = collectiveIntelligence.getKnowledge();
    return res.json({ knowledge, total: knowledge.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Subscribe to knowledge
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const { agentId, types, priority } = req.body;

    if (!agentId || !types) {
      return res.status(400).json({ error: "agentId and types are required" });
    }

    collectiveIntelligence.subscribeToKnowledge(agentId, types, priority || "medium");
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Validate knowledge
router.post("/knowledge/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "agentId is required" });
    }

    collectiveIntelligence.validateKnowledge(id, agentId);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// LEARNING
// ============================================================================

// Propagate learning (cross-agent learning)
router.post("/learn", async (req: Request, res: Response) => {
  try {
    const { fromAgent, type, content, relevance } = req.body;

    if (!fromAgent || !content) {
      return res.status(400).json({ error: "fromAgent and content are required" });
    }

    const knowledge = collectiveIntelligence.propagateLearning(fromAgent, {
      type: type || "discovery",
      content,
      relevance: relevance || 0.8,
    });
    return res.status(201).json(knowledge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COMMUNICATION
// ============================================================================

// Send message
router.post("/message", async (req: Request, res: Response) => {
  try {
    const { from, to, type, content } = req.body;

    if (!from || !content) {
      return res.status(400).json({ error: "from and content are required" });
    }

    const message = collectiveIntelligence.sendMessage(from, to || "*", type || "broadcast", content);
    return res.status(201).json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get messages
router.get("/messages/:agentId", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const messages = collectiveIntelligence.getMessages(agentId);
    return res.json({ messages, total: messages.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COLLABORATION
// ============================================================================

// Initiate collaboration
router.post("/collaborate", async (req: Request, res: Response) => {
  try {
    const { agents, type, task } = req.body;

    if (!agents || !task) {
      return res.status(400).json({ error: "agents and task are required" });
    }

    const collaboration = collectiveIntelligence.initiateCollaboration(agents, type || "task_sharing", task);
    return res.status(201).json(collaboration);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get collaborations
router.get("/collaborations", async (req: Request, res: Response) => {
  try {
    const collaborations = collectiveIntelligence.getCollaborations();
    return res.json({ collaborations, total: collaborations.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update collaboration
router.patch("/collaboration/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, results } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const collaboration = collectiveIntelligence.updateCollaboration(id, status, results);
    return res.json({ success: true, collaboration });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// CONSENSUS
// ============================================================================

// Initiate consensus
router.post("/consensus", async (req: Request, res: Response) => {
  try {
    const { topic, description } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const decision = collectiveIntelligence.initiateConsensus(topic, description || "");
    return res.status(201).json(decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Cast vote
router.post("/consensus/:id/vote", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId, vote, reasoning, confidence } = req.body;

    if (!agentId || !vote) {
      return res.status(400).json({ error: "agentId and vote are required" });
    }

    collectiveIntelligence.castVote(id, agentId, vote, reasoning || "", confidence || 0.5);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get consensus decisions
router.get("/consensus", async (req: Request, res: Response) => {
  try {
    const decisions = collectiveIntelligence.getConsensusDecisions();
    return res.json({ decisions, total: decisions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// REPUTATION
// ============================================================================

// Get reputations
router.get("/reputation", async (req: Request, res: Response) => {
  try {
    const reputations = collectiveIntelligence.getReputations();
    return res.json({ reputations, total: reputations.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get agent reputation
router.get("/reputation/:agentId", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const reputation = collectiveIntelligence.getReputation(agentId);

    if (!reputation) {
      return res.status(404).json({ error: "Reputation not found" });
    }

    return res.json(reputation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update reputation
router.patch("/reputation/:agentId", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { metric, score } = req.body;

    if (!metric || score === undefined) {
      return res.status(400).json({ error: "metric and score are required" });
    }

    const reputation = collectiveIntelligence.updateReputation(agentId, metric, score);
    return res.json({ success: true, reputation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// COLLECTIVE MEMORY
// ============================================================================

// Get collective memory
router.get("/memory", async (req: Request, res: Response) => {
  try {
    const memory = collectiveIntelligence.getCollectiveMemory();
    return res.json({ memory, total: memory.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Store in collective memory
router.post("/memory", async (req: Request, res: Response) => {
  try {
    const { type, content, contributingAgents } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: "type and content are required" });
    }

    const memory = collectiveIntelligence.storeInCollectiveMemory(
      type, content, contributingAgents || []
    );
    return res.status(201).json(memory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Use memory
router.post("/memory/:id/use", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    collectiveIntelligence.useMemory(id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// EXCHANGES
// ============================================================================

// Initiate exchange
router.post("/exchange", async (req: Request, res: Response) => {
  try {
    const { type, fromAgent, toAgent, content } = req.body;

    if (!type || !fromAgent || !toAgent || !content) {
      return res.status(400).json({ error: "type, fromAgent, toAgent, and content are required" });
    }

    const exchange = collectiveIntelligence.initiateExchange(type, fromAgent, toAgent, content);
    return res.status(201).json(exchange);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Update exchange status
router.patch("/exchange/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const exchange = collectiveIntelligence.updateExchangeStatus(id, status);
    return res.json({ success: true, exchange });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get exchanges
router.get("/exchanges", async (req: Request, res: Response) => {
  try {
    const exchanges = collectiveIntelligence.getExchanges();
    return res.json({ exchanges, total: exchanges.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// DISCOVERY
// ============================================================================

// Discover opportunities
router.get("/discover", async (req: Request, res: Response) => {
  try {
    const opportunities = collectiveIntelligence.discoverOpportunities();
    return res.json(opportunities);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// NETWORK & DASHBOARD
// ============================================================================

// Get network stats
router.get("/network", async (req: Request, res: Response) => {
  try {
    const stats = collectiveIntelligence.getNetworkStats();
    return res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// Get dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = collectiveIntelligence.getDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
