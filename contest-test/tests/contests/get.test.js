const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('GET /api/contests/:contestId', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let creatorId = null;
  let contesteeToken = null;
  let contestId = null;

  beforeAll(async () => {
    // Create and login creator
    const creatorRes = await request('POST', '/api/auth/signup', {
      name: 'Get Contest Creator',
      email: `get_contest_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });
    if (creatorRes.status === 201) {
      creatorId = creatorRes.body.data.id;
    }

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `get_contest_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'Get Contest Contestee',
      email: `get_contest_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `get_contest_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create a contest
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'Test Contest for Get',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }

    // Add MCQ to contest
    await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test question?',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      points: 5,
    }, creatorToken);

    // Add DSA problem to contest
    await request('POST', `/api/contests/${contestId}/dsa`, {
      title: 'Test Problem',
      description: 'Test description',
      tags: ['test'],
      points: 100,
      timeLimit: 2000,
      memoryLimit: 256,
      testCases: [
        { input: '1', expectedOutput: '1', isHidden: false },
      ],
    }, creatorToken);
  });

  it('should get contest details successfully', async () => {
    const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id', contestId);
    expect(res.body.data).toHaveProperty('title', 'Test Contest for Get');
    expect(res.body.data).toHaveProperty('description', 'Test Description');
    expect(res.body.data).toHaveProperty('startTime');
    expect(res.body.data).toHaveProperty('endTime');
    expect(res.body.data).toHaveProperty('creatorId', creatorId);
    expect(res.body.data).toHaveProperty('mcqs');
    expect(res.body.data).toHaveProperty('dsaProblems');
    expect(Array.isArray(res.body.data.mcqs)).toBe(true);
    expect(Array.isArray(res.body.data.dsaProblems)).toBe(true);
  });

  it('should include MCQs without correctOptionIndex for contestees', async () => {
    const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data.mcqs.length).toBeGreaterThan(0);

    // MCQs should NOT include correctOptionIndex for contestees
    res.body.data.mcqs.forEach(mcq => {
      expect(mcq).toHaveProperty('id');
      expect(mcq).toHaveProperty('questionText');
      expect(mcq).toHaveProperty('options');
      expect(mcq).toHaveProperty('points');
      expect(mcq).not.toHaveProperty('correctOptionIndex');
    });
  });

  it('should include DSA problems', async () => {
    const res = await request('GET', `/api/contests/${contestId}`, null, contesteeToken);

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data.dsaProblems.length).toBeGreaterThan(0);

    res.body.data.dsaProblems.forEach(problem => {
      expect(problem).toHaveProperty('id');
      expect(problem).toHaveProperty('title');
      expect(problem).toHaveProperty('description');
      expect(problem).toHaveProperty('tags');
      expect(problem).toHaveProperty('points');
      expect(problem).toHaveProperty('timeLimit');
      expect(problem).toHaveProperty('memoryLimit');
    });
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('GET', `/api/contests/${contestId}`);

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return UNAUTHORIZED with invalid token', async () => {
    const res = await request('GET', `/api/contests/${contestId}`, null, 'invalid-token');

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
    const res = await request('GET', '/api/contests/99999', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });

  it('should return CONTEST_NOT_FOUND for invalid contest ID', async () => {
    const res = await request('GET', '/api/contests/invalid-id', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });
});
