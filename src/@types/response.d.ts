export interface APIResponse {
  statusCode: number;
  body: string;
  headers?: {
    [key: string]: string | boolean;
  };
}

export type ServiceErrorType =
  | 'RegistrationError'
  | 'VerificationError'
  | 'AuthenticationError'
  | 'UserNotFoundError'
  | 'PasswordResetError'
  | 'VerifyAttributeError'
  | 'ResendOTPError';

export interface ResponseBody<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
