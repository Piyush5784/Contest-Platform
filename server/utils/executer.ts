import type { TYPE_LANGUAGES } from "@/common/language-types";
import type { TestCases } from "@/generated/prisma/client";
import type { WsResponse } from "@/lib/api-response-types";
import { Sandbox } from "@e2b/code-interpreter";
import { send } from "@/ws";

interface e2bCodeExecuterProps {
  userId: string;
  code: string;
  language: TYPE_LANGUAGES;
  testCases: TestCases[];
  timeLimitMs: number;
}

export async function e2bCodeExecuter({
  userId,
  code,
  language,
  testCases,
  timeLimitMs,
}: e2bCodeExecuterProps) {
  let sandbox: Sandbox | null = null;

  try {
    sandbox = await Sandbox.create({
      timeoutMs: timeLimitMs,
    });

    let fileName = "";
    let runCmd = "";

    switch (language) {
      case "python": {
        fileName = "solution.py";
        runCmd = `python3 ${fileName}`;
        break;
      }
      case "javascript": {
        fileName = "solution.js";
        runCmd = `node ${fileName}`;
        break;
      }
      case "c++": {
        fileName = "solution.cpp";
        runCmd = `g++ solution.cpp -O2 -o solution && ./solution`;
        break;
      }
      case "typescript": {
        fileName = "solution.ts";
        runCmd = `npx ts-node ${fileName}`;
        break;
      }
      default: {
        throw new Error("Unsupported language");
      }
    }

    await sandbox.files.write(fileName, code);

    let testCasesPassed = 0;

    for (const tc of testCases) {
      const handle = await sandbox.commands.run(runCmd, {
        background: true,
        stdin: true, // Enable stdin
        timeoutMs: timeLimitMs,
      });

      await sandbox.commands.sendStdin(handle.pid, tc.input + "\n");

      const result = await handle.wait();

      if (result.exitCode !== 0) {
        send(userId, "submission:update", {
          status: "RUNTIME_ERROR",
          testCasesPassed,
          totalTestCases: testCases.length,
        } satisfies WsResponse);

        return {
          testCasesPassed,
          totalTestCases: testCases.length,
          status: "RUNTIME_ERROR",
          input: tc.input,
          output: result.stderr,
          expected: tc.expected_output.trim(),
        } satisfies WsResponse;
      }

      const output = result.stdout.trim();
      const expected = tc.expected_output.trim();
      const ok = output === expected;

      if (!ok) {
        send(userId, "submission:update", {
          status: "WRONG_ANSWER",
          testCasesPassed,
          totalTestCases: testCases.length,
        } satisfies WsResponse);

        return {
          status: "WRONG_ANSWER",
          testCasesPassed,
          totalTestCases: testCases.length,
          input: tc.input,
          output,
          expected,
        } satisfies WsResponse;
      }

      testCasesPassed++;

      send(userId, "submission:update", {
        status: "RUNNING",
        testCasesPassed,
        totalTestCases: testCases.length,
      } satisfies WsResponse);
    }

    return {
      status: "ACCEPTED",
      testCasesPassed,
      totalTestCases: testCases.length,
    } satisfies WsResponse;
  } catch (error) {
    send(userId, "submission:update", {
      status: "ERROR",
      testCasesPassed: 0,
      totalTestCases: testCases.length,
    } satisfies WsResponse);

    return {
      status: "ERROR",
      testCasesPassed: 0,
      totalTestCases: testCases.length,
    } satisfies WsResponse;
  } finally {
    if (sandbox) {
      await sandbox.kill();
    }
  }
}
