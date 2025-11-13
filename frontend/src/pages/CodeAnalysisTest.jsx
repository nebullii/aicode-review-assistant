import { useState, useEffect } from 'react';
import { analysisAPI } from '../services/api';

const CodeAnalysisTest = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [serviceHealth, setServiceHealth] = useState(null);

  // Sample vulnerable code examples
  const examples = {
    sqlInjection: `const userId = req.query.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);`,
    xss: `const userInput = req.body.comment;
document.getElementById("output").innerHTML = userInput;`,
    hardcodedCredentials: `const apiKey = "sk-1234567890abcdef";
const password = "admin123";
const dbConnection = "mongodb://admin:password@localhost:27017";`,
    pythonStyleIssues: `# Python code with style issues
import os,sys

class myClass:  # Should be MyClass
    def CalculateTotal(self, items):  # Should be calculate_total
        total=0
        for item in items:
            if item>0:
                    total+=item
        return total

API_KEY = "hardcoded-api-key-12345"
user_input = input("Enter data: ")
exec(user_input)  # Security vulnerability`,
  };

  // Check service health on mount
  useEffect(() => {
    checkHealth();
    loadHistory();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await analysisAPI.healthCheck();
      setServiceHealth(health);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await analysisAPI.getHistory(5);
      setHistory(data.analyses || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analysisAPI.analyzeCode({
        code: code,
        language: language,
        repository: 'test-repo',
        file_path: 'test.js',
      });

      setResult(analysisResult);
      loadHistory(); // Refresh history
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadExample = (exampleCode) => {
    setCode(exampleCode);
    setResult(null);
    setError(null);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      info: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[severity] || colors.info;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };
    return icons[severity] || '⚪';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Code Analysis Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI Security Vulnerability Detection
          </p>
        </div>
        
        {/* Service Health Badge */}
        {serviceHealth && (
          <div className={`px-4 py-2 rounded-lg ${
            serviceHealth.status === 'ok' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                serviceHealth.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="font-medium">Analysis Service {serviceHealth.status === 'ok' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Example Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Examples:
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadExample(examples.sqlInjection)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            SQL Injection
          </button>
          <button
            onClick={() => loadExample(examples.xss)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            XSS Vulnerability
          </button>
          <button
            onClick={() => loadExample(examples.hardcodedCredentials)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Hardcoded Credentials
          </button>
          <button
            onClick={() => {
              loadExample(examples.pythonStyleIssues);
              setLanguage('python');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Python Style + Security
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code to Analyze
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="php">PHP</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={analyzeCode}
                disabled={analyzing || !code.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  analyzing || !code.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Code'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Analysis Results
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Analysis ID: {result.analysis_id}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Security: {result.total_vulnerabilities} vulnerabilities</span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <span className="text-red-600">🔴 {result.critical_count}</span>
                  <span className="text-orange-600">🟠 {result.high_count}</span>
                  <span className="text-yellow-600">🟡 {result.medium_count}</span>
                  <span className="text-blue-600">🔵 {result.low_count}</span>
                </span>
              </div>
              {result.total_style_issues > 0 && (
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Style: {result.total_style_issues} issues</span>
                  {result.style_categories && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-2">
                        {result.style_categories.pep8 > 0 && <span>PEP8: {result.style_categories.pep8}</span>}
                        {result.style_categories.pylint > 0 && <span>Quality: {result.style_categories.pylint}</span>}
                        {result.style_categories.naming > 0 && <span>Naming: {result.style_categories.naming}</span>}
                        {result.style_categories.complexity > 0 && <span>Complexity: {result.style_categories.complexity}</span>}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security Vulnerabilities Section */}
          {result.vulnerabilities.length === 0 && (!result.style_issues || result.style_issues.length === 0) ? (
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">✅</span>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Issues Detected!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Your code looks secure and follows best practices.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Security Vulnerabilities */}
              {result.vulnerabilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Security Vulnerabilities
                  </h3>
                  <div className="space-y-4">
                    {result.vulnerabilities.map((vuln, index) => (
                      <div
                        key={index}
                        className={`border-l-4 rounded-lg p-4 ${getSeverityColor(vuln.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getSeverityIcon(vuln.severity)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold uppercase">{vuln.severity}</span>
                              <span>•</span>
                              <span className="font-medium">{vuln.type.replace(/_/g, ' ').toUpperCase()}</span>
                              <span>•</span>
                              <span className="text-sm">Line {vuln.line_number}</span>
                              <span>•</span>
                              <span className="text-sm">Confidence: {(vuln.confidence * 100).toFixed(0)}%</span>
                            </div>

                            <p className="text-sm mb-2">
                              <strong>Description:</strong> {vuln.description}
                            </p>

                            {vuln.code_snippet && (
                              <div className="bg-white/50 dark:bg-gray-900/50 rounded p-2 mb-2">
                                <code className="text-xs font-mono">{vuln.code_snippet}</code>
                              </div>
                            )}

                            <p className="text-sm">
                              <strong>Recommendation:</strong> {vuln.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Issues */}
              {result.style_issues && result.style_issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Style Issues
                  </h3>
                  <div className="space-y-4">
                    {result.style_issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`border-l-4 rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">📋</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold uppercase">{issue.severity}</span>
                              <span>•</span>
                              <span className="font-medium">{issue.category.toUpperCase()}</span>
                              <span>•</span>
                              <span className="text-sm">Code: {issue.code}</span>
                              <span>•</span>
                              <span className="text-sm">Line {issue.line}</span>
                            </div>

                            <p className="text-sm mb-2">
                              <strong>Issue:</strong> {issue.message}
                            </p>

                            <p className="text-sm">
                              <strong>Recommendation:</strong> {issue.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Analysis History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Analysis History
          </h2>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.language} - {item.total_vulnerabilities} vulnerabilities
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.severity_counts && (
                      <>
                        {item.severity_counts.critical > 0 && (
                          <span className="text-red-600">🔴 {item.severity_counts.critical}</span>
                        )}
                        {item.severity_counts.high > 0 && (
                          <span className="text-orange-600">🟠 {item.severity_counts.high}</span>
                        )}
                        {item.severity_counts.medium > 0 && (
                          <span className="text-yellow-600">🟡 {item.severity_counts.medium}</span>
                        )}
                        {item.severity_counts.low > 0 && (
                          <span className="text-blue-600">🔵 {item.severity_counts.low}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeAnalysisTest;