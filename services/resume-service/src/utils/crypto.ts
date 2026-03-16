import crypto from 'crypto';
import { logger } from './logger';

/**
 * Advanced Document Encryption/Decryption Utility
 * Uses AES-256-GCM for robust security with integrity checks
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Encryption key must be exactly 32 bytes for AES-256
let ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || 'default-fixed-key-placeholder-32';
ENCRYPTION_KEY = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);

/**
 * Encrypts a buffer
 */
export function encrypt(buffer: Buffer): Buffer {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Pack: IV (12b) + AuthTag (16b) + EncryptedData
        return Buffer.concat([iv, authTag, encrypted]);
    } catch (error) {
        logger.error('Encryption failed', error);
        throw new Error('Failed to encrypt document');
    }
}

/**
 * Decrypts a buffer. Falls back to returning the raw buffer for legacy
 * unencrypted files uploaded before encryption was introduced.
 */
export function decrypt(buffer: Buffer): Buffer {
    try {
        // Unpack: IV (12b) + AuthTag (16b) + EncryptedData
        const iv = buffer.subarray(0, IV_LENGTH);
        const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encryptedData = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (error) {
        // Legacy files stored before encryption was added — return as-is
        logger.warn('Decryption failed, returning raw buffer (likely a pre-encryption file)');
        return buffer;
    }
}
