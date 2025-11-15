// src/api.ts
import { Router } from "express";
import ingestionRouter from "./modules/ingestion/ingestion.route.js";

const router = Router();

// We will add our module routers here
// All routes in ingestionRouter will be prefixed with /ingestion
router.use("/ingestion", ingestionRouter);

export default router;
