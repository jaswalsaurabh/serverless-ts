import middy from '@middy/core';
import { ResponseHandler } from '../common/ResponseHandler';
import { S3Service } from '../common/S3Service';
const DELETE_AFTER_MINUTES = Number(process.env.DELETE_AFTER_MINUTES || 0);
const bucketName = process.env.S3_BUCKET_NAME;

const cleanUpOldObjects = async () => {
  // TODO: implement cleanup logic
  try {
    const s3Service = new S3Service(bucketName);
    const response = await s3Service.listFiles();

    if (!response.files || response.files.length === 0) {
      console.log('No objects found in bucket');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No objects to process' }),
      };
    }

    const deleteThreshold = new Date();
    deleteThreshold.setMinutes(
      deleteThreshold.getMinutes() - DELETE_AFTER_MINUTES
    );

    const deletePromises = response.files
      .filter((obj) => obj.lastModified && obj.lastModified < deleteThreshold)
      .map(async (obj) => {
        if (!obj.key) return;
        console.log(`Deleting object: ${obj.key}`);
        return await s3Service.deleteFile(obj.key);
      });

    await Promise.all(deletePromises);
    return ResponseHandler.success(
      {
        message: `Cleanup completed. Processed ${response.files.length} objects`,
      },
      200
    );
  } catch (error) {
    console.error('Error in cleanUpOldObjects function:', error);
    return ResponseHandler.error(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
};

export const handler = middy(cleanUpOldObjects);
