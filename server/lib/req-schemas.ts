import { LANGUAGES } from "@/common/language-types";
import { Role } from "@/generated/prisma/enums";
import z from "zod";

const isoUtcString = z.iso.datetime({ offset: true });

export const signInSchema = z.object({
  name: z.string(),
  email: z.email(),
  role: z.enum([Role.CONTESTEE, Role.CREATOR]).optional(),
  password: z.string(),
});

export const signInSchemaGoogle = signInSchema
  .pick({ name: true, email: true })
  .extend({
    image: z.string().optional(),
  });

export const loginSchema = signInSchema.pick({ email: true, password: true });

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
  language: z.enum(LANGUAGES),
});

export const submitMcqSchema = z.object({
  selectedOptionIndex: z.number().int().min(0),
});
