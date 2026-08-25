import { Router, type IRouter } from "express";
import healthRouter from "./health";
import missionsRouter from "./missions";
import aiRouter from "../server/ai/router";
import architectRouter from "../server/architect/router";
import eventsRouter from "./events";
import approvalsRouter from "./approvals";
import validationRouter from "./validation";
import toolsRouter from "./tools";
import controlPlaneRouter from "./control-plane-router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(missionsRouter);
router.use(aiRouter);
router.use(architectRouter);

// Control Plane Routes
router.use(eventsRouter);
router.use(approvalsRouter);
router.use(validationRouter);
router.use(toolsRouter);
router.use(controlPlaneRouter);

export default router;
