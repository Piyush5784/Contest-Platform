"use server";

import { checkSession } from "@/action";
import prisma from "@/app/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { ErrorRes } from "@/lib/helpers";
import { PasswordFormType } from "@/lib/validation-schemas";
import bcrypt from "bcryptjs";

export async function updateUserName({ name }: { name: string }) {
  try {
    if (!name) {
      return ApiResponse({
        msg: "Invalid name",
        success: false,
      });
    }

    const user = await checkSession();

    if (!user) {
      return ApiResponse({
        msg: "Invalid User",
        success: false,
      });
    }

    await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        name,
      },
    });

    return ApiResponse({
      msg: "Username successfully updated",
      success: true,
    });
  } catch (error) {
    return ApiResponse({
      msg: ErrorRes(error),
      success: false,
    });
  }
}

export async function updateUserPassword(values: PasswordFormType) {
  try {
    const user = await checkSession();
    if (!user) {
      return ApiResponse({
        msg: "Invalid user",
        success: false,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (
      !existingUser ||
      !existingUser.passwordHash ||
      existingUser.provider !== "CREDENTIALS"
    ) {
      return ApiResponse({
        msg: "User not found",
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(
      values.currentPassword,
      existingUser.passwordHash
    );

    if (!checkPassword) {
      return ApiResponse({
        msg: "Invalid password",
        success: false,
      });
    }

    const newPassword = await bcrypt.hash(values.newPassword, 13);

    await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        passwordHash: newPassword,
      },
    });

    return ApiResponse({
      msg: "User password successfully updated",
      success: true,
    });
  } catch (error) {
    return ApiResponse({
      msg: ErrorRes(error),
      success: false,
    });
  }
}
