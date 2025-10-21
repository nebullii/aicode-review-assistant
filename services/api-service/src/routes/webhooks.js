const express = require('express');
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get recent webhook events for user's repositories
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT
        we.id,
        we.event_type,
        we.action,
        we.pr_number,
        we.pr_title,
        we.pr_url,
        we.sender_username,
        we.received_at,
        r.full_name as repository_name
      FROM webhook_events we
      JOIN repositories r ON we.repository_id = r.id
      WHERE r.user_id = $1
      ORDER BY we.received_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
});

module.exports = router;
