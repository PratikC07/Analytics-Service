// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import apiRouter from "./api.js"; // 👈 IMPORT THE ROUTER
import { errorHandler } from "./middlewares/errorHandler.js"; // 👈 IMPORT THE HANDLER
import { config } from "./config/index.js";
import { connectRedis } from "./lib/redis.js";

const startServer = async () => {
  await connectRedis();

  const app = express();
  const PORT = config.PORT;

  app.use(express.json());
  app.use(cors());

  // Main health check
  app.get("/api/healthcheck", (req, res) => {
    res.json({ message: "API is running, healthy, and ready!" });
  });

  // 👈 MOUNT THE MAIN API ROUTER
  app.use("/api", apiRouter);

  // 👈 MOUNT THE ERROR HANDLER AS THE LAST MIDDLEWARE
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
