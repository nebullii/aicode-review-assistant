const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Step 1: Redirect user to GitHub OAuth
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email,read:user,repo&prompt=login`;
  res.redirect(githubAuthUrl);
});

// Step 2: GitHub redirects back with code
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('http://localhost:3001/?error=no_code');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.redirect('http://localhost:3001/?error=auth_failed');
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Store or update user in database
    const result = await pool.query(
      `INSERT INTO users (github_id, github_username, email, avatar_url, github_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (github_id) 
       DO UPDATE SET 
         github_username = EXCLUDED.github_username,
         email = EXCLUDED.email,
         avatar_url = EXCLUDED.avatar_url,
         github_token = EXCLUDED.github_token,
         updated_at = NOW()
       RETURNING id, github_id, github_username, email, avatar_url`,
      [
        githubUser.id,
        githubUser.login,
        githubUser.email,
        githubUser.avatar_url,
        accessToken,
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.id,
        github_id: user.github_id,
        github_username: user.github_username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to dashboard with token
    res.redirect(`http://localhost:3001/dashboard?token=${token}`);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.redirect('http://localhost:3001/?error=auth_failed');
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, github_id, github_username, email, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;