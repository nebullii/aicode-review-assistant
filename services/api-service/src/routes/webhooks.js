const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get recent webhook events for user's repositories
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
      FROM webhook_events we
      JOIN repositories r ON we.repository_id = r.id
      WHERE r.user_id = $1`,
      [userId]
    );

    // Get paginated events
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
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      events: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
});

module.exports = router;
