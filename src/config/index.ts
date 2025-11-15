// No dotenv.config() here. It's now in index.ts.

// Helper to get and validate an env var
const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1); // Fail fast
  }
  return value;
};

// We validate the variables from our .env.docker file
export const config = {
  PORT: getEnv("PORT"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  REDIS_URL: getEnv("REDIS_URL"),
  // We can add JWT_SECRET here later if we add auth
};
