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

      // Filter for Python files (all types)
      const pythonExtensions = [
        '.py',      // Standard Python files
        '.ipynb',   // Jupyter notebooks
        '.pyw',     // Python Windows scripts
        '.pyx',     // Cython files
        '.pyi',     // Python stub files (type hints)
        '.pyc',     // Compiled Python (though rarely in PRs)
      ];

      const pythonFiles = response.data.filter(file => {
        const filename = file.filename.toLowerCase();
        const isPython = pythonExtensions.some(ext => filename.endsWith(ext));
        const isNotRemoved = file.status !== 'removed';

        // Skip files that rarely have security issues
        const skipPatterns = [
          '/migrations/',           // Django/Flask migrations
          '/alembic/versions/',     // Alembic migrations
          '__init__.py',            // Empty init files
          '/tests/',                // Test files (can analyze separately if needed)
          '/test_',                 // Test files
          '_test.py',               // Test files
        ];

        const shouldSkip = skipPatterns.some(pattern => filename.includes(pattern.toLowerCase()));

        return isPython && isNotRemoved && !shouldSkip;
      });

      console.log(`[PYTHON] Found ${pythonFiles.length} Python files in PR (skipped migrations/tests)`);

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
      console.error(`[ERROR] Failed to fetch ${file.filename} (status: ${file.status}): ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PRService();