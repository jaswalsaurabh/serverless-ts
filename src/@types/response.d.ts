export interface APIResponse {
  statusCode: number;
  body: string;
  headers?: {
    [key: string]: string | boolean;
  };
}

export interface ResponseBody<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
