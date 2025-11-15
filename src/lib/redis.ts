// src/lib/redis.ts
import { createClient } from "redis";
import { config } from "../config/index.js";

// Get the URL from our .env.docker file
const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Redis Client Error", error);
    process.exit(1); // Exit if we can't connect
  }
};

// Export both the client and the connect function
export { connectRedis, redisClient };
