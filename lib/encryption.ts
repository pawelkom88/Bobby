/**
 * Encryption utilities for secure session storage
 *
 * Uses Node.js crypto module for AES-256-GCM encryption
 * This ensures session data is encrypted at rest
 */

import 'server-only';

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { logger } from '@/lib/logger';

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const SALT = 'bobby-session-salt'; // In production, use a random salt stored securely

/**
 * Derive encryption key from the environment variable
 */
function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    logger.error('[encryption] SESSION_ENCRYPTION_KEY is NOT SET!');
    throw new Error('SESSION_ENCRYPTION_KEY environment variable is not set');
  }

  // Derive a 32-byte key from the provided key using scrypt
  return scryptSync(ENCRYPTION_KEY, SALT, 32);
}

/**
 * Encrypt data
 * Returns a string containing: iv:authTag:encryptedData (all base64 encoded)
 */
export async function encrypt(data: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16); // Initialization vector

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encryptedData (all base64 for safe transmission)
    const result = [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted,
    ].join(':');

    return result;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data
 * Expects input in format: iv:authTag:encryptedData
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
