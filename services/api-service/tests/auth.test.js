const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Endpoints', () => {
  
  test('GET /auth/github should redirect to GitHub', async () => {
    const response = await request(app)
      .get('/auth/github')
      .expect(302); // Redirect status

    expect(response.headers.location).toContain('github.com/login/oauth/authorize');
  });

  test('GET /auth/me without token should return 401', async () => {
    const response = await request(app)
      .get('/auth/me')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });


  test('GET /auth/me with invalid token should return 401', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);

    expect(response.body.error).toBe('Invalid token');
  });

});