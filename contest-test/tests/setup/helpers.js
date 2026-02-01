const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

async function request(method, path, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  return {
    status: response.status,
    body: data,
  };
}

function validateSuccessResponse(body, expectedData = null) {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('error', null);
  expect(Object.keys(body).sort()).toEqual(['data', 'error', 'success']);

  if (expectedData) {
    expect(body.data).toMatchObject(expectedData);
  }
}

function validateErrorResponse(body, expectedError) {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('data', null);
  expect(body).toHaveProperty('error', expectedError);
  expect(typeof body.error).toBe('string');
  expect(Object.keys(body).sort()).toEqual(['data', 'error', 'success']);
}

module.exports = {
  BASE_URL,
  request,
  validateSuccessResponse,
  validateErrorResponse,
};
