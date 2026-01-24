import type { Role } from "@/generated/prisma/enums";

declare module "express-serve-static-core" {
  interface Request {
    user_id?: string;
    user_email?: string;
    user_role?: Role;
  }
}
