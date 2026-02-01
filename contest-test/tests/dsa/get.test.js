const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('GET /api/problems/:problemId', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestId = null;
  let dsaProblemId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'DSA Get Creator',
      email: `dsa_get_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `dsa_get_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'DSA Get Contestee',
      email: `dsa_get_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `dsa_get_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create a contest
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'DSA Get Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }

    // Add DSA problem with hidden and visible test cases
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

  it('should get DSA problem details with visible test cases only', async () => {
    const res = await request('GET', `/api/problems/${dsaProblemId}`, null, contesteeToken);

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id', dsaProblemId);
    expect(res.body.data).toHaveProperty('contestId', contestId);
    expect(res.body.data).toHaveProperty('title', 'Two Sum');
    expect(res.body.data).toHaveProperty('description');
    expect(res.body.data).toHaveProperty('tags');
    expect(res.body.data).toHaveProperty('points', 100);
    expect(res.body.data).toHaveProperty('timeLimit', 2000);
    expect(res.body.data).toHaveProperty('memoryLimit', 256);
    expect(res.body.data).toHaveProperty('visibleTestCases');
    expect(Array.isArray(res.body.data.visibleTestCases)).toBe(true);

    // Verify only visible test cases are returned (isHidden: false)
    expect(res.body.data.visibleTestCases.length).toBe(1);
    expect(res.body.data.visibleTestCases[0]).toHaveProperty('input');
    expect(res.body.data.visibleTestCases[0]).toHaveProperty('expectedOutput');

    // CRITICAL: Hidden test cases must NEVER be exposed
    expect(res.body.data).not.toHaveProperty('testCases');
    res.body.data.visibleTestCases.forEach(tc => {
      expect(tc).not.toHaveProperty('isHidden');
    });
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('GET', `/api/problems/${dsaProblemId}`);

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return UNAUTHORIZED with invalid token', async () => {
    const res = await request('GET', `/api/problems/${dsaProblemId}`, null, 'invalid-token');

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return PROBLEM_NOT_FOUND for non-existent problem', async () => {
    const res = await request('GET', '/api/problems/99999', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
  });

  it('should return PROBLEM_NOT_FOUND for invalid problem ID', async () => {
    const res = await request('GET', '/api/problems/invalid-id', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'PROBLEM_NOT_FOUND');
  });
});
