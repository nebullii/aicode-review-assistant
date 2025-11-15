const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Email Notification Service
 * Sends email notifications to PR reviewers with AI analysis previews
 *
 * Features:
 * - Sends emails to PR reviewers
 * - Includes AI-generated vulnerability and style issue previews
 * - Gracefully handles missing email configuration (optional feature)
 */
class NotificationService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   * Email is optional - service works without it
   */
  initializeTransporter() {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('[NOTIFICATION] Email not configured - notifications disabled');
        console.log('[NOTIFICATION] To enable: Set EMAIL_USER and EMAIL_PASSWORD in .env');
        this.isConfigured = false;
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      this.isConfigured = true;
      console.log('[NOTIFICATION] ✓ Email notification service initialized');
      console.log(`[NOTIFICATION]   Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
      console.log(`[NOTIFICATION]   From: ${process.env.EMAIL_USER}`);

    } catch (error) {
      console.error('[NOTIFICATION] ✗ Failed to initialize email service:', error.message);
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  /**
   * Check if email notifications are enabled
   */
  isEnabled() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(recipient) {
    if (!this.isEnabled()) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'AI Code Review Assistant'}" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: 'Test Email - AI Code Review Assistant',
        html: '<h1>Email Configuration Successful!</h1><p>Your email notification service is working correctly.</p>'
      });

      return {
        success: true,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      console.error('[NOTIFICATION] Test email failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Send email notification to PR reviewers with AI analysis preview
   *
   * @param {Object} prData - PR information
   * @param {Object} analysisResults - Aggregated analysis results
   */
  async notifyReviewers(prData, analysisResults) {
    if (!this.isEnabled()) {
      console.log('[NOTIFICATION] Email disabled - skipping notification');
      return;
    }

    try {
      // Get reviewers using GitHub API
      const reviewers = await this.getReviewers(prData);

      if (!reviewers || reviewers.length === 0) {
        console.log('[NOTIFICATION] No reviewers found');
        return;
      }

      console.log(`[NOTIFICATION] Found ${reviewers.length} reviewer(s)`);

      // Generate email HTML
      const emailBody = this.formatEmailWithAIComments(prData, analysisResults);
      const subject = this.getEmailSubject(prData, analysisResults);

      // Send to each reviewer
      for (const reviewer of reviewers) {
        if (!reviewer.email) continue;

        try {
          await this.transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'AI Code Review Assistant'}" <${process.env.EMAIL_USER}>`,
            to: reviewer.email,
            subject: subject,
            html: emailBody,
            priority: analysisResults.hasCritical ? 'high' : 'normal'
          });

          console.log(`[NOTIFICATION] ✓ Email sent to ${reviewer.username} (${reviewer.email})`);
        } catch (error) {
          console.error(`[NOTIFICATION] ✗ Failed to send to ${reviewer.email}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[NOTIFICATION] Failed to send notifications:', error);
    }
  }

  /**
   * Generate email subject based on analysis results
   */
  getEmailSubject(prData, analysisResults) {
    const { pr_number, pr_title } = prData;
    const { total_vulnerabilities, critical_count } = analysisResults;

    if (critical_count > 0) {
      return `🚨 CRITICAL: PR #${pr_number} - ${critical_count} critical issues found`;
    } else if (total_vulnerabilities > 0) {
      return `⚠️ Review Needed: PR #${pr_number} - ${total_vulnerabilities} issues found`;
    } else {
      return `✅ PR #${pr_number} - No issues found: ${pr_title}`;
    }
  }

  /**
   * Format email with AI analysis preview
   */
  formatEmailWithAIComments(prData, analysisResults) {
    const {
      repository,
      pr_number,
      pr_url,
      pr_title,
      author,
      filesAnalyzed
    } = prData;

    const {
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      total_style_issues,
      vulnerabilities,
      styleIssues,
      hasCritical
    } = analysisResults;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            margin: 0;
            padding: 0;
            background-color: #f6f8fa;
          }
          .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0;
            opacity: 0.95;
          }
          .content {
            padding: 30px 20px;
          }
          .summary {
            background: #f6f8fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e1e4e8;
            text-align: center;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 12px;
            color: #586069;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .critical { color: #d73a49; }
          .high { color: #e36209; }
          .medium { color: #f9c513; }
          .low { color: #28a745; }

          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e1e4e8;
          }

          .issue-card {
            background: #fff;
            border: 1px solid #e1e4e8;
            border-left: 4px solid;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .issue-card.critical { border-left-color: #d73a49; }
          .issue-card.high { border-left-color: #e36209; }
          .issue-card.medium { border-left-color: #f9c513; }
          .issue-card.low { border-left-color: #28a745; }

          .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .issue-type {
            font-weight: 600;
            font-size: 14px;
          }
          .issue-severity {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .severity-critical { background: #ffeef0; color: #d73a49; }
          .severity-high { background: #fff8f2; color: #e36209; }
          .severity-medium { background: #fffbdd; color: #735c0f; }
          .severity-low { background: #f0fff4; color: #22863a; }

          .issue-file {
            font-size: 12px;
            color: #586069;
            margin-bottom: 8px;
          }
          .issue-description {
            font-size: 14px;
            color: #24292e;
            margin-bottom: 10px;
          }
          .issue-code {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            margin: 10px 0;
          }
          .issue-recommendation {
            font-size: 13px;
            color: #0366d6;
            background: #f1f8ff;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #0366d6;
          }

          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #0366d6;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }

          .footer {
            background: #f6f8fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #586069;
            border-top: 1px solid #e1e4e8;
          }

          .no-issues {
            text-align: center;
            padding: 40px 20px;
            color: #28a745;
          }
          .no-issues-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🔍 AI Code Review Complete</h1>
            <p><strong>Repository:</strong> ${repository}</p>
            <p><strong>PR #${pr_number}:</strong> ${pr_title}</p>
            <p><strong>Author:</strong> ${author}</p>
            <p><strong>Files Analyzed:</strong> ${filesAnalyzed || 0}</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Summary -->
            <div class="summary">
              <h2 style="margin-top: 0;">📊 Analysis Summary</h2>
              <div class="stats">
                <div class="stat">
                  <div class="stat-value critical">${critical_count || 0}</div>
                  <div class="stat-label">Critical</div>
                </div>
                <div class="stat">
                  <div class="stat-value high">${high_count || 0}</div>
                  <div class="stat-label">High</div>
                </div>
                <div class="stat">
                  <div class="stat-value medium">${medium_count || 0}</div>
                  <div class="stat-label">Medium</div>
                </div>
                <div class="stat">
                  <div class="stat-value low">${low_count || 0}</div>
                  <div class="stat-label">Low</div>
                </div>
              </div>
              <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e4e8;">
                <strong>${total_vulnerabilities || 0}</strong> security issues ·
                <strong>${total_style_issues || 0}</strong> style issues
              </div>
            </div>

            ${hasCritical ? '<div style="background: #ffeef0; border: 2px solid #d73a49; border-radius: 6px; padding: 15px; margin-bottom: 20px;"><strong>⚠️ Action Required:</strong> This PR contains critical security vulnerabilities that need immediate attention.</div>' : ''}

            ${total_vulnerabilities === 0 && total_style_issues === 0 ?
              '<div class="no-issues"><div class="no-issues-icon">✅</div><h3>Great Job!</h3><p>No security vulnerabilities or style issues detected.</p></div>' :
              '<div style="text-align: center; padding: 30px 20px; background: #f6f8fa; border-radius: 8px; margin: 20px 0;"><p style="font-size: 16px; color: #24292e; margin-bottom: 15px;"><strong>AI analysis is complete!</strong></p><p style="color: #586069; margin: 0;">All detailed findings have been posted as comments directly on the pull request.</p></div>'
            }

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${pr_url}" class="button">Review Pull Request on GitHub</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>AI Code Review Assistant</strong></p>
            <p>Automated security and style analysis powered by Google Vertex AI</p>
            <p style="margin-top: 10px;">
              This is an automated notification. AI analysis comments have been posted directly on the PR.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML preview of top vulnerabilities
   */
  generateVulnerabilityPreviews(vulnerabilities) {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return '';
    }

    // Show top 5 most severe
    const topVulns = vulnerabilities.slice(0, 5);

    const vulnHtml = topVulns.map(vuln => `
      <div class="issue-card ${vuln.severity}">
        <div class="issue-header">
          <div class="issue-type">${this.formatVulnType(vuln.type)}</div>
          <span class="issue-severity severity-${vuln.severity}">${vuln.severity}</span>
        </div>
        <div class="issue-file">📄 ${vuln.file_path || 'Unknown file'} · Line ${vuln.line_number || 0}</div>
        <div class="issue-description">${this.escapeHtml(vuln.description || 'No description')}</div>
        ${vuln.code_snippet ? `<div class="issue-code">${this.escapeHtml(vuln.code_snippet)}</div>` : ''}
        <div class="issue-recommendation">
          <strong>💡 Recommendation:</strong> ${this.escapeHtml(vuln.recommendation || 'Review and fix this issue')}
        </div>
      </div>
    `).join('');

    const remaining = vulnerabilities.length - topVulns.length;
    const moreText = remaining > 0 ? `<p style="text-align: center; color: #586069; font-size: 13px;">+ ${remaining} more security issues</p>` : '';

    return `
      <div class="section">
        <div class="section-title">🛡️ Security Vulnerabilities (Top ${topVulns.length})</div>
        ${vulnHtml}
        ${moreText}
      </div>
    `;
  }

  /**
   * Generate HTML preview of top style issues
   */
  generateStyleIssuePreviews(styleIssues) {
    if (!styleIssues || styleIssues.length === 0) {
      return '';
    }

    // Show top 3 style issues
    const topIssues = styleIssues.slice(0, 3);

    const styleHtml = topIssues.map(issue => `
      <div class="issue-card ${issue.severity}">
        <div class="issue-header">
          <div class="issue-type">${this.formatStyleType(issue.category)}</div>
          <span class="issue-severity severity-${issue.severity}">${issue.severity}</span>
        </div>
        <div class="issue-file">📄 ${issue.file_path || 'Unknown file'} · Line ${issue.line || 0}</div>
        <div class="issue-description">${this.escapeHtml(issue.message || 'Style issue detected')}</div>
        <div class="issue-recommendation">
          <strong>💡 Recommendation:</strong> ${this.escapeHtml(issue.recommendation || 'Follow coding standards')}
        </div>
      </div>
    `).join('');

    const remaining = styleIssues.length - topIssues.length;
    const moreText = remaining > 0 ? `<p style="text-align: center; color: #586069; font-size: 13px;">+ ${remaining} more style issues</p>` : '';

    return `
      <div class="section">
        <div class="section-title">🎨 Code Style Issues (Top ${topIssues.length})</div>
        ${styleHtml}
        ${moreText}
      </div>
    `;
  }

  /**
   * Format vulnerability type for display
   */
  formatVulnType(type) {
    if (!type) return 'Security Issue';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format style issue type for display
   */
  formatStyleType(category) {
    if (!category) return 'Style Issue';
    const map = {
      'pep8': 'PEP 8 Violation',
      'pylint': 'Code Quality',
      'naming': 'Naming Convention',
      'complexity': 'Code Complexity',
      'class_name': 'Class Naming',
      'function_name': 'Function Naming',
      'constant_name': 'Constant Naming'
    };
    return map[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Get reviewers for the PR
   * Tries multiple strategies with fallbacks
   *
   * @param {Object} prData - PR data including requested_reviewers and repo_owner
   * @returns {Array} Array of reviewer objects with username and email
   */
  async getReviewers(prData) {
    const reviewers = [];

    try {
      console.log('[NOTIFICATION] Looking for reviewers...');

      // Strategy 1: Get requested reviewers from PR
      if (prData.requested_reviewers && prData.requested_reviewers.length > 0) {
        console.log(`[NOTIFICATION] Found ${prData.requested_reviewers.length} requested reviewer(s)`);

        for (const reviewer of prData.requested_reviewers) {
          const email = await this.getGitHubUserEmail(reviewer.login);
          if (email) {
            reviewers.push({
              username: reviewer.login,
              email: email
            });
            console.log(`[NOTIFICATION]   ✓ ${reviewer.login}: ${email}`);
          } else {
            console.log(`[NOTIFICATION]   ✗ ${reviewer.login}: email not found`);
          }
        }
      }

      // Strategy 2: Fallback to repository owner if no reviewers found
      if (reviewers.length === 0 && prData.repo_owner) {
        console.log('[NOTIFICATION] No requested reviewers, using repository owner');
        const ownerEmail = await this.getGitHubUserEmail(prData.repo_owner);
        if (ownerEmail) {
          reviewers.push({
            username: prData.repo_owner,
            email: ownerEmail
          });
          console.log(`[NOTIFICATION]   ✓ Owner ${prData.repo_owner}: ${ownerEmail}`);
        }
      }

      // Strategy 3: Use default reviewer email from environment
      if (reviewers.length === 0 && process.env.DEFAULT_REVIEWER_EMAIL) {
        console.log('[NOTIFICATION] Using DEFAULT_REVIEWER_EMAIL from environment');
        reviewers.push({
          username: 'default',
          email: process.env.DEFAULT_REVIEWER_EMAIL
        });
      }

      console.log(`[NOTIFICATION] Total reviewers found: ${reviewers.length}`);

    } catch (error) {
      console.error('[NOTIFICATION] Error getting reviewers:', error.message);
    }

    return reviewers;
  }

  /**
   * Get GitHub user email via API
   * Tries multiple methods to find user's email
   *
   * @param {string} username - GitHub username
   * @returns {string|null} Email address or null if not found
   */
  async getGitHubUserEmail(username) {
    if (!username) return null;

    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        console.log('[NOTIFICATION] No GITHUB_TOKEN - cannot fetch user emails');
        return `${username}@users.noreply.github.com`;
      }

      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      // Method 1: Try to get public email from user profile
      try {
        const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers });

        if (userResponse.data.email) {
          console.log(`[NOTIFICATION]   Found email in profile for ${username}`);
          return userResponse.data.email;
        }
      } catch (error) {
        console.log(`[NOTIFICATION]   Profile lookup failed for ${username}: ${error.message}`);
      }

      // Method 2: Try to get email from recent commit events
      try {
        const eventsResponse = await axios.get(
          `https://api.github.com/users/${username}/events/public`,
          { headers }
        );

        // Look for email in recent commits
        for (const event of eventsResponse.data) {
          if (event.type === 'PushEvent' && event.payload.commits) {
            for (const commit of event.payload.commits) {
              if (commit.author && commit.author.email && !commit.author.email.includes('noreply')) {
                console.log(`[NOTIFICATION]   Found email in commits for ${username}`);
                return commit.author.email;
              }
            }
          }
        }
      } catch (error) {
        console.log(`[NOTIFICATION]   Events lookup failed for ${username}: ${error.message}`);
      }

      // Method 3: Fallback to noreply email
      console.log(`[NOTIFICATION]   Using noreply email for ${username}`);
      return `${username}@users.noreply.github.com`;

    } catch (error) {
      console.error(`[NOTIFICATION] Failed to get email for ${username}:`, error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
