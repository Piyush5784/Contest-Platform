import { Role } from "@/generated/prisma/enums";
import z from "zod";

const isoUtcString = z.iso.datetime({ offset: true });

export const signInSchema = z.object({
  name: z.string(),
  email: z.email(),
  role: z.enum([Role.CONTESTEE, Role.CREATOR]).optional(),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const createContestSchema = z.object({
  title: z.string().max(20),
  description: z.string().max(300),
  startTime: isoUtcString,
  endTime: isoUtcString,
});

export const createQuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()),
  correctOptionIndex: z.number().int().min(1).max(4),
  points: z.number(),
});

export const createDsaQuestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  points: z.number(),
  timeLimit: z.number(),
  memoryLimit: z.number(),
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean(),
    }),
  ),
});

export const submitDsaProblemSchema = z.object({
  code: z.string().nonempty(),
  language: z.string(),
});

export const submitMcqSchema = z.object({
  selectedOptionIndex: z.number().int().min(0),
});
