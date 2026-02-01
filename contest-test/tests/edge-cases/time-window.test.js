const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('Contest Time Window Restrictions', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let contesteeToken = null;

  let expiredContestId = null;
  let futureContestId = null;
  let expiredMcqId = null;
  let futureMcqId = null;
  let expiredDsaProblemId = null;
  let futureDsaProblemId = null;

  beforeAll(async () => {
    // Create and login creator
    await request('POST', '/api/auth/signup', {
      name: 'Time Window Creator',
      email: `time_window_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `time_window_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'Time Window Contestee',
      email: `time_window_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `time_window_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }

    // Create an expired contest
    const pastStartTime = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const pastEndTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    const expiredRes = await request('POST', '/api/contests', {
      title: 'Expired Contest',
      description: 'Already ended',
      startTime: pastStartTime,
      endTime: pastEndTime,
    }, creatorToken);

    if (expiredRes.status === 201) {
      expiredContestId = expiredRes.body.data.id;

      // Add MCQ to expired contest
      const mcqRes = await request('POST', `/api/contests/${expiredContestId}/mcq`, {
        questionText: 'Expired question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      if (mcqRes.status === 201) {
        expiredMcqId = mcqRes.body.data.id;
      }

      // Add DSA problem to expired contest
      const dsaRes = await request('POST', `/api/contests/${expiredContestId}/dsa`, {
        title: 'Expired Problem',
        description: 'Expired',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false },
          { input: '2\n5\n10', expectedOutput: '5\n10', isHidden: true }
        ],
      }, creatorToken);
      if (dsaRes.status === 201) {
        expiredDsaProblemId = dsaRes.body.data.id;
      }
    }

    // Create a future contest (not started yet)
    const futureStartTime = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    const futureEndTime = new Date(Date.now() + 172800000).toISOString(); // 2 days from now

    const futureRes = await request('POST', '/api/contests', {
      title: 'Future Contest',
      description: 'Not started yet',
      startTime: futureStartTime,
      endTime: futureEndTime,
    }, creatorToken);

    if (futureRes.status === 201) {
      futureContestId = futureRes.body.data.id;

      // Add MCQ to future contest
      const mcqRes = await request('POST', `/api/contests/${futureContestId}/mcq`, {
        questionText: 'Future question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        points: 1,
      }, creatorToken);
      if (mcqRes.status === 201) {
        futureMcqId = mcqRes.body.data.id;
      }

      // Add DSA problem to future contest
      const dsaRes = await request('POST', `/api/contests/${futureContestId}/dsa`, {
        title: 'Future Problem',
        description: 'Future',
        tags: ['test'],
        points: 50,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '1\n5', expectedOutput: '5', isHidden: false },
          { input: '2\n5\n10', expectedOutput: '5\n10', isHidden: true }
        ],
      }, creatorToken);
      if (dsaRes.status === 201) {
        futureDsaProblemId = dsaRes.body.data.id;
      }
    }
  });

  it('should return CONTEST_NOT_ACTIVE for MCQ submission to expired contest', async () => {
    if (!expiredMcqId) {
      console.warn('Skipping test - expired contest setup failed');
      return;
    }

    const res = await request('POST', `/api/contests/${expiredContestId}/mcq/${expiredMcqId}/submit`, {
      selectedOptionIndex: 0,
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
  });

  it('should return CONTEST_NOT_ACTIVE for MCQ submission to future contest', async () => {
    if (!futureMcqId) {
      console.warn('Skipping test - future contest setup failed');
      return;
    }

    const res = await request('POST', `/api/contests/${futureContestId}/mcq/${futureMcqId}/submit`, {
      selectedOptionIndex: 0,
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
  });

  it('should return CONTEST_NOT_ACTIVE for DSA submission to expired contest', async () => {
    if (!expiredDsaProblemId) {
      console.warn('Skipping test - expired contest setup failed');
      return;
    }

    const res = await request('POST', `/api/problems/${expiredDsaProblemId}/submit`, {
      code: 'function test() {}',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
  });

  it('should return CONTEST_NOT_ACTIVE for DSA submission to future contest', async () => {
    if (!futureDsaProblemId) {
      console.warn('Skipping test - future contest setup failed');
      return;
    }

    const res = await request('POST', `/api/problems/${futureDsaProblemId}/submit`, {
      code: 'function test() {}',
      language: 'javascript',
    }, contesteeToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'CONTEST_NOT_ACTIVE');
  });
});
