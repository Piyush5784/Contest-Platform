const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/contests', () => {
  const testRunId = Date.now();
  let creatorToken = null;
  let creatorId = null;
  let contesteeToken = null;

  const futureStartTime = new Date(Date.now() + 60000).toISOString();
  const futureEndTime = new Date(Date.now() + 7200000).toISOString();

  beforeAll(async () => {
    // Create and login creator
    const creatorRes = await request('POST', '/api/auth/signup', {
      name: 'Contest Creator',
      email: `contest_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });
    if (creatorRes.status === 201) {
      creatorId = creatorRes.body.data.id;
    }

    const creatorLogin = await request('POST', '/api/auth/login', {
      email: `contest_creator_${testRunId}@test.com`,
      password: 'password123',
    });
    if (creatorLogin.status === 200) {
      creatorToken = creatorLogin.body.data.token;
    }

    // Create and login contestee
    await request('POST', '/api/auth/signup', {
      name: 'Contest Contestee',
      email: `contest_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    const contesteeLogin = await request('POST', '/api/auth/login', {
      email: `contest_contestee_${testRunId}@test.com`,
      password: 'password123',
    });
    if (contesteeLogin.status === 200) {
      contesteeToken = contesteeLogin.body.data.token;
    }
  });

  it('should create a contest successfully as creator', async () => {
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      startTime: startTime,
      endTime: endTime,
    }, creatorToken);

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('title', 'Test Contest');
    expect(res.body.data).toHaveProperty('description', 'Test Description');
    expect(res.body.data).toHaveProperty('creatorId', creatorId);
    expect(res.body.data).toHaveProperty('startTime');
    expect(res.body.data).toHaveProperty('endTime');
  });

  it('should return UNAUTHORIZED without token', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      startTime: futureStartTime,
      endTime: futureEndTime,
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return UNAUTHORIZED with invalid token', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      startTime: futureStartTime,
      endTime: futureEndTime,
    }, 'invalid-token-here');

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'UNAUTHORIZED');
  });

  it('should return FORBIDDEN when contestee tries to create contest', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Contestee Contest',
      description: 'Should fail',
      startTime: futureStartTime,
      endTime: futureEndTime,
    }, contesteeToken);

    expect(res.status).toBe(403);
    validateErrorResponse(res.body, 'FORBIDDEN');
  });

  it('should return INVALID_REQUEST for missing title', async () => {
    const res = await request('POST', '/api/contests', {
      description: 'Test Description',
      startTime: futureStartTime,
      endTime: futureEndTime,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing description', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      startTime: futureStartTime,
      endTime: futureEndTime,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing startTime', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      endTime: futureEndTime,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing endTime', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      startTime: futureStartTime,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for invalid date format', async () => {
    const res = await request('POST', '/api/contests', {
      title: 'Test Contest',
      description: 'Test Description',
      startTime: 'not-a-date',
      endTime: futureEndTime,
    }, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty body', async () => {
    const res = await request('POST', '/api/contests', {}, creatorToken);

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
