// Re-export from unified location
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/api-response";

export { successResponse, errorResponse } from "@/lib/api-response";

// WebSocket response type
export interface WsResponse {
  status: "RUNNING" | "ACCEPTED" | "RUNTIME_ERROR" | "WRONG_ANSWER" | "ERROR";
  testCasesPassed: number;
  totalTestCases: number;
  pointsEarned?: number;
  input?: string;
  output?: string;
  expected?: string;
}
