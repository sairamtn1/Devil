/**
 * DEVIL API Server - AI Router (Placeholder)
 */

import { Router, type IRouter } from "express";

const router: IRouter = Router();

// This will be implemented in future phases
// Currently, chat functionality is handled through the architect router

router.post("/chat", async (req, res) => {
  res.status(501).json({ 
    error: "Chat functionality coming in Phase 2" 
  });
});

export default router;
