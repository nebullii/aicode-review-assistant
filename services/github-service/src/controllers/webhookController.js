const prService = require('../services/prService');
const analysisClient = require('../services/analysisClient');
const githubCommentService = require('../services/githubCommentService');
const commentFormatter = require('../utils/commentFormatter');
const notificationService = require('../services/notificationService');
const { Pool } = require('pg');

// Database connection with secure SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon provides valid SSL certificates - verify them for security
  ssl: process.env.NODE_ENV === 'production' ? true : false,
});

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

    // Fetch GitHub token from database
    let githubToken;
    try {
      // Get repository from database
      const repoResult = await pool.query(
        'SELECT user_id FROM repositories WHERE github_id = $1',
        [repository.id]
      );

      if (repoResult.rows.length === 0) {
        console.error('[ERROR] Repository not found in database');
        return;
      }

      const userId = repoResult.rows[0].user_id;

      // Get user's GitHub token
      const userResult = await pool.query(
        'SELECT github_token FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.error('[ERROR] User not found in database');
        return;
      }

      githubToken = userResult.rows[0].github_token;

      if (!githubToken) {
        console.error('[ERROR] GitHub token not found for user');
        return;
      }
    } catch (error) {
      console.error('[ERROR] Failed to fetch GitHub token:', error.message);
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

      // Post initial progress comment for large PRs
      if (pythonFiles.length > 3) {
        try {
          const progressComment = `## 🔍 CodeSentry Analysis Started\n\n` +
            `Processing ${pythonFiles.length} Python ${pythonFiles.length === 1 ? 'file' : 'files'}...\n\n` +
            `This may take a few minutes. We'll post findings as we discover them.\n\n` +
            `<sub>Powered by **CodeSentry**</sub>`;

          await githubCommentService.postSummaryComment(
            repository.owner.login,
            repository.name,
            pr.number,
            progressComment,
            githubToken
          );
          console.log(`[PROGRESS] Posted initial comment for ${pythonFiles.length} files`);
        } catch (error) {
          console.error('[WARN] Failed to post progress comment:', error.message);
        }
      }

      // Track all analysis results for email notification
      const allVulnerabilities = [];
      const allStyleIssues = [];

      // Step 2: Analyze each Python file (sequential for memory efficiency)
      for (let i = 0; i < pythonFiles.length; i++) {
        const file = pythonFiles[i];
        console.log(`\n[FILE ${i + 1}/${pythonFiles.length}] Processing: ${file.filename}`);

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

          // Step 3: Process ALL findings for email/database (full analysis)
          if (analysisResult.vulnerabilities && analysisResult.vulnerabilities.length > 0) {
            // Add ALL vulnerabilities to aggregated list for email notification
            analysisResult.vulnerabilities.forEach(vuln => {
              allVulnerabilities.push({
                ...vuln,
                file_path: file.filename
              });
            });

            // Determine which vulnerabilities to post
            // User requested ALL analysis even for big PRs
            const vulnsToPost = analysisResult.vulnerabilities;
            console.log(`  [PR ANALYSIS] Posting all ${vulnsToPost.length} vulnerabilities`);

            // Post to GitHub if there are issues to report
            if (vulnsToPost.length > 0) {
              try {
                const batchedComment = commentFormatter.formatBatchedSecurityComment(
                  vulnsToPost,
                  file.filename
                );

                if (batchedComment) {
                  await githubCommentService.postSummaryComment(
                    repository.owner.login,
                    repository.name,
                    pr.number,
                    batchedComment,
                    githubToken
                  );

                  console.log(`  [SECURITY] Posted comment with ${vulnsToPost.length} issues to GitHub`);
                }
              } catch (error) {
                console.error(`  [WARN] Failed to post batched security comment:`, error.message);
              }
            } else {
              console.log(`  [SKIP] No critical/high severity issues to post on GitHub (found ${analysisResult.vulnerabilities.length} medium/low issues)`);
            }
          }

          // Step 4: Add style issues to aggregated list (for email/database only, not posted to GitHub)
          if (analysisResult.style_issues && analysisResult.style_issues.length > 0) {
            console.log(`[STYLE] Found ${analysisResult.style_issues.length} style issues (stored for email, not posted to GitHub)`);

            // Add ALL style issues to aggregated list for email notification
            analysisResult.style_issues.forEach(issue => {
              allStyleIssues.push({
                ...issue,
                file_path: file.filename
              });
            });
          }

        } catch (error) {
          console.error(`[ERROR] Failed to analyze ${file.filename}:`, error.message);
          // Continue with other files
        }

        // Small delay between files to allow garbage collection (helps with memory on free tier)
        if (i < pythonFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between files
        }
      }

      // Step 6: Send email notification to reviewers with analysis preview
      try {
        console.log('\n[EMAIL] Preparing notification to reviewers...');

        // Calculate severity counts
        const severityCounts = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };

        allVulnerabilities.forEach(vuln => {
          const severity = vuln.severity?.toLowerCase() || 'low';
          if (severityCounts[severity] !== undefined) {
            severityCounts[severity]++;
          }
        });

        // Prepare PR data for email
        const prData = {
          repository: repository.full_name,
          pr_number: pr.number,
          pr_url: pr.html_url,
          pr_title: pr.title,
          author: pr.user.login,
          filesAnalyzed: pythonFiles.length,
          requested_reviewers: pr.requested_reviewers || [],
          repo_owner: repository.owner.login
        };

        // Prepare aggregated analysis results
        const analysisResults = {
          total_vulnerabilities: allVulnerabilities.length,
          critical_count: severityCounts.critical,
          high_count: severityCounts.high,
          medium_count: severityCounts.medium,
          low_count: severityCounts.low,
          total_style_issues: allStyleIssues.length,
          vulnerabilities: allVulnerabilities,
          styleIssues: allStyleIssues,
          hasCritical: severityCounts.critical > 0
        };

        // Send notification (non-blocking, won't fail PR analysis if email fails)
        await notificationService.notifyReviewers(prData, analysisResults);

        console.log('[EMAIL] Notification process complete');

      } catch (error) {
        // Email failure should not fail the PR analysis
        console.error('[EMAIL] Failed to send notifications (PR analysis still succeeded):', error.message);
      }

      // Post completion comment for large PRs
      if (pythonFiles.length > 3) {
        try {
          const completionComment = `## ✅ CodeSentry Analysis Complete\n\n` +
            `Analyzed ${pythonFiles.length} Python ${pythonFiles.length === 1 ? 'file' : 'files'}\n\n` +
            `**Summary:**\n` +
            `- 🔴 Critical/High Issues: ${allVulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length}\n` +
            `- 📊 Total Security Findings: ${allVulnerabilities.length}\n` +
            `- 💎 Code Quality Suggestions: ${allStyleIssues.length}\n\n` +
            `${allVulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length > 0 ? '⚠️ Please review the critical/high severity issues posted above.' : '✨ No critical or high severity issues found!'}\n\n` +
            `<sub>Powered by **CodeSentry**</sub>`;

          await githubCommentService.postSummaryComment(
            repository.owner.login,
            repository.name,
            pr.number,
            completionComment,
            githubToken
          );
          console.log('[PROGRESS] Posted completion summary');
        } catch (error) {
          console.error('[WARN] Failed to post completion comment:', error.message);
        }
      }

      console.log(`\n[COMPLETE] PR analysis complete for #${pr.number}\n`);

    } catch (error) {
      console.error('[ERROR] PR analysis failed:', error);
    }
  }
}

module.exports = new WebhookController();