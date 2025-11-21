class CommentFormatter {
  /**
   * Format batched security vulnerabilities comment (CodeRabbit-style)
   */
  formatBatchedSecurityComment(vulnerabilities, fileName) {
    if (!vulnerabilities || vulnerabilities.length === 0) return null;

    // Group by severity
    const grouped = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    vulnerabilities.forEach(vuln => {
      const severity = vuln.severity?.toLowerCase() || 'low';
      if (grouped[severity]) {
        grouped[severity].push(vuln);
      }
    });

    const totalCount = vulnerabilities.length;
    const criticalCount = grouped.critical.length;
    const highCount = grouped.high.length;
    const mediumCount = grouped.medium.length;
    const lowCount = grouped.low.length;

    // Header with summary
    let comment = `## 🔒 Security Analysis\n\n`;
    comment += `**File:** \`${fileName}\`\n\n`;

    // Summary badges
    comment += ``;
    if (criticalCount > 0) comment += `![Critical](https://img.shields.io/badge/Critical-${criticalCount}-red) `;
    if (highCount > 0) comment += `![High](https://img.shields.io/badge/High-${highCount}-orange) `;
    if (mediumCount > 0) comment += `![Medium](https://img.shields.io/badge/Medium-${mediumCount}-yellow) `;
    if (lowCount > 0) comment += `![Low](https://img.shields.io/badge/Low-${lowCount}-blue) `;
    comment += `\n\n`;

    // Priority message
    if (criticalCount > 0 || highCount > 0) {
      comment += `> **⚠️ Action Required:** Found ${criticalCount + highCount} high-priority security ${(criticalCount + highCount) === 1 ? 'issue' : 'issues'} that should be addressed before merging.\n\n`;
    } else {
      comment += `> **📋 Review Recommended:** Found ${totalCount} security ${totalCount === 1 ? 'issue' : 'issues'} for your review.\n\n`;
    }

    comment += `---\n\n`;

    // Findings by severity
    const severities = ['critical', 'high', 'medium', 'low'];
    severities.forEach(severity => {
      const issues = grouped[severity];
      if (issues.length === 0) return;

      const emoji = this.getSeverityEmoji(severity);
      const label = this.getSeverityLabel(severity);

      comment += `### ${emoji} ${label}\n\n`;

      issues.forEach((vuln, index) => {
        const vulnType = this.formatVulnTypeHuman(vuln.type);
        const lineInfo = vuln.line_number ? ` (Line ${vuln.line_number})` : '';

        comment += `<details>\n`;
        comment += `<summary><strong>${index + 1}. ${vulnType}${lineInfo}</strong></summary>\n\n`;

        comment += `**Description:**\n`;
        comment += `${vuln.description}\n\n`;

        // Show code snippet if available
        if (vuln.code_snippet) {
          comment += `**Code:**\n\`\`\`python\n${vuln.code_snippet}\n\`\`\`\n\n`;
        }

        // Context
        const context = this.getSecurityContext(vuln.type, severity);
        if (context) {
          comment += `**Impact:**\n`;
          comment += `${context}\n\n`;
        }

        // Recommendation
        comment += `**💡 Recommendation:**\n`;
        comment += `${vuln.recommendation}\n\n`;

        // Confidence indicator
        if (vuln.confidence < 0.7) {
          comment += `> **Note:** This finding has moderate confidence. Please review the context carefully.\n\n`;
        }

        comment += `</details>\n\n`;
      });
    });

    comment += `---\n\n`;
    comment += `<sub>Powered by **CodeSentry** • [Report Issue](https://github.com/nebullii/aicode-review-assistant/issues)</sub>`;

    return comment;
  }

  /**
   * Format summary comment (CodeRabbit-style)
   */
  formatSummaryComment(fileName, analysisResult) {
    const {
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      total_style_issues = 0,
      style_categories = {}
    } = analysisResult;

    const hasVulnerabilities = total_vulnerabilities > 0;
    const hasStyleIssues = total_style_issues > 0;

    // Clean code - no issues
    if (!hasVulnerabilities && !hasStyleIssues) {
      return `## ✅ Code Review Complete\n\n` +
             `**File:** \`${fileName}\`\n\n` +
             `![Passing](https://img.shields.io/badge/Security-✓_Passed-brightgreen) ` +
             `![Quality](https://img.shields.io/badge/Quality-✓_Good-brightgreen)\n\n` +
             `> **Well done!** No security vulnerabilities or code quality issues detected.\n\n` +
             `---\n\n` +
             `<sub>Powered by **CodeSentry**</sub>`;
    }

    let summary = `## 📊 Code Analysis Report\n\n`;
    summary += `**File:** \`${fileName}\`\n\n`;

    // Badges
    if (hasVulnerabilities) {
      summary += `**Security:** `;
      if (critical_count > 0) summary += `![Critical](https://img.shields.io/badge/Critical-${critical_count}-red) `;
      if (high_count > 0) summary += `![High](https://img.shields.io/badge/High-${high_count}-orange) `;
      if (medium_count > 0) summary += `![Medium](https://img.shields.io/badge/Medium-${medium_count}-yellow) `;
      if (low_count > 0) summary += `![Low](https://img.shields.io/badge/Low-${low_count}-blue) `;
      summary += `\n\n`;
    }

    if (hasStyleIssues) {
      summary += `**Code Quality:** ![Issues](https://img.shields.io/badge/Suggestions-${total_style_issues}-blue)\n\n`;
    }

    // Summary table
    summary += `<details>\n<summary><strong>📈 Analysis Summary</strong></summary>\n\n`;
    summary += `| Category | Count |\n`;
    summary += `|----------|------:|\n`;

    if (hasVulnerabilities) {
      if (critical_count > 0) summary += `| 🔴 Critical Security Issues | ${critical_count} |\n`;
      if (high_count > 0) summary += `| 🟠 High Security Issues | ${high_count} |\n`;
      if (medium_count > 0) summary += `| 🟡 Medium Security Issues | ${medium_count} |\n`;
      if (low_count > 0) summary += `| 🔵 Low Security Issues | ${low_count} |\n`;
    }

    if (hasStyleIssues && Object.keys(style_categories).length > 0) {
      if (style_categories.pep8) summary += `| 📝 PEP 8 Style | ${style_categories.pep8} |\n`;
      if (style_categories.pylint) summary += `| ⚙️ Code Quality | ${style_categories.pylint} |\n`;
      if (style_categories.naming) summary += `| 🏷️ Naming Conventions | ${style_categories.naming} |\n`;
      if (style_categories.complexity) summary += `| 🔄 Complexity | ${style_categories.complexity} |\n`;
    }

    summary += `\n</details>\n\n`;

    // Priority message
    if (critical_count > 0 || high_count > 0) {
      summary += `> **⚠️ Priority:** Please review the ${critical_count + high_count} high-priority security ${(critical_count + high_count) === 1 ? 'issue' : 'issues'} before merging.\n\n`;
    } else if (hasVulnerabilities) {
      summary += `> **📋 Review:** Security findings detected. Please review the recommendations below.\n\n`;
    }

    if (hasStyleIssues) {
      summary += `> **💡 Tip:** Addressing code quality suggestions will improve maintainability.\n\n`;
    }

    summary += `---\n\n`;
    summary += `**Next Steps:**\n`;
    summary += `- Review detailed comments below\n`;
    summary += `- Apply recommended fixes\n`;
    summary += `- Re-run analysis after changes\n\n`;

    summary += `<sub>Powered by **CodeSentry** • Analysis based on OWASP guidelines</sub>`;

    return summary;
  }

  /**
   * Format batched style issues comment (CodeRabbit-style)
   */
  formatBatchedStyleComment(styleIssues, fileName) {
    if (!styleIssues || styleIssues.length === 0) return null;

    // Group by category
    const grouped = {};
    styleIssues.forEach(issue => {
      const category = issue.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(issue);
    });

    let comment = `## 💎 Code Quality Review\n\n`;
    comment += `**File:** \`${fileName}\`\n\n`;
    comment += `![Suggestions](https://img.shields.io/badge/Total_Suggestions-${styleIssues.length}-blue)\n\n`;
    comment += `> **Quality Improvements:** ${styleIssues.length} ${styleIssues.length > 1 ? 'suggestions' : 'suggestion'} to enhance code maintainability.\n\n`;
    comment += `---\n\n`;

    // Show each category
    Object.keys(grouped).forEach(category => {
      const issues = grouped[category];
      const categoryName = this.formatCategoryNameHuman(category);
      const emoji = this.getCategoryEmoji(category);

      comment += `### ${emoji} ${categoryName}\n\n`;

      issues.forEach((issue, index) => {
        comment += `<details>\n`;
        comment += `<summary><strong>${index + 1}. Line ${issue.line}</strong>${issue.code ? ` • \`${issue.code}\`` : ''}</summary>\n\n`;

        comment += `**Issue:**\n`;
        comment += `${issue.message}\n\n`;

        comment += `**💡 Suggestion:**\n`;
        comment += `${issue.recommendation}\n\n`;

        // Add helpful context
        const context = this.getCategoryContext(category);
        if (context) {
          comment += `**Why this matters:**\n`;
          comment += `${context}\n\n`;
        }

        comment += `</details>\n\n`;
      });
    });

    comment += `---\n\n`;
    comment += `<sub>Powered by **CodeSentry** • Based on PEP 8 and best practices</sub>`;

    return comment;
  }

  // Helper methods
  getSeverityEmoji(severity) {
    const emojis = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };
    return emojis[severity] || '⚪';
  }

  getCategoryEmoji(category) {
    const emojis = {
      'pep8': '📝',
      'pylint': '⚙️',
      'naming': '🏷️',
      'complexity': '🔄',
      'unused_import': '📦',
      'unused_variable': '🗑️',
      'class_name': '🏛️',
      'function_name': '⚡',
    };
    return emojis[category] || '💡';
  }

  getSeverityLabel(severity) {
    const labels = {
      critical: 'Critical Priority',
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    };
    return labels[severity] || severity.charAt(0).toUpperCase() + severity.slice(1);
  }

  formatVulnTypeHuman(type) {
    if (!type) return 'Security Issue';

    const typeMap = {
      'sql_injection': 'SQL Injection Vulnerability',
      'cross_site_scripting': 'Cross-Site Scripting (XSS)',
      'authentication_bypass': 'Authentication Bypass',
      'broken_access_control': 'Access Control Issue',
      'sensitive_data_exposure': 'Sensitive Data Exposure',
      'xml_external_entities': 'XML External Entity (XXE)',
      'insecure_deserialization': 'Insecure Deserialization',
      'security_misconfiguration': 'Security Misconfiguration',
      'injection_flaw': 'Injection Vulnerability',
      'insecure_dependencies': 'Vulnerable Dependency',
      'hardcoded_secret': 'Hardcoded Secret',
      'weak_crypto': 'Weak Cryptography',
    };

    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatCategoryNameHuman(category) {
    const names = {
      'pep8': 'PEP 8 Style Guidelines',
      'pylint': 'Code Quality & Best Practices',
      'naming': 'Naming Conventions',
      'complexity': 'Code Complexity',
      'class_name': 'Class Naming',
      'function_name': 'Function Naming',
      'constant_name': 'Constant Naming',
      'unused_import': 'Unused Imports',
      'unused_variable': 'Unused Variables'
    };
    return names[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getSecurityContext(type, severity) {
    const contexts = {
      'sql_injection': 'SQL injection allows attackers to manipulate database queries, potentially leading to unauthorized data access, modification, or deletion.',
      'cross_site_scripting': 'XSS vulnerabilities enable attackers to inject malicious scripts that execute in users\' browsers, potentially stealing sensitive data or hijacking sessions.',
      'authentication_bypass': 'Authentication flaws can allow unauthorized access to protected resources or user accounts, compromising system security.',
      'sensitive_data_exposure': 'Exposing sensitive information like passwords, API keys, or personal data creates significant security risks and compliance issues.',
      'broken_access_control': 'Access control weaknesses enable users to perform actions or access data beyond their authorized permissions.',
      'insecure_deserialization': 'Insecure deserialization can lead to remote code execution, allowing attackers to run arbitrary code on your server.',
      'security_misconfiguration': 'Security misconfigurations often provide attackers with easy entry points into your application.',
      'injection_flaw': 'Injection vulnerabilities allow attackers to send malicious input that gets executed as code or commands.',
      'hardcoded_secret': 'Hardcoded secrets in source code can be easily discovered by attackers, compromising your entire system.',
      'weak_crypto': 'Weak cryptographic algorithms or implementations can be broken by attackers, exposing sensitive data.',
    };

    return contexts[type] || 'This security issue requires attention to prevent potential exploitation.';
  }

  getCategoryContext(category) {
    const contexts = {
      'pep8': 'Following PEP 8 improves code readability and helps maintain consistency across the codebase.',
      'pylint': 'Addressing code quality issues reduces bugs and makes the code easier to maintain.',
      'naming': 'Consistent naming conventions help developers understand code purpose and structure quickly.',
      'complexity': 'Reducing complexity makes code easier to test, debug, and maintain.',
      'unused_import': 'Removing unused imports keeps the codebase clean and reduces unnecessary dependencies.',
      'unused_variable': 'Eliminating unused variables improves code clarity and prevents confusion.',
    };
    return contexts[category] || null;
  }
}

module.exports = new CommentFormatter();
