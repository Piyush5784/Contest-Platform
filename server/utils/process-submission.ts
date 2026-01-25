import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { e2bCodeExecuter } from "@/utils/executer";
import { send } from "@/ws";
import type { WsResponse } from "@/lib/api-response-types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface ProcessSubmissionParams {
  userId: string;
  problemId: string;
  code: string;
  language: string;
  problemPoints: number;
  timeLimit: number;
}

export async function processSubmission({
  userId,
  problemId,
  code,
  language,
  problemPoints,
  timeLimit,
}: ProcessSubmissionParams) {
  const testCases = await prisma.testCases.findMany({
    where: { problem_id: problemId },
  });

  const result = await e2bCodeExecuter({
    userId,
    code,
    language,
    testCases,
    timeLimitMs: timeLimit,
  });

  const pointsEarned = Math.floor(
    (result.testCasesPassed / result.totalTestCases!) * problemPoints,
  );

  send(userId, "submission:result", {
    status: result.status,
    testCasesPassed: result.testCasesPassed,
    totalTestCases: testCases.length,
    pointsEarned,
  } satisfies WsResponse);
}
