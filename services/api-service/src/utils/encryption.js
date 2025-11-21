const crypto = require('crypto');

/**
 * Encryption utility for sensitive data (GitHub tokens, etc.)
 * Uses AES-256-GCM for authenticated encryption
 *
 * IMPORTANT: Set ENCRYPTION_KEY in environment variables
 * Generate key with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 16 bytes for AES
const AUTH_TAG_LENGTH = 16;  // 16 bytes for GCM auth tag

/**
 * Get encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (key.length !== 64) {  // 32 bytes = 64 hex characters
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value
 * @param {string} plaintext - The value to encrypt
 * @returns {string} Format: iv:authTag:encrypted (all hex-encoded)
 */
function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - Format: iv:authTag:encrypted
 * @returns {string} Original plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }

  try {
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: iv:authTag:encrypted');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Check if a value is encrypted (has correct format)
 * @param {string} value - Value to check
 * @returns {boolean} True if value appears to be encrypted
 */
function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const parts = value.split(':');
  return parts.length === 3 &&
         parts[0].length === IV_LENGTH * 2 &&  // IV is 16 bytes = 32 hex chars
         parts[1].length === AUTH_TAG_LENGTH * 2;  // Auth tag is 16 bytes = 32 hex chars
}

/**
 * Generate a new encryption key (for setup)
 * @returns {string} 64-character hex string (32 bytes)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  generateEncryptionKey
};
