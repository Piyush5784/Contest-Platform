export interface ApiSuccessResponse {
  success: true;
  data: object;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: string;
}

export interface WsResponse {
  status: "RUNNING" | "ACCEPTED" | "RUNTIME_ERROR" | "WRONG_ANSWER" | "ERROR";
  testCasesPassed: number;
  totalTestCases: number;
  pointsEarned?: number;
  input?: string;
  output?: string;
  expected?: string;
}
