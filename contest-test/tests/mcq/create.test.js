const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/contests/:contestId/mcq', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'MCQ Creator',
      email: `mcq_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `mcq_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'MCQ Contestee',
      email: `mcq_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `mcq_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create a contest
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'MCQ Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }
  });

  it('should add MCQ question successfully as creator', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
      correctOptionIndex: 1,
      points: 5,
    }, creatorToken);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('contestId', contestId);
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      points: 1,
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return FORBIDDEN when contestee tries to add MCQ', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      points: 1,
    }, contesteeToken);

    expect(res.status).toBe(403);
    validateErrorResponse(res.body, 'FORBIDDEN');
  });

  it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
    const res = await request('POST', '/api/contests/99999/mcq', {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });

  it('should return INVALID_REQUEST for missing questionText', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing options', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      correctOptionIndex: 0,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing correctOptionIndex', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for non-array options', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: 'not-an-array',
      correctOptionIndex: 0,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for invalid correctOptionIndex (out of bounds)', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 5,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for negative correctOptionIndex', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: -1,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty options array', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Test Question',
      options: [],
      correctOptionIndex: 0,
      points: 1,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
