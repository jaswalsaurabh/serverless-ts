import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "middy";
import { cors } from "middy/middlewares";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v4.0! Your function executed successfully!",
      event,
    }),
  };
};

export const hello = middy(baseHandler).use(cors());
