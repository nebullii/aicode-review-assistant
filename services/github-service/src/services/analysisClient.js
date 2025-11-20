const axios = require('axios');

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://analysis-service:8001';

class AnalysisClient {
  /**
   * SCRUM-88: Call analysis-service to analyze Python code
   */
  async analyzeCode(code, filePath, prNumber, repository) {
    try {
      console.log(`[ANALYZE] Analyzing Python file: ${filePath}`);

      const response = await axios.post(`${ANALYSIS_SERVICE_URL}/api/analysis/analyze`, {
        code: code,
        language: 'python',
        file_path: filePath,
        pr_number: prNumber,
        repository: repository
      }, {
        timeout: 120000 // 2 minute timeout (accounts for service wake-up + AI analysis)
      });

      console.log(`[SUCCESS] Analysis complete: ${response.data.total_vulnerabilities} vulnerabilities found`);
      return response.data;
    } catch (error) {
      console.error(`[ERROR] Analysis failed for ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if analysis service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${ANALYSIS_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Analysis service health check failed:', error.message);
      return null;
    }
  }
}

module.exports = new AnalysisClient();