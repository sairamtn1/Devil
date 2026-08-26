/**
 * VOLGA OS Public Beta - API Routes
 */

import { Router, Request, Response } from "express";
import { publicBetaSystem } from "../../server/public-beta";

const router = Router();

// ============================================================================
// AUTHENTICATION
// ============================================================================

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, name, password, betaCode } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }
    
    // Check beta code if provided
    if (betaCode) {
      if (!publicBetaSystem.validateBetaCode(betaCode)) {
        return res.status(403).json({ error: "Invalid or expired beta code" });
      }
      publicBetaSystem.useBetaCode(betaCode);
    }
    
    const user = publicBetaSystem.createUser({ email, name, emailVerified: false });
    return res.status(201).json({ user, message: "Registration successful" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const session = publicBetaSystem.authenticate(email, password);
    if (!session) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    return res.json({ session, token: session.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/auth/provider/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { providerId } = req.body;
    
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }
    
    const session = publicBetaSystem.authenticateWithProvider(provider as "google" | "github", providerId);
    if (!session) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    return res.json({ session, token: session.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const user = publicBetaSystem.validateSession(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    
    return res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ONBOARDING
// ============================================================================

router.post("/onboarding/step", async (req: Request, res: Response) => {
  try {
    const { userId, step } = req.body;
    
    if (!userId || !step) {
      return res.status(400).json({ error: "userId and step are required" });
    }
    
    const success = publicBetaSystem.completeOnboardingStep(userId, step);
    return res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// BETA PROGRAM
// ============================================================================

router.post("/beta/waitlist", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const result = publicBetaSystem.joinWaitlist(email);
    return res.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/beta/feedback", async (req: Request, res: Response) => {
  try {
    const { userId, type, title, description, priority } = req.body;
    
    if (!userId || !type || !title || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const feedback = publicBetaSystem.submitFeedback({ userId, type, title, description, priority });
    return res.status(201).json(feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/beta/feedback", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const feedback = publicBetaSystem.getFeedback(userId as string);
    return res.json({ feedback, total: feedback.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/beta/validate-code", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }
    
    const valid = publicBetaSystem.validateBetaCode(code);
    return res.json({ valid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const analytics = publicBetaSystem.getAnalytics();
    return res.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.post("/analytics/track", async (req: Request, res: Response) => {
  try {
    const { event, metadata } = req.body;
    
    if (!event) {
      return res.status(400).json({ error: "Event is required" });
    }
    
    publicBetaSystem.trackEvent(event, metadata);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ERROR MONITORING
// ============================================================================

router.post("/errors", async (req: Request, res: Response) => {
  try {
    const { type, severity, message, stack, userId, metadata } = req.body;
    
    if (!type || !severity || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const error = publicBetaSystem.logError({ type, severity, message, stack, userId, metadata });
    return res.status(201).json(error);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

router.get("/errors", async (req: Request, res: Response) => {
  try {
    const { type, severity, limit } = req.query;
    const errors = publicBetaSystem.getErrors({
      type: type as any,
      severity: severity as any,
      limit: limit ? parseInt(limit as string) : 50,
    });
    return res.json({ errors, total: errors.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// ============================================================================
// ADMIN
// ============================================================================

router.get("/admin/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = publicBetaSystem.getAdminDashboard();
    return res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

export default router;
