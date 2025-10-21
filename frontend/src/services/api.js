import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      // Redirect to home page if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Redirect to GitHub OAuth
  loginWithGitHub: () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },

  // Get current user info
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('auth_token');
  },
};

// Repository API calls
export const repositoryAPI = {
  // Get all repositories
  getRepositories: async () => {
    const response = await api.get('/api/repositories');
    return response.data;
  },

  // Connect a repository
  connectRepository: async (repoData) => {
    const response = await api.post('/api/repositories/connect', repoData);
    return response.data;
  },
};

// Webhook API calls
export const webhookAPI = {
  // Get recent webhook events
  getEvents: async (limit = 20) => {
    const response = await api.get(`/api/webhooks/events?limit=${limit}`);
    return response.data;
  },
};

export default api;

