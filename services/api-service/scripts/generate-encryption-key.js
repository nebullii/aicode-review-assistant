#!/usr/bin/env node

/**
 * Generate Encryption Key
 *
 * Generates a secure 256-bit (32 byte) encryption key for AES-256-GCM
 *
 * Usage:
 *   node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('='.repeat(70));
console.log('  Generated Encryption Key for AES-256-GCM');
console.log('='.repeat(70));
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('');
console.log('1. Keep this key SECRET - never commit to Git');
console.log('2. Store in secure vault in production (AWS Secrets Manager, etc.)');
console.log('3. Backup this key securely - losing it means losing access to data');
console.log('4. Never share this key via email, Slack, or insecure channels');
console.log('5. Use different keys for dev/staging/production');
console.log('');
console.log('='.repeat(70));
console.log('');
