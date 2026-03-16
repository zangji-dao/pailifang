export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, code: number = 500): { success: false; error: string } {
  return {
    success: false,
    error,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<{ data: T[]; total: number; page: number; pageSize: number }> {
  return {
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
    },
  };
}
