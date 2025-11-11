const axios = require('axios');

class GitHubCommentService {
  /**
   * SCRUM-88: Post review comment on PR
   */
  async postReviewComment(owner, repo, prNumber, commitId, filePath, lineNumber, body, githubToken) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
      
      const response = await axios.post(url, {
        body: body,
        commit_id: commitId,
        path: filePath,
        line: lineNumber,
      }, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        }
      });

      return response.data;
    } catch (error) {
      console.error(`[ERROR] Failed to post comment on line ${lineNumber}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * SCRUM-88: Post summary comment on PR
   */
  async postSummaryComment(owner, repo, prNumber, body, githubToken) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

      const response = await axios.post(url, {
        body: body
      }, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        }
      });

      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to post summary comment:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new GitHubCommentService();