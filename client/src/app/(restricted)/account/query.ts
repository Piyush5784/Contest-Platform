"use client";

import { ErrorRes } from "@/lib/helpers";
import { PasswordFormType } from "@/lib/validation-schemas";
import axios from "axios";
import bcrypt from "bcryptjs";
import { BACKEND_URL } from "../../../../config";

export async function updateUserName({ name }: { name: string }) {}

export async function updateUserPassword(values: PasswordFormType) {}
