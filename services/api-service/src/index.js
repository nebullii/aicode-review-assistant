const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');
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
const metricsRegister = new client.Registry();

// Prometheus metrics: default system metrics + HTTP duration histogram
client.collectDefaultMetrics({ register: metricsRegister });
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
metricsRegister.registerMetric(httpRequestDurationSeconds);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Record HTTP durations for RED metrics
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [s, ns] = process.hrtime(start);
    const durationSeconds = s + ns / 1e9;
    const path = req.route?.path || req.path || 'unknown';
    httpRequestDurationSeconds
      .labels(req.method, path, res.statusCode)
      .observe(durationSeconds);
  });
  next();
});

// Prometheus metrics
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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
