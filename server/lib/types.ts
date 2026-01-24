export interface ApiSuccessResponse {
  success: true;
  data: Object;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: string;
}
