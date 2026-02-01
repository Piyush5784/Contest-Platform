const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/contests/:contestId/mcq/:questionId/submit', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestee2Token = null;
  let contestId = null;
  let mcqQuestionId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'MCQ Submit Creator',
      email: `mcq_submit_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `mcq_submit_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestees
    await request('POST', '/api/auth/signup', {
      name: 'MCQ Submit Contestee',
      email: `mcq_submit_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `mcq_submit_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    await request('POST', '/api/auth/signup', {
      name: 'MCQ Submit Contestee 2',
      email: `mcq_submit_contestee2_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contestee2Login = await request('POST', '/api/auth/login', {
      email: `mcq_submit_contestee2_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contestee2Login.status === 200) {
      contestee2Token = contestee2Login.body.data.token;
    }

    // Create a contest (active now)
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'MCQ Submit Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }

    // Add MCQ
    const mcqRes = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctOptionIndex: 1,
      points: 5,
    }, creatorToken);

    if (mcqRes.status === 201) {
      mcqQuestionId = mcqRes.body.data.id;
    }
  });

  it('should submit correct MCQ answer successfully as contestee', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 1,
    }, contesteeToken);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('isCorrect', true);
    expect(res.body.data).toHaveProperty('pointsEarned', 5);
  });

  it('should submit incorrect MCQ answer and return 0 points', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 0,
    }, contestee2Token);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('isCorrect', false);
    expect(res.body.data).toHaveProperty('pointsEarned', 0);
  });

  it('should return ALREADY_SUBMITTED for duplicate submission', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 1,
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'ALREADY_SUBMITTED');
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 1,
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return FORBIDDEN when creator tries to submit to own contest', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 1,
    }, creatorToken);

    expect(res.status).toBe(403);
    validateErrorResponse(res.body, 'FORBIDDEN');
  });

  it('should return QUESTION_NOT_FOUND for non-existent question', async () => {
    const res = await request('POST', `/api/contests/${contestId}/mcq/99999/submit`, {
      selectedOptionIndex: 1,
    }, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'QUESTION_NOT_FOUND');
  });

  it('should return INVALID_REQUEST for missing selectedOptionIndex', async () => {
    // Need a fresh contestee for this test
    await request('POST', '/api/auth/signup', {
      name: 'Fresh Contestee',
      email: `fresh_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const freshLogin = await request('POST', '/api/auth/login', {
      email: `fresh_contestee_${testRunId}@test.com`,
      password: 'password123',
    });

    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {}, freshLogin.body.data.token);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for negative selectedOptionIndex', async () => {
    await request('POST', '/api/auth/signup', {
      name: 'Negative Index Contestee',
      email: `negative_idx_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const negLogin = await request('POST', '/api/auth/login', {
      email: `negative_idx_${testRunId}@test.com`,
      password: 'password123',
    });

    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: -1,
    }, negLogin.body.data.token);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for non-integer selectedOptionIndex', async () => {
    await request('POST', '/api/auth/signup', {
      name: 'String Index Contestee',
      email: `string_idx_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const strLogin = await request('POST', '/api/auth/login', {
      email: `string_idx_${testRunId}@test.com`,
      password: 'password123',
    });

    const res = await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 'one',
    }, strLogin.body.data.token);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
