const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for Render
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  // Don't crash the process - let the pool handle reconnection
});

// Test database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Database pool initialized');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    // Don't exit - let the service start and retry connections as needed
  }
})();

module.exports = { pool };