const axios = require('axios');

class PRService {
  /**
   * SCRUM-88: Extract Python files from PR
   */
  async getPythonFilesFromPR(prUrl, githubToken) {
    try {
      // Get PR files from GitHub API
      const filesUrl = prUrl.replace('https://github.com', 'https://api.github.com/repos').replace('/pull/', '/pulls/') + '/files';

      console.log(`[FETCH] Fetching PR files from: ${filesUrl}`);

      const response = await axios.get(filesUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        }
      });

      // Filter for Python files only
      const pythonFiles = response.data.filter(file =>
        file.filename.endsWith('.py') &&
        file.status !== 'removed' // Ignore deleted files
      );

      console.log(`[PYTHON] Found ${pythonFiles.length} Python files in PR`);

      return pythonFiles;
    } catch (error) {
      console.error('[ERROR] Failed to fetch PR files:', error.message);
      throw error;
    }
  }

  /**
   * Get file content from GitHub
   */
  async getFileContent(file, githubToken) {
    try {
      // Use the raw_url to get file content
      const response = await axios.get(file.raw_url, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'text/plain',
        }
      });

      return response.data;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch content for ${file.filename}:`, error.message);
      throw error;
    }
  }
}

module.exports = new PRService();