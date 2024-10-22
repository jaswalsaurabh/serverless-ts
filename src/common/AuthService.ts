import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterUserInput, RegisterUserResponse } from '../@types/authTypes';

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistrationError';
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
  ): Promise<RegisterUserResponse> {
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
          Name: 'given_name',
          Value: userData.firstName,
        },
        {
          Name: 'family_name',
          Value: userData.lastName,
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
            throw new RegistrationError('Email address is already registered');
          case 'InvalidPasswordException':
            throw new RegistrationError('Password does not meet requirements');
          case 'InvalidParameterException':
            throw new RegistrationError('Invalid parameters provided');
          default:
            throw new RegistrationError(
              `Registration failed: ${error.message}`
            );
        }
      }
      // Handle unexpected errors
      throw new RegistrationError(
        'An unexpected error occurred during registration'
      );
    }
  }

  private validateUserInput(userData: RegisterUserInput): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new RegistrationError('Invalid email format');
    }

    // Password validation (customize as per your requirements)
    if (userData.password.length < 8) {
      throw new RegistrationError(
        'Password must be at least 8 characters long'
      );
    }

    // Name validation
    if (!userData.firstName || !userData.lastName) {
      throw new RegistrationError('First name and last name are required');
    }

    // Phone number validation (if provided)
    if (userData.phoneNumber) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(userData.phoneNumber)) {
        throw new RegistrationError('Invalid phone number format');
      }
    }
  }
}
