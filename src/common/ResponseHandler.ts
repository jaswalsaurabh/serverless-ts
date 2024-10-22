import { APIResponse, ResponseBody } from '../@types/response';

export class ResponseHandler {
  static success<T>(data: T, statusCode: number = 200): APIResponse {
    const body: ResponseBody<T> = {
      success: true,
      data,
    };

    return {
      statusCode,
      body: JSON.stringify(body),
    };
  }

  static error(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    details?: any
  ): APIResponse {
    const body: ResponseBody = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
    };

    return {
      statusCode,
      body: JSON.stringify(body),
    };
  }
}
