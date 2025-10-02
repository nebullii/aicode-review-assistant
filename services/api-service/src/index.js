const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./config/database');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount auth routes
app.use('/auth', authRoutes);

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

// Test endpoint
app.get('/db/test', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Service running on port ${PORT}`);
});