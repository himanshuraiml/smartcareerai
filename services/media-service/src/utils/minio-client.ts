import { Client } from 'minio';
import * as fs from 'fs';
import { logger } from './logger';

let minioClient: Client | null = null;

export const MEETINGS_BUCKET = process.env.MINIO_BUCKET || 'meetings';

export function getMinioClient(): Client {
    if (!minioClient) {
        const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = parseInt(process.env.MINIO_PORT || '9000', 10);
        const useSSL = process.env.MINIO_USE_SSL === 'true';
        const accessKey = process.env.MINIO_ACCESS_KEY;
        const secretKey = process.env.MINIO_SECRET_KEY;

        if (!accessKey || !secretKey) {
            throw new Error('MINIO_ACCESS_KEY or MINIO_SECRET_KEY is not defined');
        }

        minioClient = new Client({ endPoint, port, useSSL, accessKey, secretKey });
    }
    return minioClient;
}

export async function initMinioBucket(): Promise<void> {
    try {
        const client = getMinioClient();
        const exists = await client.bucketExists(MEETINGS_BUCKET);
        if (!exists) {
            await client.makeBucket(MEETINGS_BUCKET);
            logger.info(`Created MinIO bucket: ${MEETINGS_BUCKET}`);
        }
    } catch (err) {
        logger.error('Failed to init MinIO bucket:', err);
    }
}

export async function uploadFile(objectKey: string, filePath: string): Promise<void> {
    const client = getMinioClient();
    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);
    await client.putObject(MEETINGS_BUCKET, objectKey, stream, stat.size);
    logger.info(`Uploaded to MinIO: ${objectKey}`);
}

export async function getPresignedUrl(objectKey: string, expirySeconds = 7 * 24 * 60 * 60): Promise<string> {
    const client = getMinioClient();
    return client.presignedGetObject(MEETINGS_BUCKET, objectKey, expirySeconds);
}
