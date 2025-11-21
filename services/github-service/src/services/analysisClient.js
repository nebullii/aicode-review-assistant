const axios = require('axios');

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://analysis-service:8001';

class AnalysisClient {
  /**
   * SCRUM-88: Call analysis-service to analyze Python code
   */
  async analyzeCode(code, filePath, prNumber, repository, retries = 2) {
    try {
      console.log(`[ANALYZE] Analyzing Python file: ${filePath}`);

      const response = await axios.post(`${ANALYSIS_SERVICE_URL}/api/analysis/analyze`, {
        code: code,
        language: 'python',
        file_path: filePath,
        pr_number: prNumber,
        repository: repository
      }, {
        timeout: 600000 // 10 minute timeout for complex files and large PRs
      });

      console.log(`[SUCCESS] Analysis complete: ${response.data.total_vulnerabilities} vulnerabilities found`);
      return response.data;
    } catch (error) {
      console.error(`[ERROR] Analysis failed for ${filePath}:`, error.message);

      // Retry on 502/503/504 errors (service temporarily unavailable)
      if (retries > 0 && error.response && [502, 503, 504].includes(error.response.status)) {
        console.log(`[RETRY] Retrying analysis for ${filePath} (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        return this.analyzeCode(code, filePath, prNumber, repository, retries - 1);
      }

      // Return empty result instead of throwing - continue with other files
      console.error(`[SKIP] Skipping ${filePath} due to analysis failure`);
      return {
        vulnerabilities: [],
        style_issues: [],
        total_vulnerabilities: 0,
        total_style_issues: 0,
        error: error.message
      };
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