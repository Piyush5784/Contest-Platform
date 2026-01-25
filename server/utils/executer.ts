import type { TYPE_LANGUAGES } from "@/common/language-types";
import type { TestCases } from "@/generated/prisma/client";
import { Sandbox } from "@e2b/code-interpreter";

interface e2bCodeExecuterProps {
  code: string;
  language: TYPE_LANGUAGES;
  testCases: TestCases[];
  timeLimitMs: number;
}

export async function e2bCodeExecuter({
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
        return {
          testCasesPassed,
          total: testCases.length,
          status: "Runtime Error",
          input: tc.input,
          output: result.stderr,
          expected: tc.expected_output.trim(),
          passed: false,
        };
      }

      const output = result.stdout.trim();
      const expected = tc.expected_output.trim();
      const ok = output === expected;

      if (!ok) {
        return {
          testCasesPassed,
          total: testCases.length,
          status: "Wrong Answer",
          input: tc.input,
          output,
          expected,
          passed: false,
        };
      }

      testCasesPassed++;
    }

    return {
      testCasesPassed,
      total: testCases.length,
      status: "Accepted",
    };
  } catch (error) {
    return {
      testCasesPassed: 0,
      total: testCases.length,
      status: "Error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    if (sandbox) {
      await sandbox.kill();
    }
  }
}
