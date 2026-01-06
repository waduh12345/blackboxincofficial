export interface ApiErrorResponse {
  status?: number;
  data?: {
    message?: string;
  };
  message?: string; // Untuk handle error standar JS
}