import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getAnalyticsReport } from "./reporting.service.js";
import type { StatsQueryInput } from "./reporting.types.ts";

/**
 * Handles the GET /stats request.
 */
export const getStatsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // We cast to our specific type for type-safety
    const query = req.query as unknown as StatsQueryInput;

    // 1. Call the service
    const report = await getAnalyticsReport(query);

    // 2. Send the successful response
    res.status(200).json({
      status: "success",
      data: report,
    });
  }
);
