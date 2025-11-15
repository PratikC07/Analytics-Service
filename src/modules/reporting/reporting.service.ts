import prisma from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import type { StatsQueryInput } from "./reporting.types.ts";

/**
 * Generates an analytics report based on site_id and an optional date.
 * @param query The validated query parameters.
 */
export const getAnalyticsReport = async (query: StatsQueryInput) => {
  const { site_id, date } = query;

  // --- 1. Create the dynamic 'where' clause ---
  const whereClause: any = {
    site_id,
    event_type: "page_view", // Hard-coded as per our plan
  };

  // If the user provides a date, add the time range filter.
  // If they do NOT provide a date, this block is skipped,
  // and Prisma will query all-time data.
  if (date) {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    whereClause.timestamp = {
      gte: startDate,
      lt: endDate,
    };
  }

  // --- 2. Run all 3 aggregations in a single transaction ---
  const [totalViews, uniqueUsersList, topPathsList] = await prisma.$transaction(
    [
      // Query 1: Get total page_views
      prisma.event.count({
        where: whereClause,
      }),

      // Query 2: Get distinct user_ids
      prisma.event.findMany({
        where: whereClause,
        distinct: ["user_id"],
        select: {
          user_id: true,
        },
      }),

      // Query 3: Get top 3 paths
      prisma.event.groupBy({
        by: ["path"],
        where: whereClause,
        _count: {
          path: true,
        },
        orderBy: {
          _count: {
            path: "desc",
          },
        },
        take: 3,
      }),
    ]
  );

  // --- 3. Format the final response ---
  if (totalViews === 0) {
    throw new NotFoundError(
      "No analytics data found for the specified criteria."
    );
  }

  // Format the topPaths data to match the spec
  const top_paths = topPathsList.map((item) => ({
    path: item.path ?? "Unknown Path",
    views: (item._count as { path?: number })?.path ?? 0,
  }));

  // Construct the final JSON response
  return {
    site_id,
    date: date ?? "all-time", // Return '"all-time"' for 'date' if all-time data
    total_views: totalViews,
    unique_users: uniqueUsersList.length,
    top_paths,
  };
};
