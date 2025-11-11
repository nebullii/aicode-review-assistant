const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const axios = require('axios');

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

// Get all PR analysis reports for the authenticated user
router.get('/pr-analyses', authenticateToken, async (req, res) => {
  try {
    const { repository_id, status, limit = 50, offset = 0 } = req.query;

    // Build dynamic query
    let query = `
      SELECT
        a.id,
        a.pr_number,
        a.pr_url,
        a.status,
        a.started_at,
        a.completed_at,
        EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) as processing_time_seconds,
        r.id as repository_id,
        r.full_name as repository_name,
        r.name as repo_short_name
      FROM analysis a
      JOIN repositories r ON a.repository_id = r.id
      WHERE r.user_id = $1
    `;

    const queryParams = [req.user.user_id];
    let paramIndex = 2;

    // Add optional filters
    if (repository_id) {
      query += ` AND r.id = $${paramIndex}`;
      queryParams.push(repository_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM analysis a
      JOIN repositories r ON a.repository_id = r.id
      WHERE r.user_id = $1
    `;
    const countParams = [req.user.user_id];
    let countParamIndex = 2;

    if (repository_id) {
      countQuery += ` AND r.id = $${countParamIndex}`;
      countParams.push(repository_id);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND a.status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      analyses: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching PR analyses:', error);
    res.status(500).json({
      error: 'Failed to fetch PR analyses',
      details: error.message
    });
  }
});

// Get detailed analysis for a specific PR (including vulnerabilities from MongoDB)
router.get('/pr-analyses/:analysisId', authenticateToken, async (req, res) => {
  try {
    const { analysisId } = req.params;

    // Get analysis record from PostgreSQL
    const analysisResult = await pool.query(
      `SELECT
        a.id,
        a.pr_number,
        a.pr_url,
        a.status,
        a.started_at,
        a.completed_at,
        EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) as processing_time_seconds,
        r.id as repository_id,
        r.full_name as repository_name,
        r.github_id as repository_github_id
      FROM analysis a
      JOIN repositories r ON a.repository_id = r.id
      WHERE a.id = $1 AND r.user_id = $2`,
      [analysisId, req.user.user_id]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis = analysisResult.rows[0];

    // Get vulnerability details from analysis-service (MongoDB)
    const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://analysis-service:8001';

    try {
      const vulnerabilitiesResponse = await axios.get(
        `${ANALYSIS_SERVICE_URL}/api/analysis/pr/${analysis.repository_name}/${analysis.pr_number}`
      );

      analysis.vulnerabilities = vulnerabilitiesResponse.data.vulnerabilities || [];
      analysis.severity_counts = vulnerabilitiesResponse.data.severity_counts || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      analysis.total_vulnerabilities = vulnerabilitiesResponse.data.total_vulnerabilities || 0;
    } catch (mongoError) {
      console.error('Failed to fetch vulnerabilities from MongoDB:', mongoError.message);
      // Return analysis without vulnerability details if MongoDB fetch fails
      analysis.vulnerabilities = [];
      analysis.severity_counts = { critical: 0, high: 0, medium: 0, low: 0 };
      analysis.total_vulnerabilities = 0;
      analysis.vulnerability_fetch_error = 'Could not retrieve vulnerability details';
    }

    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error fetching analysis details:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis details',
      details: error.message
    });
  }
});

// Get summary statistics for reports dashboard
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    // Get total analyses count
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM analysis a
       JOIN repositories r ON a.repository_id = r.id
       WHERE r.user_id = $1`,
      [req.user.user_id]
    );

    // Get completed analyses count
    const completedResult = await pool.query(
      `SELECT COUNT(*) as completed
       FROM analysis a
       JOIN repositories r ON a.repository_id = r.id
       WHERE r.user_id = $1 AND a.status = 'completed'`,
      [req.user.user_id]
    );

    // Get failed analyses count
    const failedResult = await pool.query(
      `SELECT COUNT(*) as failed
       FROM analysis a
       JOIN repositories r ON a.repository_id = r.id
       WHERE r.user_id = $1 AND a.status = 'failed'`,
      [req.user.user_id]
    );

    // Get recent analyses (last 7 days)
    const recentResult = await pool.query(
      `SELECT COUNT(*) as recent
       FROM analysis a
       JOIN repositories r ON a.repository_id = r.id
       WHERE r.user_id = $1 AND a.started_at >= NOW() - INTERVAL '7 days'`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      summary: {
        total_analyses: parseInt(totalResult.rows[0].total),
        completed: parseInt(completedResult.rows[0].completed),
        failed: parseInt(failedResult.rows[0].failed),
        recent_7_days: parseInt(recentResult.rows[0].recent)
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Failed to fetch summary',
      details: error.message
    });
  }
});

module.exports = router;
