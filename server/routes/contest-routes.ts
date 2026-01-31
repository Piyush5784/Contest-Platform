import { PrismaClient } from "@/generated/prisma/client";
import { authMiddleware } from "@/lib/auth-middleware";
import {
  createContestSchema,
  createDsaQuestionSchema,
  createQuestionSchema,
  submitMcqSchema,
} from "@/lib/req-schemas";
import {
  contesteeRoleMiddleware,
  creatorRoleMiddleware,
} from "@/lib/role-middleware";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/api-response-types";
import { PrismaPg } from "@prisma/adapter-pg";
import express from "express";

const router = express.Router();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.post("/", creatorRoleMiddleware, async (req, res) => {
  try {
    const checkData = createContestSchema.safeParse(req.body);

    const creator_id = req.user_id!;

    if (!checkData.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }

    const { title, description, startTime, endTime } = checkData.data;

    const createContest = await prisma.contest.create({
      data: {
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        creator_id,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: createContest.id,
        title: createContest.title,
        description: createContest.description,
        creatorId: createContest.creator_id,
        startTime: createContest.start_time,
        endTime: createContest.end_time,
      },
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

router.get("/:contestId", async (req, res) => {
  try {
    const contestId = req.params.contestId!;

    if (!contestId || !(typeof contestId == "string")) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "CONTEST_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const contest = await prisma.contest.findUnique({
      where: {
        id: contestId,
      },
      include: {
        mcq_questions: true,
        dsa_problems: true,
      },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    const format = {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.start_time,
      endTime: contest.end_time,
      creatorId: contest.creator_id,
      mcqs: contest.mcq_questions.map((m) => ({
        id: m.id,
        questionText: m.question_text,
        options: m.options,
        points: m.points,
      })),
      dsaProblems: contest.dsa_problems.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        tags: d.tags,
        points: d.points,
        timeLimit: d.time_limit,
        memoryLimit: d.memory_limit,
      })),
    };

    // const format = contests.map((c) => ({
    //   id: c.id,
    //   title: c.title,
    //   description: c.description,
    //   startTime: c.start_time,
    //   endTime: c.end_time,
    //   creatorId: c.creator_id,
    //   mcqs: c.mcq_questions.map((m) => ({
    //     id: m.id,
    //     questionText: m.question_text,
    //     options: m.options,
    //     points: m.points,
    //   })),
    //   dsaProblems: c.dsa_problems.map((d) => ({
    //     id: d.id,
    //     title: d.title,
    //     description: d.description,
    //     tags: d.tags,
    //     points: d.points,
    //     timeLimit: d.time_limit,
    //     memoryLimit: d.memory_limit,
    //   })),
    // }));

    return res.status(200).json({
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

router.post("/:contestId/mcq", creatorRoleMiddleware, async (req, res) => {
  try {
    const dataFormat = createQuestionSchema.safeParse(req.body);
    const contestId = req.params.contestId as string;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "CONTEST_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const contest = await prisma.contest.findUnique({
      where: {
        id: contestId,
      },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    if (!dataFormat.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }

    const { questionText, options, correctOptionIndex, points } =
      dataFormat.data;

    const newQuestion = await prisma.mcqQuestion.create({
      data: {
        question_text: questionText,
        options,
        correct_option_index: correctOptionIndex,
        points,
        contest_id: contestId,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newQuestion.id,
        contestId: newQuestion.contest_id,
      },
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

router.post(
  "/:contestId/mcq/:questionId/submit",
  contesteeRoleMiddleware,
  async (req, res) => {
    try {
      const checkFormat = submitMcqSchema.safeParse(req.body);

      const contestId = req.params.contestId as string;
      const questionId = req.params.questionId as string;

      if (!contestId || !questionId || !checkFormat.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        } satisfies ApiErrorResponse);
      }

      const contest = await prisma.contest.findFirst({
        where: {
          id: contestId,
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

      const question = await prisma.mcqQuestion.findFirst({
        where: {
          id: questionId,
        },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "QUESTION_NOT_FOUND",
        } satisfies ApiErrorResponse);
      }

      const submissionCheck = await prisma.mcqSubmission.findFirst({
        where: {
          user_id: req.user_id,
          question_id: questionId,
        },
      });

      if (submissionCheck) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "ALREADY_SUBMITTED",
        } satisfies ApiErrorResponse);
      }

      const { selectedOptionIndex } = checkFormat.data;
      const checkAns = selectedOptionIndex === question.correct_option_index;

      await prisma.mcqSubmission.create({
        data: {
          user_id: req.user_id!,
          question_id: questionId,
          is_correct: checkAns,
        },
      });

      const pointsEarned = checkAns ? question.points : 0;

      return res.status(201).json({
        success: true,
        data: {
          isCorrect: checkAns,
          pointsEarned,
        },
        error: null,
      } satisfies ApiSuccessResponse);
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "SOMETHING_WENT_WRONG",
      } satisfies ApiErrorResponse);
    }
  },
);

router.post("/:contestId/dsa", creatorRoleMiddleware, async (req, res) => {
  try {
    const contestId = req.params.contestId as string;

    if (!contestId) {
      return res.json({
        success: false,
        data: null,
        error: "CONTEST_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const contestCheck = await prisma.contest.findUnique({
      where: {
        id: contestId,
      },
    });

    if (!contestCheck) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    const checkFormat = createDsaQuestionSchema.safeParse(req.body);

    if (!checkFormat.success || checkFormat.data.testCases.length == 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }

    const {
      memoryLimit,
      points,
      tags,
      testCases,
      timeLimit,
      title,
      description,
    } = checkFormat.data;

    const questionId = await prisma.$transaction(async (tx) => {
      const createdDsaQuestion = await tx.dsaProblem.create({
        data: {
          title,
          description,
          points,
          tags,
          contest_id: contestId,
          memory_limit: memoryLimit,
          time_limit: timeLimit,
        },
      });

      const data = testCases.map((tc) => ({
        input: tc.input,
        is_hidden: tc.isHidden,
        expected_output: tc.expectedOutput,
        problem_id: createdDsaQuestion.id,
      }));

      await tx.testCases.createMany({
        data,
      });

      return createdDsaQuestion.id;
    });

    return res.status(201).json({
      success: true,
      data: {
        id: questionId,
        contestId,
      },
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

router.get("/:contestId/leaderboard", async (req, res) => {
  try {
    const user_id = req.user_id;
    const contestId = req.params.contestId;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "CONTEST_ID_REQUIRED",
      } satisfies ApiErrorResponse);
    }

    const contest = await prisma.contest.findUnique({
      where: {
        id: contestId,
      },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    const lb = await prisma.$transaction(async (ts) => {
      const users = await ts.user.findMany({});

      const leaderboardPromises = users.map(async (u) => {
        let totalPoints = 0;
        const dsaSubmission = await ts.dsaSubmission.findMany({
          where: {
            user_id: u.id,
          },
        });

        dsaSubmission.map((ds) => (totalPoints += ds.points_earned));

        const mcqSumissions = await ts.mcqSubmission.findMany({
          where: {
            user_id: u.id,
          },
        });

        mcqSumissions.map((ds) => (totalPoints += ds.points_earned));

        return {
          userId: u.id,
          name: u.name,
          totalPoints: totalPoints,
        };
      });

      // Why we have to do promise all here?
      const leaderboard = await Promise.all(leaderboardPromises);
      return leaderboard;
    });

    const sorted = lb.sort((a, b) => b.totalPoints - a.totalPoints);

    // {
    //   "userId": 3,
    //   "name": "Anmo",
    //   "totalPoints": 180,
    //   "rank": 2
    // },
    // {
    //   "userId": 4,
    //   "name": "Rahul Gujjar",
    //   "totalPoints": 180,
    //   "rank": 2
    // }

    let lastPoint: number | null = null;
    let lastRank = 0;

    const rankedLeadership = sorted.map((u, idx) => {
      if (lastPoint === null || u.totalPoints !== lastPoint) {
        lastRank = idx + 1;
        lastPoint = u.totalPoints;
      }

      return {
        userId: u.userId,
        name: u.name,
        totalPoints: u.totalPoints,
        rank: lastRank,
      };
    });

    return res.json({
      success: true,
      data: rankedLeadership,
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

export const contestRoutes = router;
