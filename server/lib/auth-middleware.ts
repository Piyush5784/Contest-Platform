import type { NextFunction, Request, Response } from "express";
import type { ApiErrorResponse } from "./types";
import jwt from "jsonwebtoken";
import type { Role } from "@/generated/prisma/enums";
import { JWT_PASSWORD } from "@/config";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "UNAUTHORIZED",
      } satisfies ApiErrorResponse);
    }

    const token = authHeader?.split(" ")[1]!;
  
    const checkPass = jwt.verify(token, JWT_PASSWORD) as {
      id: string;
      email: string;
      role: Role;
    };

    if (!checkPass) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "UNAUTHORIZED",
      } satisfies ApiErrorResponse);
    }

    req.user_id = checkPass.id;
    req.user_email = checkPass.email;
    req.user_role = checkPass.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    } satisfies ApiErrorResponse);
  }
};
