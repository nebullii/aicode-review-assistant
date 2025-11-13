class CommentFormatter {
  /**
   * SCRUM-88: Format vulnerability as GitHub comment
   */
  formatVulnerabilityComment(vulnerability) {
    const vulnType = this.formatVulnTypeHuman(vulnerability.type);
    const context = this.getSecurityContext(vulnerability.type, vulnerability.severity);

    let comment = `**${vulnType}** (${vulnerability.severity})\n\n`;
    comment += `${context}${vulnerability.description}\n\n`;

    if (vulnerability.code_snippet) {
      comment += `The concerning code:\n\`\`\`python\n${vulnerability.code_snippet}\n\`\`\`\n\n`;
    }

    comment += `**How to fix this:**\n${vulnerability.recommendation}\n\n`;

    if (vulnerability.confidence < 0.7) {
      comment += `_Note: This might be a false positive. Please review the context to confirm._\n\n`;
    }

    comment += `---\n_Automated security analysis_`;

    return comment;
  }

  /**
   * SCRUM-88: Format summary comment
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

    if (!hasVulnerabilities && !hasStyleIssues) {
      return `## Code Review: \`${fileName}\` ✓

Great work! I've reviewed this file and didn't find any security vulnerabilities or significant code quality issues. The code looks clean and follows best practices.

---
_Automated code review_`;
    }

    let summary = `## Code Review Summary: \`${fileName}\`\n\n`;

    // Add opening statement based on severity
    if (critical_count > 0 || high_count > 0) {
      summary += `Thanks for the PR! I've reviewed this file and found some items that need attention before merging.\n\n`;
    } else {
      summary += `I've reviewed this file and found a few minor items worth addressing to improve code quality.\n\n`;
    }

    // Security section
    if (hasVulnerabilities) {
      summary += `### Security Findings\n\n`;

      if (critical_count > 0 || high_count > 0) {
        summary += `There ${(critical_count + high_count) === 1 ? 'is' : 'are'} **${critical_count + high_count}** ${(critical_count + high_count) === 1 ? 'issue' : 'issues'} that could impact application security:\n\n`;
      }

      summary += `| Severity | Count |\n`;
      summary += `|----------|-------|\n`;
      if (critical_count > 0) summary += `| Critical | ${critical_count} |\n`;
      if (high_count > 0) summary += `| High | ${high_count} |\n`;
      if (medium_count > 0) summary += `| Medium | ${medium_count} |\n`;
      if (low_count > 0) summary += `| Low | ${low_count} |\n`;
      summary += `\n`;
    }

    // Style section
    if (hasStyleIssues) {
      summary += `### Code Quality Suggestions\n\n`;
      summary += `I also noticed **${total_style_issues}** style/quality improvements that would make the code more maintainable:\n\n`;

      if (Object.keys(style_categories).length > 0) {
        summary += `| Category | Count |\n`;
        summary += `|----------|-------|\n`;
        if (style_categories.pep8) summary += `| PEP 8 Compliance | ${style_categories.pep8} |\n`;
        if (style_categories.pylint) summary += `| Code Quality | ${style_categories.pylint} |\n`;
        if (style_categories.naming) summary += `| Naming Conventions | ${style_categories.naming} |\n`;
        if (style_categories.complexity) summary += `| Code Complexity | ${style_categories.complexity} |\n`;
        summary += `\n`;
      }
    }

    summary += `I've added detailed comments with specific recommendations. Let me know if you have any questions or want to discuss any of these findings!\n\n`;
    summary += `---\n_Automated review - Please verify findings in context_`;

    return summary;
  }

  /**
   * Format style issue as GitHub comment
   */
  formatStyleIssueComment(styleIssue) {
    const categoryName = this.formatCategoryNameHuman(styleIssue.category);

    let comment = `**${categoryName}**${styleIssue.code ? `: ${styleIssue.code}` : ''}\n\n`;
    comment += `${styleIssue.message}\n\n`;
    comment += `**Suggestion:** ${styleIssue.recommendation}\n\n`;
    comment += `---\n_Code quality suggestion_`;

    return comment;
  }

  /**
   * Format batched security vulnerabilities comment
   * Groups all vulnerabilities for a file into one comment
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

    // Introductory message
    let comment = `## Security Review for \`${fileName}\`\n\n`;

    if (grouped.critical.length > 0) {
      comment += `Hey team, I found some **security concerns** in this file that need attention. `;
      comment += `There ${grouped.critical.length === 1 ? 'is' : 'are'} **${grouped.critical.length}** critical ${grouped.critical.length === 1 ? 'issue' : 'issues'} that should be addressed before merging.\n\n`;
    } else {
      comment += `I've reviewed the security aspects of this code and found **${vulnerabilities.length}** ${vulnerabilities.length === 1 ? 'issue' : 'issues'} worth discussing.\n\n`;
    }

    // Show each severity group with conversational tone
    const severities = ['critical', 'high', 'medium', 'low'];
    severities.forEach(severity => {
      const issues = grouped[severity];
      if (issues.length === 0) return;

      const severityLabel = this.getSeverityLabel(severity);
      comment += `### ${severityLabel} ${issues.length === 1 ? 'Issue' : 'Issues'}\n\n`;

      issues.forEach((vuln, index) => {
        const vulnType = this.formatVulnTypeHuman(vuln.type);
        comment += `**${index + 1}. ${vulnType} (Line ${vuln.line_number})**\n\n`;

        // Add context about why this matters
        comment += this.getSecurityContext(vuln.type, severity);
        comment += `${vuln.description}\n\n`;

        // Show code snippet if available
        if (vuln.code_snippet) {
          comment += `The concerning code:\n\`\`\`python\n${vuln.code_snippet}\n\`\`\`\n\n`;
        }

        // Recommendation with conversational tone
        comment += `**How to fix this:**\n${vuln.recommendation}\n\n`;

        // Only show confidence if it's low (to express uncertainty)
        if (vuln.confidence < 0.7) {
          comment += `_Note: This might be a false positive. Please review the context to confirm._\n\n`;
        }
      });
    });

    comment += `---\n_Automated security analysis - Please review and verify these findings_`;
    return comment;
  }

  /**
   * Format batched style issues comment
   * Groups all style issues for a file into one comment
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

    let comment = `## Code Style Review for \`${fileName}\`\n\n`;
    comment += `I noticed some style and code quality items that would improve the maintainability of this code. `;
    comment += `Found **${styleIssues.length}** ${styleIssues.length > 1 ? 'suggestions' : 'suggestion'} worth addressing:\n\n`;

    // Show each category
    Object.keys(grouped).forEach(category => {
      const issues = grouped[category];
      const categoryName = this.formatCategoryNameHuman(category);
      comment += `### ${categoryName}\n\n`;

      issues.forEach((issue, index) => {
        comment += `**${index + 1}. Line ${issue.line}:** ${issue.message}\n\n`;
        comment += `${issue.recommendation}\n\n`;

        // Add helpful context for certain categories
        if (category === 'naming') {
          comment += `_Following consistent naming conventions helps the team understand the code more quickly._\n\n`;
        } else if (category === 'complexity') {
          comment += `_Reducing complexity makes the code easier to test and maintain._\n\n`;
        }
      });
    });

    comment += `---\n_These are suggestions to improve code quality. Feel free to discuss if you have questions!_`;
    return comment;
  }

  formatCategoryName(category) {
    const names = {
      'pep8': 'PEP 8 Violations',
      'pylint': 'Code Quality',
      'naming': 'Naming Conventions',
      'complexity': 'Code Complexity',
      'class_name': 'Class Naming',
      'function_name': 'Function Naming',
      'constant_name': 'Constant Naming'
    };
    return names[category] || category.toUpperCase();
  }

  formatCategoryNameHuman(category) {
    const names = {
      'pep8': 'PEP 8 Style Guidelines',
      'pylint': 'Code Quality & Best Practices',
      'naming': 'Naming Convention Suggestions',
      'complexity': 'Code Complexity Concerns',
      'class_name': 'Class Naming',
      'function_name': 'Function Naming',
      'constant_name': 'Constant Naming',
      'unused_import': 'Unused Imports',
      'unused_variable': 'Unused Variables'
    };
    return names[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      'insecure_dependencies': 'Vulnerable Dependency'
    };

    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getSecurityContext(type, severity) {
    const contexts = {
      'sql_injection': 'SQL injection vulnerabilities can allow attackers to manipulate database queries, potentially leading to data theft or modification. ',
      'cross_site_scripting': 'XSS vulnerabilities let attackers inject malicious scripts that run in other users\' browsers, which could steal session tokens or sensitive data. ',
      'authentication_bypass': 'Authentication issues can allow unauthorized access to protected resources or user accounts. ',
      'sensitive_data_exposure': 'Exposing sensitive data like passwords, API keys, or personal information in code is a serious security risk. ',
      'broken_access_control': 'Access control issues can let users access resources or perform actions they shouldn\'t be able to. ',
      'insecure_deserialization': 'Insecure deserialization can lead to remote code execution or other severe attacks. ',
      'security_misconfiguration': 'Security misconfigurations often provide attackers with easy entry points into your system. ',
      'injection_flaw': 'Injection vulnerabilities allow attackers to send malicious input that gets executed as code or commands. '
    };

    if (severity === 'critical' || severity === 'high') {
      return contexts[type] || 'This security issue could significantly impact your application. ';
    }
    return contexts[type] || '';
  }

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

  getSeverityBadge(severity) {
    return severity.toUpperCase();
  }
}

module.exports = new CommentFormatter();