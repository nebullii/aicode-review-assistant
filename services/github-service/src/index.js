const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'github-service' 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'GitHub Integration Service',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`GitHub Service running on port ${PORT}`);
});