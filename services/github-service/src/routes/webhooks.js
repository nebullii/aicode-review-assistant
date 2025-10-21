const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!process.env.WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not set - skipping signature verification');
    return true; // Allow in development if secret not set
  }
  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Register webhook for a repository
router.post('/register', async (req, res) => {
  const { repository_full_name, github_token } = req.body;

  if (!repository_full_name || !github_token) {
    return res.status(400).json({
      error: 'Missing required fields: repository_full_name, github_token'
    });
  }

  const webhookUrl = `${process.env.WEBHOOK_URL}/webhooks/github`;

  try {
    // First, check if webhook already exists
    const existingHooksResponse = await axios.get(
      `https://api.github.com/repos/${repository_full_name}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    // Find existing webhook with our URL
    const existingWebhook = existingHooksResponse.data.find(
      hook => hook.config?.url === webhookUrl
    );

    if (existingWebhook) {
      console.log(`Webhook already exists for ${repository_full_name}, returning existing ID: ${existingWebhook.id}`);
      return res.json({
        success: true,
        webhook_id: existingWebhook.id,
        webhook_url: existingWebhook.config.url,
        events: existingWebhook.events,
        already_existed: true,
      });
    }

    // Register new webhook on GitHub
    const webhookConfig = {
      name: 'web',
      active: true,
      events: ['pull_request'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        insecure_ssl: '0',
      },
    };

    // Add secret if configured
    if (process.env.WEBHOOK_SECRET) {
      webhookConfig.config.secret = process.env.WEBHOOK_SECRET;
    }

    const webhookResponse = await axios.post(
      `https://api.github.com/repos/${repository_full_name}/hooks`,
      webhookConfig,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    const webhook = webhookResponse.data;
    console.log(`New webhook created for ${repository_full_name}, ID: ${webhook.id}`);

    res.json({
      success: true,
      webhook_id: webhook.id,
      webhook_url: webhook.config.url,
      events: webhook.events,
      already_existed: false,
    });
  } catch (error) {
    console.error('Webhook registration error:', error.response?.data || error.message);
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
    res.status(error.response?.status || 500).json({
      error: 'Failed to register webhook',
      details: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors || []
    });
  }
});

// Receive webhook events from GitHub
router.post('/github', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  console.log(`\n=== Webhook Event Received ===`);
  console.log(`Event: ${event}`);
  console.log(`Signature: ${signature ? 'Present' : 'Missing'}`);

  // Verify signature
  if (signature && !verifySignature(req.body, signature)) {
    console.error('✗ Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the payload
  const payload = JSON.parse(req.body.toString());

  // Only process pull_request events
  if (event !== 'pull_request') {
    console.log(`Ignoring ${event} event`);
    return res.status(200).json({ message: 'Event ignored' });
  }

  // Extract PR information
  const action = payload.action; // opened, synchronize, closed, etc.
  const pr = payload.pull_request;
  const repository = payload.repository;

  console.log(`Action: ${action}`);
  console.log(`Repository: ${repository.full_name}`);
  console.log(`PR: #${pr.number} - ${pr.title}`);

  try {
    // Get repository from database
    const repoResult = await pool.query(
      'SELECT id FROM repositories WHERE github_id = $1',
      [repository.id]
    );

    if (repoResult.rows.length === 0) {
      console.log('✗ Repository not found in database');
      return res.status(200).json({ message: 'Repository not connected' });
    }

    const repositoryId = repoResult.rows[0].id;

    // Only log for opened and synchronize (new commits) events
    if (action === 'opened' || action === 'synchronize') {
      // Check if analysis already exists
      const existingAnalysis = await pool.query(
        'SELECT id FROM analyses WHERE repository_id = $1 AND pr_number = $2',
        [repositoryId, pr.number]
      );

      if (existingAnalysis.rows.length === 0) {
        // Insert new analysis
        await pool.query(
          `INSERT INTO analyses (repository_id, pr_number, pr_url, status, started_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [repositoryId, pr.number, pr.html_url, 'received']
        );
        console.log(`✓ New PR analysis created for ${repository.full_name}#${pr.number}`);
      } else {
        // Update existing analysis
        await pool.query(
          `UPDATE analyses
           SET status = $1, started_at = NOW()
           WHERE repository_id = $2 AND pr_number = $3`,
          ['received', repositoryId, pr.number]
        );
        console.log(`✓ PR analysis updated for ${repository.full_name}#${pr.number}`);
      }
    }

    console.log(`=============================\n`);

    // Respond to GitHub
    res.status(200).json({
      success: true,
      message: 'Webhook received and processed'
    });

  } catch (error) {
    console.error('✗ Error processing webhook:', error);
    console.error(`=============================\n`);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Delete/unregister webhook for a repository
router.post('/unregister', async (req, res) => {
  const { repository_full_name, webhook_id, github_token } = req.body;

  if (!repository_full_name || !webhook_id || !github_token) {
    return res.status(400).json({
      error: 'Missing required fields: repository_full_name, webhook_id, github_token'
    });
  }

  try {
    await axios.delete(
      `https://api.github.com/repos/${repository_full_name}/hooks/${webhook_id}`,
      {
        headers: {
          Authorization: `Bearer ${github_token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    console.log(`Webhook ${webhook_id} deleted for ${repository_full_name}`);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Webhook deletion error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to delete webhook',
      details: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;