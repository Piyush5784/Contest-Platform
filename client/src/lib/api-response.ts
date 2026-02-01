import { getErrorMessage } from "@/utils/format-response";

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  error: null;
};

export type ApiErrorResponse = {
  success: false;
  data: null;
  error: string;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
