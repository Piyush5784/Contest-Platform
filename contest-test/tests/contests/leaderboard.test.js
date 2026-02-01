const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('GET /api/contests/:contestId/leaderboard', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;
  let contestee2Token = null;
  let contestId = null;
  let mcqQuestionId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'Leaderboard Creator',
      email: `lb_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `lb_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestees
    await request('POST', '/api/auth/signup', {
      name: 'Leaderboard Contestee 1',
      email: `lb_contestee1_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `lb_contestee1_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    await request('POST', '/api/auth/signup', {
      name: 'Leaderboard Contestee 2',
      email: `lb_contestee2_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contestee2Login = await request('POST', '/api/auth/login', {
      email: `lb_contestee2_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contestee2Login.status === 200) {
      contestee2Token = contestee2Login.body.data.token;
    }

    // Create a contest
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const contestRes = await request('POST', '/api/contests', {
      title: 'Leaderboard Test Contest',
      description: 'Test Description',
      startTime,
      endTime,
    }, creatorToken);

    if (contestRes.status === 201) {
      contestId = contestRes.body.data.id;
    }

    // Add MCQ
    const mcqRes = await request('POST', `/api/contests/${contestId}/mcq`, {
      questionText: 'Leaderboard test question?',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 1,
      points: 10,
    }, creatorToken);

    if (mcqRes.status === 201) {
      mcqQuestionId = mcqRes.body.data.id;
    }

    // Contestee 1 submits correct answer
    await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 1,
    }, contesteeToken);

    // Contestee 2 submits wrong answer
    await request('POST', `/api/contests/${contestId}/mcq/${mcqQuestionId}/submit`, {
      selectedOptionIndex: 0,
    }, contestee2Token);
  });

  it('should return leaderboard with correct rankings', async () => {
    const res = await request('GET', `/api/contests/${contestId}/leaderboard`, null, contesteeToken);

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      res.body.data.forEach(entry => {
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('totalPoints');
        expect(entry).toHaveProperty('rank');
        expect(typeof entry.userId).toBe('string');
        expect(typeof entry.name).toBe('string');
        expect(typeof entry.totalPoints).toBe('number');
        expect(typeof entry.rank).toBe('number');
      });

      // Verify sorted by points descending
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i - 1].totalPoints).toBeGreaterThanOrEqual(res.body.data[i].totalPoints);
      }

      // Verify ranks are correct (same points = same rank)
      for (let i = 1; i < res.body.data.length; i++) {
        if (res.body.data[i].totalPoints === res.body.data[i - 1].totalPoints) {
          expect(res.body.data[i].rank).toBe(res.body.data[i - 1].rank);
        } else {
          expect(res.body.data[i].rank).toBeGreaterThan(res.body.data[i - 1].rank);
        }
      }
    }
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('GET', `/api/contests/${contestId}/leaderboard`);

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return UNAUTHORIZED with invalid token', async () => {
    const res = await request('GET', `/api/contests/${contestId}/leaderboard`, null, 'invalid-token');

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return CONTEST_NOT_FOUND for non-existent contest', async () => {
    const res = await request('GET', '/api/contests/99999/leaderboard', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });

  it('should return CONTEST_NOT_FOUND for invalid contest ID', async () => {
    const res = await request('GET', '/api/contests/invalid-id/leaderboard', null, contesteeToken);

    expect(res.status).toBe(404);
    validateErrorResponse(res.body, 'CONTEST_NOT_FOUND');
  });
});
