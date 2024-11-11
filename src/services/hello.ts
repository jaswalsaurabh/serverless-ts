import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { ResponseHandler } from '../common/ResponseHandler';

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const result = {
    statusCode: 200,
    data: {
      message: 'Go Serverless v4.0! Your function executed successfully!',
      event,
      author: 'Anku Jaswal',
      updatedAt: '10:57',
    },
  };
  return ResponseHandler.success(result);
};

export const handler = middy(baseHandler).use(cors());
