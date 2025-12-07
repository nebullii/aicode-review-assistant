const express = require('express');
const axios = require('axios');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://localhost:3002';

async function retryWebhooksForUser(userId) {
  const userResult = await pool.query(
    'SELECT github_token FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) {
    throw new Error('User not found for webhook retry');
  }
  const githubToken = userResult.rows[0].github_token;
  if (!githubToken) {
    throw new Error('No GitHub token available; user must re-auth');
  }

  const repoResult = await pool.query(
    'SELECT id, full_name FROM repositories WHERE user_id = $1 AND webhook_id IS NULL',
    [userId]
  );

  const successes = [];
  const failures = [];

  for (const repo of repoResult.rows) {
    try {
      const resp = await axios.post(
        `${GITHUB_SERVICE_URL}/webhooks/register`,
        {
          repository_full_name: repo.full_name,
          github_token: githubToken,
        }
      );
      const webhookId = resp.data?.webhook_id;
      const tokenInvalid = resp.data?.token_invalid;

      if (webhookId) {
        await pool.query(
          'UPDATE repositories SET webhook_id = $1, updated_at = NOW() WHERE id = $2',
          [webhookId, repo.id]
        );
        successes.push({ repo: repo.full_name, webhook_id: webhookId });
      } else {
        failures.push({
          repo: repo.full_name,
          reason: tokenInvalid ? 'token_invalid' : 'no_webhook_id_returned',
        });
      }
    } catch (err) {
      const status = err.response?.status;
      const tokenInvalid = status === 401 || status === 403 || err.response?.data?.token_invalid;
      failures.push({
        repo: repo.full_name,
        reason: tokenInvalid ? 'token_invalid' : err.response?.data?.message || err.message,
      });
    }
  }

  return { successes, failures };
}

// Get user's GitHub repositories (from local database)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch repositories from database
    const result = await pool.query(
      'SELECT * FROM repositories WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.user_id]
    );

    const repositories = result.rows.map((repo) => ({
      id: repo.id,
      github_id: repo.github_id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: false, // We might want to store this in DB if needed, defaulting to false for now
      html_url: `https://github.com/${repo.full_name}`,
      language: 'Unknown', // We might want to store this too
      stargazers_count: 0, // We might want to store this too
      updated_at: repo.updated_at,
      is_connected: repo.is_active, // is_active means connected/monitored
    }));

    res.json({
      success: true,
      count: repositories.length,
      repositories: repositories,
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      details: error.message,
    });
  }
});

// Sync repositories from GitHub
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    // Get user's GitHub token
    const userResult = await pool.query(
      'SELECT github_token FROM users WHERE id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const githubToken = userResult.rows[0].github_token;

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

    // Filter out archived repos
    const githubRepos = response.data.filter((repo) => !repo.archived);
    let syncedCount = 0;

    // Upsert each repository
    for (const repo of githubRepos) {
      // Check if it exists
      const existing = await pool.query(
        'SELECT id, user_id FROM repositories WHERE github_id = $1',
        [repo.id]
      );

      if (existing.rows.length > 0) {
        // If it belongs to this user, update it
        if (existing.rows[0].user_id === req.user.user_id) {
          await pool.query(
            `UPDATE repositories 
             SET name = $1, full_name = $2, description = $3, updated_at = NOW()
             WHERE id = $4`,
            [repo.name, repo.full_name, repo.description, existing.rows[0].id]
          );
          syncedCount++;
        }
        // If it belongs to another user, skip it (enforced by unique constraint on github_id)
      } else {
        // Insert new repository (default is_active = false for sync)
        await pool.query(
          `INSERT INTO repositories (user_id, github_id, name, full_name, description, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
          [req.user.user_id, repo.id, repo.name, repo.full_name, repo.description]
        );
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} repositories`,
      count: syncedCount
    });

  } catch (error) {
    console.error('Error syncing repositories:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to sync repositories',
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
    // Check if repository already connected (is_active = true)
    const existingRepo = await pool.query(
      'SELECT id FROM repositories WHERE user_id = $1 AND github_id = $2 AND is_active = true',
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
    let tokenInvalid = false;
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
      tokenInvalid = webhookResponse.data.token_invalid;
      console.log(`Webhook registered for ${full_name}: ${webhookId}`);
    } catch (webhookError) {
      if (webhookError.response?.data?.token_invalid) {
        tokenInvalid = true;
      }
      console.error('Webhook registration failed:', webhookError.response?.data || webhookError.message);
    }

    // Upsert repository with webhook_id and set is_active = true
    const repoResult = await pool.query(
      `INSERT INTO repositories (user_id, github_id, name, full_name, description, is_active, webhook_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       ON CONFLICT (github_id) 
       DO UPDATE SET is_active = true, webhook_id = $6, updated_at = NOW()
      RETURNING id, github_id, name, full_name, is_active, webhook_id`,
      [req.user.user_id, github_id, name, full_name, description, webhookId]
    );

    const repository = repoResult.rows[0];
    console.log(`✓ Repository ${repository.full_name} connected (ID: ${repository.id})`);


    res.json({
      success: true,
      message: webhookId
        ? 'Repository connected and webhook registered successfully'
        : tokenInvalid
          ? 'Repository connected; please reconnect GitHub to enable webhooks'
          : 'Repository connected successfully (webhook registration failed)',
      repository: repository,
      webhook_registered: !!webhookId,
      token_invalid: tokenInvalid,
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({
      error: 'Failed to connect repository',
      details: error.message,
    });
  }
});

// Retry webhook registration for current user (fixes missing webhook_id after re-auth)
router.post('/retry-webhooks', authenticateToken, async (req, res) => {
  try {
    const result = await retryWebhooksForUser(req.user.user_id);
    res.json({
      success: true,
      retried: result.successes.length + result.failures.length,
      successes: result.successes,
      failures: result.failures,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to retry webhooks',
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

    // Soft delete: set is_active = false and remove webhook_id
    await pool.query(
      'UPDATE repositories SET is_active = false, webhook_id = NULL, updated_at = NOW() WHERE id = $1',
      [repository_id]
    );

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

// Export router plus helper for reuse in auth flow
router.retryWebhooksForUser = retryWebhooksForUser;
module.exports = router;
