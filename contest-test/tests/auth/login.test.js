const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/auth/login', () => {
  const testRunId = Date.now();

  beforeAll(async () => {
    // Create users for login tests
    await request('POST', '/api/auth/signup', {
      name: 'Login Test Creator',
      email: `logintest_creator_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    await request('POST', '/api/auth/signup', {
      name: 'Login Test Contestee',
      email: `logintest_contestee_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });
  });

  it('should login creator successfully and return JWT token', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `logintest_creator_${testRunId}@test.com`,
      password: 'password123',
    });

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(0);
  });

  it('should login contestee successfully and return JWT token', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `logintest_contestee_${testRunId}@test.com`,
      password: 'password123',
    });

    expect(res.status).toBe(200);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should return INVALID_CREDENTIALS for wrong password', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `logintest_creator_${testRunId}@test.com`,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'INVALID_CREDENTIALS');
  });

  it('should return INVALID_CREDENTIALS for non-existent email', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'nonexistent@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    validateErrorResponse(res.body, 'INVALID_CREDENTIALS');
  });

  it('should return INVALID_REQUEST for missing email', async () => {
    const res = await request('POST', '/api/auth/login', {
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing password', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `logintest_creator_${testRunId}@test.com`,
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty body', async () => {
    const res = await request('POST', '/api/auth/login', {});

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for invalid email format', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'not-valid-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
