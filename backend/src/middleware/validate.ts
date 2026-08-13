import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          const field = e.path.join(".") || "form";
          if (!errors[field]) errors[field] = e.message;
        });
        res.status(422).json({
          success: false,
          message: "Validation failed",
          errors,
        });
        return;
      }
      next(err);
    }
  };
