import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToMongoDB } from '../config/db';
import { Bus } from '../models/Bus';
import { ResponseHandler } from '../common/ResponseHandler';
import middy from '@middy/core';
import cors from '@middy/http-cors';

export const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const pathParams = event.pathParameters || {};
    const routeId = pathParams.serviceId || '';
    await connectToMongoDB();
    const routes = await Bus.findOne({ busNumber: routeId });
    return ResponseHandler.success(routes);
  } catch (error) {
    console.error('Error in getBusByServiceId function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(baseHandler).use(cors());
