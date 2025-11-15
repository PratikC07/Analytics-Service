// src/utils/catchAsync.ts
// Based on Who's In/server/src/utils/catchAsync.ts
import type { NextFunction, Request, Response } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => next(error));
  };
};
