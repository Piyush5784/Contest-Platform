const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/contests/:contestId/dsa', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'DSA Creator',
      email: `dsa_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `dsa_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'DSA Contestee',
      email: `dsa_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `dsa_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create a contest
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'DSA Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }
  });

  it('should add DSA problem with test cases successfully', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
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

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('contestId', contestId);
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return FORBIDDEN when contestee tries to add DSA problem', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    }, contesteeToken);

    expect(res.status).toBe(403);
    validateErrorResponse(res.body, 'FORBIDDEN');
  });

  it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
    const res = await request('POST', '/api/contests/99999/dsa', {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    }, creatorToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });

  it('should return INVALID_REQUEST for missing title', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing description', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing testCases', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty testCases array', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for test case missing input', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [{ expectedOutput: '5', isHidden: false }],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for test case missing expectedOutput', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [{ input: '1\n5', isHidden: false }],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for non-array tags', async () => {
    const res = await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: 'not-an-array',
      points: 50,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        { input: '1\n5', expectedOutput: '5', isHidden: false }
      ],
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
