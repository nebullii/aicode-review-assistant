const prService = require('../services/prService');
const analysisClient = require('../services/analysisClient');
const githubCommentService = require('../services/githubCommentService');
const commentFormatter = require('../utils/commentFormatter');

class WebhookController {
  /**
   * SCRUM-88: Process PR webhook and analyze Python files
   */
  async processPullRequest(payload, action) {
    // Only process opened and synchronize events
    if (action !== 'opened' && action !== 'synchronize') {
      console.log(`[SKIP] Skipping ${action} event`);
      return;
    }

    const pr = payload.pull_request;
    const repository = payload.repository;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      console.error('[ERROR] GITHUB_TOKEN not configured');
      return;
    }

    console.log(`\n[START] Starting analysis for PR #${pr.number} in ${repository.full_name}`);

    try {
      // Step 1: Get Python files from PR
      const pythonFiles = await prService.getPythonFilesFromPR(pr.url, githubToken);

      if (pythonFiles.length === 0) {
        console.log('[INFO] No Python files found in this PR');
        return;
      }

      // Step 2: Analyze each Python file
      for (const file of pythonFiles) {
        console.log(`\n[FILE] Processing: ${file.filename}`);

        try {
          // Get file content
          const fileContent = await prService.getFileContent(file, githubToken);

          // Call analysis service (SCRUM-87, 97, 99)
          const analysisResult = await analysisClient.analyzeCode(
            fileContent,
            file.filename,
            pr.number,
            repository.full_name
          );

          // Step 3: Post summary comment
          const summaryComment = commentFormatter.formatSummaryComment(
            file.filename,
            analysisResult
          );

          await githubCommentService.postSummaryComment(
            repository.owner.login,
            repository.name,
            pr.number,
            summaryComment,
            githubToken
          );

          console.log(`[SUCCESS] Posted summary comment for ${file.filename}`);

          // Step 4: Post inline comments for each vulnerability
          if (analysisResult.vulnerabilities && analysisResult.vulnerabilities.length > 0) {
            for (const vuln of analysisResult.vulnerabilities) {
              try {
                const comment = commentFormatter.formatVulnerabilityComment(vuln);

                await githubCommentService.postReviewComment(
                  repository.owner.login,
                  repository.name,
                  pr.number,
                  pr.head.sha,
                  file.filename,
                  vuln.line_number,
                  comment,
                  githubToken
                );

                console.log(`  [COMMENT] Posted comment on line ${vuln.line_number} (${vuln.severity})`);
              } catch (error) {
                console.error(`  [WARN] Failed to post inline comment:`, error.message);
                // Continue with other comments even if one fails
              }
            }
          }

        } catch (error) {
          console.error(`[ERROR] Failed to analyze ${file.filename}:`, error.message);
          // Continue with other files
        }
      }

      console.log(`\n[COMPLETE] PR analysis complete for #${pr.number}\n`);

    } catch (error) {
      console.error('[ERROR] PR analysis failed:', error);
    }
  }
}

module.exports = new WebhookController();