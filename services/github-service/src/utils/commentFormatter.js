class CommentFormatter {
  /**
   * SCRUM-88: Format vulnerability as GitHub comment
   */
  formatVulnerabilityComment(vulnerability) {
    const severityEmoji = this.getSeverityEmoji(vulnerability.severity);
    const severityBadge = this.getSeverityBadge(vulnerability.severity);
    
    return `${severityEmoji} **${severityBadge}** - ${vulnerability.type.replace(/_/g, ' ').toUpperCase()}

**Description:** ${vulnerability.description}

**Code:**
\`\`\`python
${vulnerability.code_snippet}
\`\`\`

**✅ Recommendation:** ${vulnerability.recommendation}

**Confidence:** ${(vulnerability.confidence * 100).toFixed(0)}%

---
*🤖 AI Code Review Assistant - SCRUM-87, 97, 99*`;
  }

  /**
   * SCRUM-88: Format summary comment
   */
  formatSummaryComment(fileName, analysisResult) {
    const { total_vulnerabilities, critical_count, high_count, medium_count, low_count } = analysisResult;
    
    if (total_vulnerabilities === 0) {
      return `## ✅ No Security Issues Found in \`${fileName}\`

Great job! No security vulnerabilities detected in this Python file.

---
*AI Code Review Assistant*`;
    }

    return `## 🔍 Security Analysis Results for \`${fileName}\`

**Total Vulnerabilities Found:** ${total_vulnerabilities}

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${critical_count} |
| 🟠 High | ${high_count} |
| 🟡 Medium | ${medium_count} |
| 🔵 Low | ${low_count} |

Please review the inline comments on specific lines for details and recommendations.

---
*🤖 AI Code Review Assistant - SCRUM-87, 97, 99*`;
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