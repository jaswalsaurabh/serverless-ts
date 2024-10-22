export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AuthServiceResponse {
  success: boolean;
  message: string;
  userId?: string;
}
