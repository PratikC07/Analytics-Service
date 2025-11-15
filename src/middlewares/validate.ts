// src/middlewares/validate.ts
// Based on Who's In/server/src/middlewares/validate.ts
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      await schema.parseAsync(dataToValidate);
      next();
    } catch (error) {
      next(error); // Pass ZodError to the global error handler
    }
  };
};
