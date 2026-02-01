const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/problems/:problemId/submit', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestId = null;
  let dsaProblemId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'DSA Submit Creator',
      email: `dsa_submit_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `dsa_submit_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'DSA Submit Contestee',
      email: `dsa_submit_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `dsa_submit_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create a contest (active now)
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'DSA Submit Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }

    // Add DSA problem
    const dsaRes = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      tags: ['array', 'hash-table'],
      points: 100,
      timeLimit: 2000,
      memoryLimit: 256,
      testCases: [
        {
          input: "2\n4 9\n2 7 11 15\n3 6\n3 2 4",
          expectedOutput: "0 1\n1 2",
          isHidden: false,
        },
        {
          input: "3\n2 6\n3 3\n5 10\n1 4 5 6 9\n4 8\n2 2 2 2",
          expectedOutput: "0 1\n0 2\n1 3",
          isHidden: true,
        },
      ],
    }, creatorToken);

    if (dsaRes.status === 201) {
      dsaProblemId = dsaRes.body.data.id;
    }
  });

  it('should submit DSA solution successfully', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: 'function twoSum(nums, target) { for(let i=0;i<nums.length;i++) for(let j=i+1;j<nums.length;j++) if(nums[i]+nums[j]===target) return [i,j]; }',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('status');
  });

  it('should allow multiple submissions for DSA problems', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('status');
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: 'function twoSum() {}',
      language: 'javascript',
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return FORBIDDEN when creator tries to submit to own contest problem', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: 'function twoSum() {}',
      language: 'javascript',
    }, creatorToken);

    expect(res.status).toBe(403);
    validateErrorResponse(res.body, 'FORBIDDEN');
  });

  it('should return PROBLEM_NOT_FOUND for non-existent problem', async () => {
    const res = await request('POST', '/api/problems/99999/submit', {
      code: 'function test() {}',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
  });

  it('should return INVALID_REQUEST for missing code', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing language', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: 'function test() {}',
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty code', async () => {
    const res = await request('POST', `/api/problems/${dsaProblemId}/submit`, {
      code: '',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
