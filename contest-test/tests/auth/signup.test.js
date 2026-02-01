const { request, validateSuccessResponse, validateErrorResponse } = require('../setup/helpers');

describe('POST /api/auth/signup', () => {
  const testRunId = Date.now();

  it('should register a creator successfully', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Test Creator',
      email: `creator_signup_${testRunId}@test.com`,
      password: 'password123',
      role: 'creator',
    });

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name', 'Test Creator');
    expect(res.body.data).toHaveProperty('email', `creator_signup_${testRunId}@test.com`);
    expect(res.body.data).toHaveProperty('role', 'creator');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should register a contestee successfully', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Test Contestee',
      email: `contestee_signup_${testRunId}@test.com`,
      password: 'password123',
      role: 'contestee',
    });

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('role', 'contestee');
  });

  it('should default role to contestee if not provided', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Default Role User',
      email: `defaultrole_${testRunId}@test.com`,
      password: 'password123',
    });

    expect(res.status).toBe(201);
    validateSuccessResponse(res.body);
    expect(res.body.data).toHaveProperty('role', 'contestee');
  });

  it('should return EMAIL_ALREADY_EXISTS for duplicate email', async () => {
    // First create user
    await request('POST', '/api/auth/signup', {
      name: 'Original User',
      email: `duplicate_${testRunId}@test.com`,
      password: 'password123',
    });

    // Try duplicate
    const res = await request('POST', '/api/auth/signup', {
      name: 'Duplicate User',
      email: `duplicate_${testRunId}@test.com`,
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'EMAIL_ALREADY_EXISTS');
  });

  it('should return INVALID_REQUEST for missing email', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'No Email User',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing password', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'No Password User',
      email: `nopassword_${testRunId}@test.com`,
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for missing name', async () => {
    const res = await request('POST', '/api/auth/signup', {
      email: `noname_${testRunId}@test.com`,
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for invalid email format', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Invalid Email User',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for invalid role', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Invalid Role User',
      email: `invalidrole_${testRunId}@test.com`,
      password: 'password123',
      role: 'admin',
    });

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });

  it('should return INVALID_REQUEST for empty body', async () => {
    const res = await request('POST', '/api/auth/signup', {});

    expect(res.status).toBe(400);
    validateErrorResponse(res.body, 'INVALID_REQUEST');
  });
});
