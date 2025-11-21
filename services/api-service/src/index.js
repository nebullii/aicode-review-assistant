const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./config/database');
const authRoutes = require('./routes/auth');
const repositoryRoutes = require('./routes/repositories');
const webhookRoutes = require('./routes/webhooks');
const reportRoutes = require('./routes/reports');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('✓ All required environment variables are set');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount auth routes
app.use('/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      service: 'api-service',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      service: 'api-service',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CodeSentry API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/github',
      me: '/auth/me',
      repositories: '/api/repositories'
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`API Service running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process - just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process - just log the error
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});