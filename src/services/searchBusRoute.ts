import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToMongoDB } from '../config/db';
import { getBusByRoute } from '../common/BusService';
import { ResponseHandler } from '../common/ResponseHandler';
import middy from '@middy/core';
import cors from '@middy/http-cors';

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();
    const { from, to } = JSON.parse(event.body ?? '{}');
    const buses = await getBusByRoute(
      from.trim().toUpperCase(),
      to.trim().toUpperCase()
    );
    return ResponseHandler.success(buses);
  } catch (error) {
    console.error('Error in searchBus function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(baseHandler).use(cors());
