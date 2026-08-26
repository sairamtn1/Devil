import { Router, type IRouter } from "express";
import healthRouter from "./health";
import missionsRouter from "./missions";
import aiRouter from "../server/ai/router";
import architectRouter from "./architect";
import eventsRouter from "./events";
import approvalsRouter from "./approvals";
import validationRouter from "./validation";
import toolsRouter from "./tools";
import controlPlaneRouter from "./control-plane-router";
import executorRouter from "./executor";
import codingRouter from "./coding";
import githubRouter from "./github";
import deploymentRouter from "./deployment";
import memoryRouter from "./memory";
import orchestratorRouter from "./orchestrator";
import imageRouter from "./image";
import videoRouter from "./video";
import brainRouter from "./brain";
import autonomousRouter from "./autonomous";
import workforceRouter from "./workforce";
import researchRouter from "./research";
import worldmodelRouter from "./worldmodel";
import evolutionRouter from "./evolution";
import evolutionPlusRouter from "./evolution/evolution-plus";
import multimodalRouter from "./multimodal";
import ventureRouter from "./venture";
import ecosystemRouter from "./ecosystem";
import collectiveRouter from "./collective";
import selfModifyRouter from "./self-modify";
import simulationRouter from "./simulation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(missionsRouter);
router.use(aiRouter);

// DEVIL Brain Routes
router.use(brainRouter);

// Autonomous Operations Routes
router.use(autonomousRouter);

// Digital Workforce Routes
router.use(workforceRouter);

// Research & Innovation Routes
router.use(researchRouter);

// World Model & Strategic Intelligence Routes
router.use(worldmodelRouter);

// Self-Evolution Routes
router.use(evolutionRouter);

// Autonomous Evolution Routes
router.use(evolutionPlusRouter);

// Multimodal Cognitive Routes
router.use(multimodalRouter);

// Venture Factory Routes
router.use(ventureRouter);

// Ecosystem Platform Routes
router.use(ecosystemRouter);

// Collective Intelligence Routes
router.use(collectiveRouter);

// Self Modification Routes
router.use(selfModifyRouter);

// World Simulation Routes (Phase 23)
router.use(simulationRouter);

// Architect 2.0 Routes
router.use(architectRouter);

// Orchestrator Routes
router.use(orchestratorRouter);

// Image Studio Routes
router.use(imageRouter);

// Video Studio Routes
router.use(videoRouter);

// Control Plane Routes
router.use(eventsRouter);
router.use(approvalsRouter);
router.use(validationRouter);
router.use(toolsRouter);
router.use(controlPlaneRouter);

// Executor Routes
router.use(executorRouter);

// Coding Agent Routes
router.use(codingRouter);

// GitHub Agent Routes
router.use(githubRouter);

// Deployment Agent Routes
router.use(deploymentRouter);

// Memory System Routes
router.use(memoryRouter);

export default router;
