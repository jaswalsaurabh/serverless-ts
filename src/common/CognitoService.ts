import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  SignUpCommandInput,
  VerifyUserAttributeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoResponse,
  RegisterUserInput,
  SignInResponse,
} from '../@types/authTypes';
import { ServiceErrorType } from '../@types/response';

export class ServiceError extends Error {
  constructor(message: string, name: ServiceErrorType) {
    super(message);
    this.name = name;
  }
}

export class CognitoAuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private readonly USER_POOL_ID: string;
  private readonly CLIENT_ID: string;

  constructor() {
    // Initialize the Cognito client
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.REGION || 'us-east-1',
    });

    // Get User Pool details from environment variables
    this.USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
    this.CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

    if (!this.USER_POOL_ID || !this.CLIENT_ID) {
      throw new Error('Cognito User Pool ID and Client ID must be configured');
    }
  }

  async registerUser(userData: RegisterUserInput): Promise<CognitoResponse> {
    try {
      // Validate input
      this.validateUserInput(userData);

      // Prepare user attributes
      const userAttributes = [
        {
          Name: 'email',
          Value: userData.email,
        },
        {
          Name: 'name',
          Value: userData.firstName + ' ' + userData.lastName,
        },
      ];

      // Add phone number if provided
      if (userData.phoneNumber) {
        userAttributes.push({
          Name: 'phone_number',
          Value: userData.phoneNumber,
        });
      }

      // Prepare sign-up command
      const signUpParams: SignUpCommandInput = {
        ClientId: this.CLIENT_ID,
        Username: userData.email,
        Password: userData.password,
        UserAttributes: userAttributes,
      };

      // Execute sign-up command
      const command = new SignUpCommand(signUpParams);
      const response = await this.cognitoClient.send(command);

      return {
        success: true,
        message:
          'User registered successfully. Please check your email for verification.',
        userId: response.UserSub,
      };
    } catch (error) {
      // Handle specific AWS Cognito errors
      if (error instanceof Error) {
        switch (error.name) {
          case 'UsernameExistsException':
            throw new ServiceError(
              'Email address is already registered',
              'RegistrationError'
            );
          case 'InvalidPasswordException':
            throw new ServiceError(
              'Password does not meet requirements',
              'RegistrationError'
            );
          case 'InvalidParameterException':
            throw new ServiceError(
              'Invalid parameters provided',
              'RegistrationError'
            );
          default:
            throw new ServiceError(
              `Registration failed: ${error.message}`,
              'RegistrationError'
            );
        }
      }
      // Handle unexpected errors
      throw new ServiceError(
        'An unexpected error occurred during registration',
        'RegistrationError'
      );
    }
  }

  /**
   * Confirm user registration with verification code
   */
  async confirmRegistration(
    email: string,
    code: string
  ): Promise<CognitoResponse> {
    try {
      console.log('email', email, '  code', code);

      const command = new ConfirmSignUpCommand({
        ClientId: this.CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: 'Email verification successful. You can now sign in.',
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'CodeMismatchException':
            throw new ServiceError(
              'Invalid verification code',
              'VerificationError'
            );
          case 'ExpiredCodeException':
            throw new ServiceError(
              'Verification code has expired',
              'VerificationError'
            );
          case 'UserNotFoundException':
            throw new ServiceError('User not found', 'VerificationError');
          default:
            throw new ServiceError(
              `Verification failed: ${error.message}`,
              'VerificationError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred during verification',
        'VerificationError'
      );
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<CognitoResponse> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.CLIENT_ID,
        Username: email,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: 'Verification code has been resent to your email.',
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'UserNotFoundException':
            throw new ServiceError('User not found', 'ResendOTPError');
          case 'LimitExceededException':
            throw new ServiceError(
              'Too many attempts. Please try again later.',
              'ResendOTPError'
            );
          default:
            throw new ServiceError(
              `Failed to resend code: ${error.message}`,
              'ResendOTPError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred while resending verification code',
        'ResendOTPError'
      );
    }
  }

  /**
   * Verify user attribute (like phone number) after registration
   */
  async verifyUserAttribute(
    accessToken: string,
    attributeName: string,
    code: string
  ): Promise<CognitoResponse> {
    try {
      const command = new VerifyUserAttributeCommand({
        AccessToken: accessToken,
        AttributeName: attributeName,
        Code: code,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: `${attributeName} verification successful.`,
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'CodeMismatchException':
            throw new ServiceError(
              'Invalid verification code',
              'VerifyAttributeError'
            );
          case 'ExpiredCodeException':
            throw new ServiceError(
              'Verification code has expired',
              'VerifyAttributeError'
            );
          default:
            throw new ServiceError(
              `Attribute verification failed: ${error.message}`,
              'VerifyAttributeError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred during attribute verification',
        'VerifyAttributeError'
      );
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<CognitoResponse> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.CLIENT_ID,
        Username: email,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: 'Password reset code has been sent to your email.',
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'UserNotFoundException':
            throw new ServiceError('User not found', 'UserNotFoundError');
          case 'LimitExceededException':
            throw new ServiceError(
              'Too many attempts. Please try again later.',
              'PasswordResetError'
            );
          default:
            throw new ServiceError(
              `Failed to initiate password reset: ${error.message}`,
              'PasswordResetError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred while requesting password reset',
        'PasswordResetError'
      );
    }
  }
  /**
   * Complete forgot password flow
   */
  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<CognitoResponse> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: 'Password has been reset successfully.',
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'CodeMismatchException':
            throw new ServiceError(
              'Invalid verification code',
              'PasswordResetError'
            );
          case 'ExpiredCodeException':
            throw new ServiceError(
              'Verification code has expired',
              'PasswordResetError'
            );
          case 'InvalidPasswordException':
            throw new ServiceError(
              'Password does not meet requirements',
              'PasswordResetError'
            );
          default:
            throw new ServiceError(
              `Failed to reset password: ${error.message}`,
              'PasswordResetError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred while resetting password',
        'PasswordResetError'
      );
    }
  }

  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string): Promise<SignInResponse> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.cognitoClient.send(command);
      const authResult = response.AuthenticationResult;

      if (!authResult) {
        throw new Error('Authentication failed');
      }

      return {
        success: true,
        message: 'Successfully signed in',
        accessToken: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        idToken: authResult.IdToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAuthorizedException':
            throw new ServiceError(
              'Incorrect username or password',
              'AuthenticationError'
            );
          case 'UserNotConfirmedException':
            throw new ServiceError(
              'Please verify your email address',
              'AuthenticationError'
            );
          case 'UserNotFoundException':
            throw new ServiceError(
              'No account found with this email',
              'AuthenticationError'
            );
          case 'TooManyRequestsException':
            throw new ServiceError(
              'Too many sign-in attempts. Please try again later',
              'AuthenticationError'
            );
          default:
            throw new ServiceError(
              `Sign-in failed: ${error.message}`,
              'AuthenticationError'
            );
        }
      }
      throw new ServiceError(
        'An unexpected error occurred during sign-in',
        'AuthenticationError'
      );
    }
  }

  private validateUserInput(userData: RegisterUserInput): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ServiceError('Invalid email format', 'RegistrationError');
    }

    // Password validation (customize as per your requirements)
    if (userData.password.length < 8) {
      throw new ServiceError(
        'Password must be at least 8 characters long',
        'RegistrationError'
      );
    }

    // Name validation
    if (!userData.firstName || !userData.lastName) {
      throw new ServiceError(
        'First name and last name are required',
        'RegistrationError'
      );
    }

    // Phone number validation (if provided)
    if (userData.phoneNumber) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(userData.phoneNumber)) {
        throw new ServiceError(
          'Invalid phone number format',
          'RegistrationError'
        );
      }
    }
  }
}
