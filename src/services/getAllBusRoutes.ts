import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToMongoDB } from '../config/db';
import { Bus } from '../models/Bus';
import { ResponseHandler } from '../common/ResponseHandler';
import middy from '@middy/core';
import cors from '@middy/http-cors';

export const baseHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();
    const routes = await Bus.find().populate('routeInfo');
    return ResponseHandler.success(routes);
  } catch (error) {
    console.error('Error in getAllBus function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(baseHandler).use(cors());
