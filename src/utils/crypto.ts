import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

function getKey(secret: string): Buffer {
  // Ensure key is exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plain text string using AES-256-CBC.
 * Returns a string in the format: iv:encryptedData (both hex-encoded)
 */
export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(secret);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt an AES-256-CBC encrypted string produced by `encrypt()`.
 */
export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getKey(secret);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Generate a deterministic HMAC-SHA256 hash of a value.
 * Used for indexed lookups without storing the plain value.
 */
export function hmacHash(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value.toLowerCase()).digest('hex');
}
