import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import cors from '@middy/http-cors';

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v4.0! Your function executed successfully!',
      event,
      author: 'Jaswal',
      updatedAt: '10:57',
    }),
  };
};

export const handler = middy(baseHandler).use(cors());
