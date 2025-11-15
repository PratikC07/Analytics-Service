import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { statsQuerySchema } from "./reporting.types.js";
import { getStatsHandler } from "./reporting.controller.js";

const router = Router();

// Wire up the GET /stats endpoint
router.get("/stats", validate(statsQuerySchema), getStatsHandler);

export default router;
