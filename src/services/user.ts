import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import cors from '@middy/http-cors';

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'This is protected route',
      event,
      author: 'Jaswal',
      updatedAt: new Date().toLocaleTimeString(),
    }),
  };
};

export const handler = middy(baseHandler).use(cors());
