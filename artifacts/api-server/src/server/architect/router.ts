import { Router, type IRouter } from "express";
import { createArchitectPlan } from "../planner/architect/architectPlanner";
import { ensureUser } from "../memory/store";
import { CreateArchitectPlanBody } from "./schemas";

const router: IRouter = Router();

router.post("/architect", async (req, res) => {
  try {
    const input = CreateArchitectPlanBody.parse(req.body);
    const userId = req.header("x-devil-user-id") ?? "anonymous";
    const user = await ensureUser(userId);
    const { plan } = await createArchitectPlan({ userId: user.id, goal: input.goal });
    res.status(201).json(plan);
  } catch (error) {
    req.log.error({ err: error }, "DEVIL Architect request failed");
    const message = error instanceof Error ? error.message : "Architect request failed";
    const providerFailure = message.startsWith("Qwen request failed") || message.includes("QWEN_API_KEY");
    res.status(providerFailure ? 502 : 500).json({
      error: providerFailure
        ? "Qwen is unavailable. Verify QWEN_API_KEY, QWEN_BASE_URL, and QWEN_MODEL in the project environment."
        : "DEVIL Architect could not complete the request.",
    });
  }
});

export default router;
