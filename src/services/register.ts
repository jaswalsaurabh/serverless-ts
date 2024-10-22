import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoAuthService, RegistrationError } from '../common/AuthService';
import middy from '@middy/core';
import cors from '@middy/http-cors';

const baseHandler = async (event: APIGatewayProxyEvent) => {
  const authService = new CognitoAuthService();
  try {
    const body = JSON.parse(event.body || '{}');
    const result = await authService.registerUser({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });
    console.log('this is result %j', result);
    return result;
  } catch (error) {
    if (error instanceof RegistrationError) {
      console.error('Registration failed:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
};

export const handler = middy(baseHandler).use(cors());
