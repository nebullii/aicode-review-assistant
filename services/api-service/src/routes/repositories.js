const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

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

// Get user's GitHub repositories
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's GitHub token from database
    const userResult = await pool.query(
      'SELECT github_token FROM users WHERE id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const githubToken = userResult.rows[0].github_token;

    // Get already connected repositories for this user
    const connectedRepos = await pool.query(
      'SELECT github_id FROM repositories WHERE user_id = $1',
      [req.user.user_id]
    );
    const connectedGithubIds = connectedRepos.rows.map(r => r.github_id);

    // Fetch repositories from GitHub API
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator',
      },
    });

    // Filter out archived and forked repos
    const repositories = response.data
      .filter((repo) => !repo.archived && !repo.fork)
      .slice(0, 20)
      .map((repo) => ({
        github_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        language: repo.language || 'Unknown',
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        is_connected: connectedGithubIds.includes(repo.id), // Add this
      }));

    res.json({
      success: true,
      count: repositories.length,
      repositories: repositories,
    });
  } catch (error) {
    console.error('Error fetching repositories:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      details: error.message,
    });
  }
});

// Connect a repository
router.post('/connect', authenticateToken, async (req, res) => {
  const { github_id, name, full_name, description } = req.body;

  if (!github_id || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if repository already connected
    const existingRepo = await pool.query(
      'SELECT id FROM repositories WHERE user_id = $1 AND github_id = $2',
      [req.user.user_id, github_id]
    );

    if (existingRepo.rows.length > 0) {
      return res.status(400).json({ error: 'Repository already connected' });
    }

    // Insert repository
    const repoResult = await pool.query(
      `INSERT INTO repositories (user_id, github_id, name, full_name, description, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, github_id, name, full_name, is_active`,
      [req.user.user_id, github_id, name, full_name, description]
    );

    const repository = repoResult.rows[0];

    // Create default configuration
    await pool.query(
      `INSERT INTO repository_config (repository_id, enable_security, enable_performance, enable_style, enable_redundancy, severity_threshold)
       VALUES ($1, true, true, true, true, 'medium')`,
      [repository.id]
    );

    res.json({
      success: true,
      message: 'Repository connected successfully',
      repository: repository,
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({
      error: 'Failed to connect repository',
      details: error.message,
    });
  }
});

module.exports = router;