import { Plan, Purchase, User } from "@/generated/prisma/client";

export function ApiResponse<T = User | Plan | Purchase>({
  msg,
  success,
  data,
}: {
  msg: string;
  success: boolean;
  data?: T;
}) {
  return {
    message: msg,
    success,
    data,
  };
}
