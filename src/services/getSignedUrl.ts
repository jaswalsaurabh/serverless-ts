import { APIGatewayProxyEvent } from 'aws-lambda';
import { S3Service } from '../common/S3Service';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { ResponseHandler } from '../common/ResponseHandler';
import { CONSTANTS } from '../config/CONSTANTS';
import { ServiceError } from '../common/CognitoService';

interface SignedUrlRequest {
  fileName: string;
  contentType: string;
  operation: 'upload' | 'download';
  expiresIn?: number;
}

const generateSignedUrlHandler = async (event: APIGatewayProxyEvent) => {
  const s3Service = new S3Service();

  try {
    // Parse and validate request body
    const body: SignedUrlRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.fileName || !body.contentType || !body.operation) {
      return ResponseHandler.error(
        'Missing required fields: fileName, contentType, and operation are required',
        400,
        CONSTANTS.errorTypes.INPUT_VALIDATION
      );
    }

    // Generate a unique key for the file
    // You might want to customize this based on your needs
    const fileKey = `${Date.now()}-${body.fileName}`;

    let signedUrl: string;

    // Generate appropriate signed URL based on operation
    if (body.operation === 'upload') {
      signedUrl = await s3Service.getSignedUploadUrl(
        fileKey,
        body.contentType,
        body.expiresIn
      );
    } else {
      // Check if file exists before generating download URL
      const fileExists = await s3Service.fileExists(fileKey);
      if (!fileExists) {
        return ResponseHandler.error(
          'File not found',
          404,
          CONSTANTS.errorTypes.ENTITY_NOT_FOUND
        );
      }
      signedUrl = await s3Service.getSignedDownloadUrl(fileKey, body.expiresIn);
    }

    return ResponseHandler.success({
      url: signedUrl,
      key: fileKey,
      expiresIn: body.expiresIn || 3600,
      operation: body.operation,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      console.error('Failed to generate signed URL:', error.message);
      return ResponseHandler.error(
        error.message,
        400,
        CONSTANTS.errorTypes.S3_ERROR
      );
    } else {
      console.error('Unexpected error:', error);
      return ResponseHandler.error(
        'An unexpected error occurred',
        500,
        CONSTANTS.errorTypes.INTERNAL_SERVER_ERROR,
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  }
};

export const handler = middy(generateSignedUrlHandler).use(cors());
