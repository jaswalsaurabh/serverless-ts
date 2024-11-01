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
    const queryParams = event.queryStringParameters || {};
    console.log('queryparams', queryParams);
    const searchTerm = queryParams.search || '';
    const searchResults = await Bus.aggregate([
      {
        $unwind: '$routeInfo',
      },
      {
        $match: {
          'routeInfo.placeName': { $regex: new RegExp(searchTerm, 'i') },
        },
      },
      {
        $group: {
          _id: '$routeInfo.placeName',
          routeInfo: { $first: '$routeInfo' },
          routeId: { $first: '$_id' },
        },
      },
    ]);
    return ResponseHandler.success(searchResults);
  } catch (error) {
    console.error('Error in autoCompletePlaces function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(baseHandler).use(cors());
