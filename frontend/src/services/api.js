import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ANALYSIS_SERVICE_URL = import.meta.env.VITE_ANALYSIS_SERVICE_URL || 'http://localhost:8001';

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

  // Sync repositories from GitHub
  syncRepositories: async () => {
    const response = await api.post('/api/repositories/sync');
    return response.data;
  },

  // Connect a repository
  connectRepository: async (repoData) => {
    const response = await api.post('/api/repositories/connect', repoData);
    return response.data;
  },

  // Get count of connected repositories
  getConnectedCount: async () => {
    const response = await api.get('/api/repositories/count');
    return response.data;
  },

  // Get summary statistics
  getSummary: async () => {
    const response = await api.get('/api/reports/summary');
    return response.data;
  },
};

// Webhook API calls
export const webhookAPI = {
  // Get recent webhook events
  getEvents: async (limit = 20, offset = 0) => {
    const response = await api.get(`/api/webhooks/events?limit=${limit}&offset=${offset}`);
    return response.data;
  },
};

// Reports API calls
export const reportsAPI = {
  // Get all PR analyses
  getPRAnalyses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.repository_id) params.append('repository_id', filters.repository_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/api/reports/pr-analyses?${params.toString()}`);
    return response.data;
  },

  // Get detailed analysis for a specific PR
  getPRAnalysisDetails: async (analysisId) => {
    const response = await api.get(`/api/reports/pr-analyses/${analysisId}`);
    return response.data;
  },

  // Get summary statistics
  getSummary: async () => {
    const response = await api.get('/api/reports/summary');
    return response.data;
  },
};

export default api;

// Analysis API calls (SCRUM-87, 97, 99)
export const analysisAPI = {
  // Analyze code for vulnerabilities
  analyzeCode: async (codeData) => {
    const response = await axios.post(`${ANALYSIS_SERVICE_URL}/api/analysis/analyze`, codeData);
    return response.data;
  },

  // Get analysis history
  getHistory: async (limit = 10) => {
    const response = await axios.get(`${ANALYSIS_SERVICE_URL}/api/analysis/history?limit=${limit}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${ANALYSIS_SERVICE_URL}/health`);
    return response.data;
  },
};

