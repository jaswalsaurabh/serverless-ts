import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ServiceError } from './CognitoService';
import { Readable } from 'stream';

export interface S3UploadResponse {
  success: boolean;
  message: string;
  key?: string;
  url?: string;
}

export interface S3ListResponse {
  success: boolean;
  files: Array<{
    key: string;
    size: number;
    lastModified: Date;
    url?: string;
  }>;
}

export class S3Service {
  private s3Client: S3Client;
  private readonly BUCKET_NAME: string;
  private readonly REGION: string;

  constructor() {
    this.REGION = process.env.REGION || 'us-east-1';
    this.BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

    if (!this.BUCKET_NAME) {
      throw new Error('S3 Bucket name must be configured');
    }

    this.s3Client = new S3Client({
      region: this.REGION,
    });
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: Buffer | Readable | string,
    key: string,
    contentType?: string
  ): Promise<S3UploadResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'File uploaded successfully',
        key: key,
        url: `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${key}`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to upload file: ${error.message}`,
          'S3UploadError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred during file upload',
        'S3UploadError'
      );
    }
  }

  /**
   * Generate a pre-signed URL for file upload
   */
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to generate upload URL: ${error.message}`,
          'S3PreSignError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred while generating upload URL',
        'S3PreSignError'
      );
    }
  }

  /**
   * Download a file from S3
   */
  async downloadFile(key: string): Promise<GetObjectCommandOutput> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      return await this.s3Client.send(command);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to download file: ${error.message}`,
          'S3DownloadError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred during file download',
        'S3DownloadError'
      );
    }
  }

  /**
   * Generate a pre-signed URL for file download
   */
  async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to generate download URL: ${error.message}`,
          'S3PreSignError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred while generating download URL',
        'S3PreSignError'
      );
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<S3UploadResponse> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'File deleted successfully',
        key: key,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to delete file: ${error.message}`,
          'S3DeleteError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred during file deletion',
        'S3DeleteError'
      );
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix?: string): Promise<S3ListResponse> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);

      const files =
        response.Contents?.map((item) => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          url: `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${item.Key}`,
        })) || [];

      return {
        success: true,
        files,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to list files: ${error.message}`,
          'S3ListError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred while listing files',
        'S3ListError'
      );
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      throw new ServiceError(
        'An error occurred while checking file existence',
        'S3CheckError'
      );
    }
  }

  /**
   * Create a new bucket
   */
  async createBucket(bucketName: string): Promise<S3UploadResponse> {
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'Bucket created successfully',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to create bucket: ${error.message}`,
          'S3BucketError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred while creating bucket',
        'S3BucketError'
      );
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(bucketName: string): Promise<S3UploadResponse> {
    try {
      const command = new DeleteBucketCommand({
        Bucket: bucketName,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'Bucket deleted successfully',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to delete bucket: ${error.message}`,
          'S3BucketError'
        );
      }
      throw new ServiceError(
        'An unexpected error occurred while deleting bucket',
        'S3BucketError'
      );
    }
  }
}
