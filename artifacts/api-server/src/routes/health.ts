/**
 * DEVIL API Server - Health Router
 */

import { Router, type IRouter } from "express";

const router: IRouter = Router();

// GET /healthz - Health check
router.get("/healthz", async (req, res) => {
  res.json({ status: "ok" });
});

export default router;
