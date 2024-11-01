import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToMongoDB } from '../config/db';
import { ResponseHandler } from '../common/ResponseHandler';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { Bus } from '../models/Bus';

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();
    const body = JSON.parse(event.body ?? '{}');
    const route = new Bus(body);
    const savedRoute = await route.save();
    return ResponseHandler.success(savedRoute, 201);
  } catch (error) {
    console.error('Error in createBus function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(baseHandler).use(cors());
