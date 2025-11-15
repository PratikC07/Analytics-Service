import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { ingestEventSchema } from "./ingestion.types.js";
import { ingestEventHandler } from "./ingestion.controller.js";

const router = Router();

// Wire up the POST /event endpoint
router.post(
  "/event",
  validate(ingestEventSchema), // 👈 Zod validation middleware
  ingestEventHandler // 👈 Our async controller
);

export default router;
