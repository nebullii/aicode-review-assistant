const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const webhookRoutes = require('./routes/webhooks');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('✓ All required environment variables are set');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());

// Don't use express.json() globally - webhook route needs raw body
// The webhook route handles its own body parsing
app.use((req, res, next) => {
  if (req.path === '/webhooks/github') {
    next(); // Let webhook route handle raw body
  } else {
    express.json()(req, res, next);
  }
});

// Mount routes
app.use('/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'github-service',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`GitHub Service running on port ${PORT}`);
});