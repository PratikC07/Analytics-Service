import { z } from "zod";

// 1. Define the schema for the event payload itself
export const eventSchema = z.object({
  // site_id and event_type are required
  site_id: z.string().min(1, "site_id is required"),
  event_type: z.string().min(1, "event_type is required"),

  // Other fields are optional
  path: z.string().optional(),
  user_id: z.string().optional(),
  timestamp: z.string().datetime(), // Validates ISO 8601 format
});

// 2. Define the schema for the Express request (for our validation middleware)
export const ingestEventSchema = z.object({
  body: eventSchema,
});

// 3. Export the TypeScript type for use in our service
export type EventInput = z.infer<typeof eventSchema>;
