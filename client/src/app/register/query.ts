"use client";

import { registerFormSchema } from "@/lib/validation-schemas";
import z from "zod";
import { ApiSuccessResponse } from "@/lib/api-response";
import axios from "axios";
import axiosInstance from "@/utils/axios-instance";

export async function registerUser(values: z.infer<typeof registerFormSchema>) {
  const res = await axiosInstance.post(`/api/auth/signup`, {
    name: values.name,
    email: values.email,
    password: values.password,
  });
  return res.data satisfies ApiSuccessResponse;
}
