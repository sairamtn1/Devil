/**
 * DEVIL Coding Agent - Routes Index
 */

import { Router } from "express";
import workspaceRouter from "./workspace";
import filesRouter from "./files";
import codegenRouter from "./codegen";
import buildRouter from "./build";
import reviewRouter from "./review";

const router = Router();

// Mount sub-routers
router.use("/workspace", workspaceRouter);
router.use("/files", filesRouter);
router.use("/codegen", codegenRouter);
router.use("/build", buildRouter);
router.use("/review", reviewRouter);

export default router;
