"use server";

import { registerFormSchema } from "@/lib/validation-schemas";
import z from "zod";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/lib/api-response";

export async function registerUser(values: z.infer<typeof registerFormSchema>) {
  try {
    const checkUser = await prisma.user.findUnique({
      where: {
        email: values.email,
      },
    });

    if (checkUser) {
      return ApiResponse({
        msg: "User Already exists",
        success: false,
      });
    }

    const passwordHash = await bcrypt.hash(values.password, 13);
    const newUser = await prisma.user.create({
      data: {
        email: values.email,
        passwordHash,
      },
    });

    return ApiResponse({
      data: newUser,
      msg: "User successfully registered",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return ApiResponse({
      msg: "Failed to register user",
      success: false,
    });
  }
}
