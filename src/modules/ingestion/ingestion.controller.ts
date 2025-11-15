import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { addEventToQueue } from "./ingestion.service.js";
import type { EventInput } from "./ingestion.types.js";

/**
 * Handles the incoming ingestion request.
 * Validated data is on req.body.
 */
export const ingestEventHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // The 'validate' middleware already checked this, so we can cast it safely.
    const eventData = req.body as EventInput;

    // 1. Add the job to the queue (this is very fast)
    await addEventToQueue(eventData);

    // 2. Immediately return Success
    res.status(202).json({ status: "queued" });
  }
);
