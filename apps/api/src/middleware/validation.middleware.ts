import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../utils/errors";

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return function validationMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as never;
      if (schemas.params) req.params = schemas.params.parse(req.params) as never;
      next();
    } catch (error) {
      next(new ValidationError("Request validation failed", error));
    }
  };
}