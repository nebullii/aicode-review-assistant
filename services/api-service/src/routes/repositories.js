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

    // Get user's GitHub token
    const userResult = await pool.query(
      'SELECT github_token FROM users WHERE id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const githubToken = userResult.rows[0].github_token;

    // Register webhook with GitHub
    let webhookId = null;
    try {
      const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://localhost:3002';
      const webhookResponse = await axios.post(
        `${GITHUB_SERVICE_URL}/webhooks/register`,
        {
          repository_full_name: full_name,
          github_token: githubToken,
        }
      );
      webhookId = webhookResponse.data.webhook_id;
      console.log(`Webhook registered for ${full_name}: ${webhookId}`);
    } catch (webhookError) {
      console.error('Webhook registration failed:', webhookError.response?.data || webhookError.message);
    }

    // Insert repository with webhook_id
    const repoResult = await pool.query(
      `INSERT INTO repositories (user_id, github_id, name, full_name, description, is_active, webhook_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING id, github_id, name, full_name, is_active, webhook_id`,
      [req.user.user_id, github_id, name, full_name, description, webhookId]
    );

    const repository = repoResult.rows[0];

    // Create default configuration
    await pool.query(
        'UPDATE repositories SET webhook_id = $1 WHERE id = $2',
        [webhookId, repository.id]
    );
    console.log(`✓ Webhook ID ${webhookId} saved to database for repo ${repository.id}`);


    res.json({
      success: true,
      message: webhookId
        ? 'Repository connected and webhook registered successfully'
        : 'Repository connected successfully (webhook registration failed)',
      repository: repository,
      webhook_registered: !!webhookId,
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({
      error: 'Failed to connect repository',
      details: error.message,
    });
  }
});

// Get count of connected repositories
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM repositories WHERE user_id = $1 AND is_active = true',
      [req.user.user_id]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error fetching repository count:', error);
    res.status(500).json({
      error: 'Failed to fetch repository count',
      details: error.message,
    });
  }
});

// Disconnect a repository
router.post('/disconnect', authenticateToken, async (req, res) => {
  const { repository_id } = req.body;

  if (!repository_id) {
    return res.status(400).json({ error: 'Missing repository_id' });
  }

  try {
    // Get repository details including webhook_id
    const repoResult = await pool.query(
      'SELECT id, full_name, webhook_id, user_id FROM repositories WHERE id = $1',
      [repository_id]
    );

    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const repository = repoResult.rows[0];

    // Verify user owns this repository
    if (repository.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to disconnect this repository' });
    }

    // Get user's GitHub token
    const userResult = await pool.query(
      'SELECT github_token FROM users WHERE id = $1',
      [req.user.user_id]
    );

    const githubToken = userResult.rows[0]?.github_token;

    // Delete webhook from GitHub if webhook_id exists
    if (repository.webhook_id && githubToken) {
      try {
        const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://localhost:3002';
        await axios.post(
          `${GITHUB_SERVICE_URL}/webhooks/unregister`,
          {
            repository_full_name: repository.full_name,
            webhook_id: repository.webhook_id,
            github_token: githubToken,
          }
        );
        console.log(`Webhook ${repository.webhook_id} deleted for ${repository.full_name}`);
      } catch (webhookError) {
        console.error('Failed to delete webhook:', webhookError.response?.data || webhookError.message);
        // Continue with repository deletion even if webhook deletion fails
      }
    }

    // Delete repository from database (cascade will delete related records)
    await pool.query('DELETE FROM repositories WHERE id = $1', [repository_id]);

    res.json({
      success: true,
      message: 'Repository disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    res.status(500).json({
      error: 'Failed to disconnect repository',
      details: error.message,
    });
  }
});

module.exports = router;