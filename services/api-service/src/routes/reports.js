const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const { DEFAULT_SEVERITY_COUNTS, DEFAULT_STYLE_CATEGORIES } = require('../constants/defaults');

const router = express.Router();

// Get all PR analysis reports for the authenticated user
router.get('/pr-analyses', authenticateToken, async (req, res) => {
  try {
    const { repository_id, status, limit = 50, offset = 0 } = req.query;

    // Validate repository_id is a valid UUID format if provided
    if (repository_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(repository_id)) {
        return res.status(400).json({
          error: 'Invalid repository ID format',
          details: 'Repository ID must be a valid UUID'
        });
      }
    }

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
        `${ANALYSIS_SERVICE_URL}/api/analysis/pr/${analysis.pr_number}`,
        {
          params: {
            repository: analysis.repository_name
          }
        }
      );

      analysis.vulnerabilities = vulnerabilitiesResponse.data.vulnerabilities || [];
      analysis.style_issues = vulnerabilitiesResponse.data.style_issues || [];
      analysis.severity_counts = vulnerabilitiesResponse.data.severity_counts || DEFAULT_SEVERITY_COUNTS;
      analysis.style_categories = vulnerabilitiesResponse.data.style_categories || DEFAULT_STYLE_CATEGORIES;
      analysis.total_vulnerabilities = vulnerabilitiesResponse.data.total_vulnerabilities || 0;
      analysis.total_style_issues = vulnerabilitiesResponse.data.total_style_issues || 0;
      analysis.files_analyzed = vulnerabilitiesResponse.data.files_analyzed || 0;
    } catch (mongoError) {
      console.error('Failed to fetch vulnerabilities from MongoDB:', mongoError.message);
      console.error('Request URL:', `${ANALYSIS_SERVICE_URL}/api/analysis/pr/${analysis.pr_number}?repository=${analysis.repository_name}`);
      console.error('Full error:', mongoError.response?.data || mongoError);
      // Return analysis without vulnerability details if MongoDB fetch fails
      analysis.vulnerabilities = [];
      analysis.style_issues = [];
      analysis.severity_counts = DEFAULT_SEVERITY_COUNTS;
      analysis.style_categories = DEFAULT_STYLE_CATEGORIES;
      analysis.total_vulnerabilities = 0;
      analysis.total_style_issues = 0;
      analysis.vulnerability_fetch_error = `Could not retrieve vulnerability details: ${mongoError.message}`;
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
    // Get all summary statistics in a single query using conditional aggregation
    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE a.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE a.status = 'failed') as failed,
        COUNT(*) FILTER (WHERE a.started_at >= NOW() - INTERVAL '7 days') as recent
       FROM analysis a
       JOIN repositories r ON a.repository_id = r.id
       WHERE r.user_id = $1`,
      [req.user.user_id]
    );

    const summary = result.rows[0];

    res.json({
      success: true,
      summary: {
        total_analyses: parseInt(summary.total),
        completed: parseInt(summary.completed),
        failed: parseInt(summary.failed),
        recent_7_days: parseInt(summary.recent)
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
