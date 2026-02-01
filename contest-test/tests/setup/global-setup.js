const { request } = require('./helpers');

// Shared test data - will be populated during setup
const testData = {
  testRunId: Date.now(),
  creatorToken: null,
  contesteeToken: null,
  contestee2Token: null,
  creatorId: null,
  contesteeId: null,
  contestee2Id: null,
  contestId: null,
  mcqQuestionId: null,
  mcqQuestionId2: null,
  dsaProblemId: null,
};

async function setupTestUsers() {
  // Register creator
  const creatorRes = await request('POST', '/api/auth/signup', {
    name: 'Test Creator',
    email: `creator${testData.testRunId}@test.com`,
    password: 'password123',
    role: 'creator',
  });
  if (creatorRes.status === 201) {
    testData.creatorId = creatorRes.body.data.id;
  }

  // Register contestee
  const contesteeRes = await request('POST', '/api/auth/signup', {
    name: 'Test Contestee',
    email: `contestee${testData.testRunId}@test.com`,
    password: 'password123',
    role: 'contestee',
  });
  if (contesteeRes.status === 201) {
    testData.contesteeId = contesteeRes.body.data.id;
  }

  // Register second contestee
  const contestee2Res = await request('POST', '/api/auth/signup', {
    name: 'Second Contestee',
    email: `contestee2_${testData.testRunId}@test.com`,
    password: 'password123',
    role: 'contestee',
  });
  if (contestee2Res.status === 201) {
    testData.contestee2Id = contestee2Res.body.data.id;
  }

  // Login all users
  const creatorLogin = await request('POST', '/api/auth/login', {
    email: `creator${testData.testRunId}@test.com`,
    password: 'password123',
  });
  if (creatorLogin.status === 200) {
    testData.creatorToken = creatorLogin.body.data.token;
  }

  const contesteeLogin = await request('POST', '/api/auth/login', {
    email: `contestee${testData.testRunId}@test.com`,
    password: 'password123',
  });
  if (contesteeLogin.status === 200) {
    testData.contesteeToken = contesteeLogin.body.data.token;
  }

  const contestee2Login = await request('POST', '/api/auth/login', {
    email: `contestee2_${testData.testRunId}@test.com`,
    password: 'password123',
  });
  if (contestee2Login.status === 200) {
    testData.contestee2Token = contestee2Login.body.data.token;
  }
}

async function setupTestContest() {
  const startTime = new Date(Date.now() - 60000).toISOString();
  const endTime = new Date(Date.now() + 7200000).toISOString();

  const res = await request('POST', '/api/contests', {
    title: 'Test Contest',
    description: 'Test Description',
    startTime,
    endTime,
  }, testData.creatorToken);

  if (res.status === 201) {
    testData.contestId = res.body.data.id;
  }
}

async function setupTestMcq() {
  const res = await request('POST', `/api/contests/${testData.contestId}/mcq`, {
    questionText: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
    correctOptionIndex: 1,
    points: 5,
  }, testData.creatorToken);

  if (res.status === 201) {
    testData.mcqQuestionId = res.body.data.id;
  }

  // Add second MCQ for leaderboard tests
  const res2 = await request('POST', `/api/contests/${testData.contestId}/mcq`, {
    questionText: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctOptionIndex: 1,
    points: 3,
  }, testData.creatorToken);

  if (res2.status === 201) {
    testData.mcqQuestionId2 = res2.body.data.id;
  }
}

async function setupTestDsa() {
  const res = await request('POST', `/api/contests/${testData.contestId}/dsa`, {
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
  }, testData.creatorToken);

  if (res.status === 201) {
    testData.dsaProblemId = res.body.data.id;
  }
}

async function setupAll() {
  await setupTestUsers();
  await setupTestContest();
  await setupTestMcq();
  await setupTestDsa();
}

module.exports = {
  testData,
  setupTestUsers,
  setupTestContest,
  setupTestMcq,
  setupTestDsa,
  setupAll,
};
