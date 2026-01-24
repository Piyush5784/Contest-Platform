import type { NextFunction, Request, Response } from "express";
import type { ApiErrorResponse } from "@/lib/types";
import { Role } from "@/generated/prisma/enums";

export const creatorRoleMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = req.user_role!;

    if (!(role == Role.CREATOR)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      } satisfies ApiErrorResponse);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
};

export const contesteeRoleMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = req.user_role!;

    if (!(role == Role.CONTESTEE)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      } satisfies ApiErrorResponse);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
};
