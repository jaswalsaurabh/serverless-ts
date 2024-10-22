import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  SignUpCommand,
  SignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { AuthServiceResponse, RegisterUserInput } from '../@types/authTypes';

type ServiceErrorType = 'RegistrationError' | 'VerificationError';
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

  async registerUser(
    userData: RegisterUserInput
  ): Promise<AuthServiceResponse> {
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
  ): Promise<AuthServiceResponse> {
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
