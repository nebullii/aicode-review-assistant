const prService = require('../services/prService');
const analysisClient = require('../services/analysisClient');
const githubCommentService = require('../services/githubCommentService');
const commentFormatter = require('../utils/commentFormatter');
const notificationService = require('../services/notificationService');

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

      // Track all analysis results for email notification
      const allVulnerabilities = [];
      const allStyleIssues = [];

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

          // Step 3: Post security findings FIRST (if any)
          if (analysisResult.vulnerabilities && analysisResult.vulnerabilities.length > 0) {
            // Add to aggregated list for email notification
            analysisResult.vulnerabilities.forEach(vuln => {
              allVulnerabilities.push({
                ...vuln,
                file_path: file.filename
              });
            });

            // Post ONE batched comment for all security issues in this file
            try {
              const batchedComment = commentFormatter.formatBatchedSecurityComment(
                analysisResult.vulnerabilities,
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

                console.log(`  [SECURITY] Posted batched security comment (${analysisResult.vulnerabilities.length} issues)`);
              }
            } catch (error) {
              console.error(`  [WARN] Failed to post batched security comment:`, error.message);
            }
          }

          // Step 4: Post summary comment AFTER security findings
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

          // Step 5: Process style issues
          if (analysisResult.style_issues && analysisResult.style_issues.length > 0) {
            console.log(`[STYLE] Found ${analysisResult.style_issues.length} total style issues`);

            // Add ALL style issues to aggregated list for email notification
            analysisResult.style_issues.forEach(issue => {
              allStyleIssues.push({
                ...issue,
                file_path: file.filename
              });
            });

            // Filter for IMPORTANT style issues to post on GitHub
            // Only post: naming conventions and unused imports/variables
            const importantCategories = [
              'naming',
              'class_name',
              'function_name',
              'constant_name',
              'unused_import',
              'unused_variable'
            ];

            const importantStyleIssues = analysisResult.style_issues.filter(issue =>
              importantCategories.includes(issue.category)
            );

            // Post batched comment with important style issues only
            if (importantStyleIssues.length > 0) {
              try {
                const batchedStyleComment = commentFormatter.formatBatchedStyleComment(
                  importantStyleIssues,
                  file.filename
                );

                if (batchedStyleComment) {
                  await githubCommentService.postSummaryComment(
                    repository.owner.login,
                    repository.name,
                    pr.number,
                    batchedStyleComment,
                    githubToken
                  );

                  console.log(`  [STYLE] Posted batched style comment (${importantStyleIssues.length} important issues)`);
                }
              } catch (error) {
                console.error(`  [WARN] Failed to post batched style comment:`, error.message);
              }
            } else {
              console.log(`  [STYLE] No important style issues to post on GitHub`);
            }
          }

        } catch (error) {
          console.error(`[ERROR] Failed to analyze ${file.filename}:`, error.message);
          // Continue with other files
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

      console.log(`\n[COMPLETE] PR analysis complete for #${pr.number}\n`);

    } catch (error) {
      console.error('[ERROR] PR analysis failed:', error);
    }
  }
}

module.exports = new WebhookController();