import { PrismaClient } from "@/generated/prisma/client";
import { submitDsaProblemSchema } from "@/lib/req-schemas";
import { contesteeRoleMiddleware } from "@/lib/role-middleware";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";
import { PrismaPg } from "@prisma/adapter-pg";
import express from "express";

export const router = express();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.get("/:problemId", async (req, res) => {
  try {
    const problemId = req.params.problemId;

    if (!problemId) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "PROBLEM_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const problem = await prisma.dsaProblem.findFirst({
      where: {
        id: problemId,
      },
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "PROBLEM_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    const visibleTestCases = await prisma.testCases.findMany({
      where: {
        problem_id: problemId,
        is_hidden: false,
      },
    });

    const format = {
      id: problem.id,
      contestId: problem.contest_id,
      title: problem.title,
      description: problem.description,
      tags: problem.tags,
      points: problem.points,
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
      visibleTestCases: visibleTestCases.map((vtc) => ({
        input: vtc.input,
        expectedOutput: vtc.expected_output,
      })),
    };

    return res.json({
      success: true,
      data: format,
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    return res.json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

router.post("/:problemId/submit", contesteeRoleMiddleware, async (req, res) => {
  try {
    const problemId = req.params.problemId as string;

    const checkFormat = submitDsaProblemSchema.safeParse(req.body);

    if (!checkFormat.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }
    if (!problemId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "PROBLEM_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const problem = await prisma.dsaProblem.findFirst({
      where: {
        id: problemId,
      },
    });
    if (!problem) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "PROBLEM_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }
    const contest = await prisma.contest.findFirst({
      where: {
        id: problem?.contest_id,
      },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }
    const now = Date.now();
    const isActive =
      now >= new Date(contest.start_time).getTime() &&
      now <= new Date(contest.end_time).getTime();

    if (!isActive) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_ACTIVE",
      } satisfies ApiErrorResponse);
    }

    const { code, language } = checkFormat.data;

    // const pointsEarned = Math.floor((testCasesPassed / totalTestCases) * problemPoints)
    // const createSubmission = await prisma.dsaSubmission.create({
    //   data: {
    //     code,
    //     language,
    //     execution_time: 90,
    //     status: 34,
    //   },
    // });

    const format = {
      status: "accepted",
      pointsEarned: 100,
      testCasesPassed: 5,
      totalTestCases: 5,
    };

    return res.status(201).json({
      success: true,
      data: format,
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

export const problemRoutes = router;
