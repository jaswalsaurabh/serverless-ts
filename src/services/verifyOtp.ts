import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoAuthService, ServiceError } from '../common/CognitoService';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { ResponseHandler } from '../common/ResponseHandler';

const baseHandler = async (event: APIGatewayProxyEvent) => {
  const authService = new CognitoAuthService();
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('this is body', body);

    const result = await authService.confirmRegistration(body.email, body.code);
    console.log('this is result %j', result);
    return ResponseHandler.success(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      console.error('Registration failed:', error.message);
      return ResponseHandler.error(error.message, 400, 'REGISTRATION_FAILED');
    } else {
      console.error('Unexpected error:', error);
      return ResponseHandler.error(
        'An unexpected error occurred',
        500,
        'INTERNAL_SERVER_ERROR',
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  }
};

export const handler = middy(baseHandler).use(cors());
