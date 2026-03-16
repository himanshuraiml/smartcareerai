import { Client } from 'minio';
import { logger } from './logger';

let minioClient: Client | null = null;

function getMinioClient(): Client {
    if (!minioClient) {
        const accessKey = process.env.MINIO_ACCESS_KEY;
        const secretKey = process.env.MINIO_SECRET_KEY;
        if (!accessKey || !secretKey) {
            throw new Error('MINIO_ACCESS_KEY or MINIO_SECRET_KEY not configured');
        }
        minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey,
            secretKey,
        });
    }
    return minioClient;
}

export async function ensureBucket(bucketName: string): Promise<void> {
    const client = getMinioClient();
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
        await client.makeBucket(bucketName);
        logger.info(`Created MinIO bucket: ${bucketName}`);
    }
}

export async function uploadBuffer(
    bucketName: string,
    key: string,
    buffer: Buffer,
    mimeType: string,
): Promise<void> {
    const client = getMinioClient();
    await ensureBucket(bucketName);
    await client.putObject(bucketName, key, buffer, buffer.length, {
        'Content-Type': mimeType,
    });
}

export async function getPresignedUrl(
    bucketName: string,
    key: string,
    expirySeconds = 3600,
): Promise<string> {
    const client = getMinioClient();
    return client.presignedGetObject(bucketName, key, expirySeconds);
}
