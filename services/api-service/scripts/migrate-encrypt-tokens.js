#!/usr/bin/env node

/**
 * Migration Script: Encrypt existing GitHub tokens
 *
 * This script encrypts all plaintext GitHub tokens in the database.
 * Run this ONCE after deploying the encryption changes.
 *
 * Usage:
 *   node scripts/migrate-encrypt-tokens.js
 *
 * Prerequisites:
 *   - ENCRYPTION_KEY must be set in .env
 *   - Database must be accessible
 */

require('dotenv').config();
const { Pool } = require('pg');
const { encrypt, isEncrypted } = require('../src/utils/encryption');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateTokens() {
  console.log('🔐 Starting GitHub token encryption migration...\n');

  try {
    // Validate encryption key exists
    if (!process.env.ENCRYPTION_KEY) {
      console.error('❌ ENCRYPTION_KEY environment variable is required');
      console.error('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      process.exit(1);
    }

    // Get all users with GitHub tokens
    const result = await pool.query(
      'SELECT id, github_username, github_token FROM users WHERE github_token IS NOT NULL'
    );

    const users = result.rows;

    if (users.length === 0) {
      console.log('✅ No users found with GitHub tokens. Nothing to migrate.');
      return;
    }

    console.log(`Found ${users.length} users with GitHub tokens\n`);

    let encrypted = 0;
    let alreadyEncrypted = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Check if token is already encrypted
        if (isEncrypted(user.github_token)) {
          console.log(`⏭️  User ${user.github_username} (ID: ${user.id}): Already encrypted`);
          alreadyEncrypted++;
          continue;
        }

        // Encrypt the token
        const encryptedToken = encrypt(user.github_token);

        // Update database
        await pool.query(
          'UPDATE users SET github_token = $1, updated_at = NOW() WHERE id = $2',
          [encryptedToken, user.id]
        );

        console.log(`✅ User ${user.github_username} (ID: ${user.id}): Token encrypted`);
        encrypted++;

      } catch (error) {
        console.error(`❌ User ${user.github_username} (ID: ${user.id}): Failed - ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total users:          ${users.length}`);
    console.log(`Newly encrypted:      ${encrypted}`);
    console.log(`Already encrypted:    ${alreadyEncrypted}`);
    console.log(`Failed:               ${failed}`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log('\n⚠️  Some tokens failed to encrypt. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrateTokens();
