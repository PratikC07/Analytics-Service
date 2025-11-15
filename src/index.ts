import express from "express";
import "dotenv/config"; // Loads .env file
import cors from "cors";

const startServer = async () => {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors()); // Enable CORS for all routes

  // Main health check
  app.get("/api/healthcheck", (req, res) => {
    res.json({ message: "API is running, healthy, and ready!" });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} 🚀 🚀 🚀`);
  });
};

startServer();
