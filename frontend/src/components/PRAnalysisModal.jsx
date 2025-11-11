const PRAnalysisModal = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[severity] || colors.low;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              PR Analysis Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {analysis.repository_name} - PR #{analysis.pr_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-1 capitalize">
                {analysis.status}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Started</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {formatDate(analysis.started_at)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {formatDate(analysis.completed_at)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vulnerabilities</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {analysis.total_vulnerabilities || 0}
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          {analysis.severity_counts && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Severity Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {analysis.severity_counts.critical}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {analysis.severity_counts.high}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">High</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {analysis.severity_counts.medium}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {analysis.severity_counts.low}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Low</div>
                </div>
              </div>
            </div>
          )}

          {/* Vulnerabilities List */}
          {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detected Vulnerabilities ({analysis.vulnerabilities.length})
              </h3>
              <div className="space-y-4">
                {analysis.vulnerabilities.map((vuln, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {vuln.type?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
                          </span>
                        </div>
                        {vuln.file_path && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            File: {vuln.file_path} {vuln.line_number && `(Line ${vuln.line_number})`}
                          </div>
                        )}
                      </div>
                      {vuln.confidence && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Confidence: {Math.round(vuln.confidence * 100)}%
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description:
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {vuln.description}
                        </div>
                      </div>

                      {vuln.code_snippet && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Code:
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                            <code>{vuln.code_snippet}</code>
                          </pre>
                        </div>
                      )}

                      {vuln.recommendation && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recommendation:
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {vuln.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-green-500 dark:text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                No Vulnerabilities Found
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-2">
                Great job! This PR passed the security analysis.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <a
            href={analysis.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View PR on GitHub
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PRAnalysisModal;
