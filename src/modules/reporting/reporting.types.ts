import { z } from "zod";

// 1. Define the schema for the query parameters
export const statsQueryInput = z.object({
  // site_id is required
  site_id: z.string().min(1, "site_id is required"),

  // date is optional, and must be in YYYY-MM-DD format if provided
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
});

// 2. Define the schema for the Express request
export const statsQuerySchema = z.object({
  query: statsQueryInput,
});

// 3. Export the TypeScript type
export type StatsQueryInput = z.infer<typeof statsQueryInput>;
