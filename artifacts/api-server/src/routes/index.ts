import { Router, type IRouter } from "express";
import healthRouter from "./health";
import missionsRouter from "./missions";
import aiRouter from "../server/ai/router";
import architectRouter from "../server/architect/router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(missionsRouter);
router.use(aiRouter);
router.use(architectRouter);

export default router;
