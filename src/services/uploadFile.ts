import { APIGatewayProxyEvent } from 'aws-lambda';
import { ResponseHandler } from '../common/ResponseHandler';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { S3Service } from '../common/S3Service';
import { parse } from 'lambda-multipart-parser';
const s3Bucket = process.env.BUCKET_NAME;

// Initialize S3 client

const uploadHandler = async (event: APIGatewayProxyEvent) => {
  try {
    // Check for content-type to validate the request
    console.log('this is event', event);

    // Promise wrapper to handle the busboy stream parsing
    const s3Service = new S3Service();
    // const key = `${Date.now()}-${}`
    // s3Service.uploadFile(body, event.queryStringParameters.key, contentType)

    // // Parse and upload file
    const result = await parse(event);

    const key = `${Date.now()}-${result.files[0].filename}`;

    await s3Service.uploadFile(
      result.files[0].content,
      key,
      result.files[0].contentType
    );

    // Successful upload response
    const response = {
      statusCode: 200,
      data: {
        message: 'File uploaded successfully',
        key: key,
        size: result.files[0].content.length,
      },
    };
    return ResponseHandler.success(response);
  } catch (error) {
    console.error('Upload error:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(uploadHandler).use(cors());
