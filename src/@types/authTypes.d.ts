export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface CognitoResponse {
  success: boolean;
  message: string;
  userId?: string;
}

interface SignInResponse extends CognitoResponse {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}
