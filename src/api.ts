// src/api.ts
import { Router } from "express";
import ingestionRouter from "./modules/ingestion/ingestion.route.js";
import reportingRouter from "./modules/reporting/reporting.route.js";

const router = Router();

// All routes in ingestionRouter will be prefixed with /ingestion
router.use("/ingestion", ingestionRouter);

// All routes in reportingRouter will be prefixed with /reporting
router.use("/reporting", reportingRouter);

export default router;
