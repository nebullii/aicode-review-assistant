import { useState, useEffect } from 'react';
import { reportsAPI, repositoryAPI } from '../services/api';
import PRAnalysisModal from '../components/PRAnalysisModal';

const ReportsPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedRepo, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analyses with filters
      const filters = {};
      if (selectedRepo) filters.repository_id = selectedRepo;
      if (selectedStatus) filters.status = selectedStatus;
      filters.limit = 100;

      const [analysesData, summaryData, reposData] = await Promise.all([
        reportsAPI.getPRAnalyses(filters),
        reportsAPI.getSummary(),
        repositoryAPI.getRepositories()
      ]);

      setAnalyses(analysesData.analyses);
      setSummary(summaryData.summary);
      setRepositories(reposData.repositories);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (analysis) => {
    try {
      const detailsData = await reportsAPI.getPRAnalysisDetails(analysis.id);
      setSelectedAnalysis(detailsData.analysis);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to fetch analysis details:', err);
      alert('Failed to load analysis details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      received: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
    return badges[status] || badges.received;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PR Analysis Reports</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View detailed reports of all pull request security analyses
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_analyses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.failed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 7 Days</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.recent_7_days}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Repositories</option>
              {repositories.filter(r => r.is_connected).map(repo => (
                <option key={repo.github_id} value={repo.id}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="received">Received</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedRepo('');
                setSelectedStatus('');
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Analyses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pull Request Analyses ({analyses.length})
          </h2>
        </div>

        {analyses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No analyses found. Connect a repository and create a pull request to see results here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    PR Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysis.repository_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={analysis.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        #{analysis.pr_number}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(analysis.status)}`}>
                        {analysis.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(analysis.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(analysis.processing_time_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(analysis)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analysis Details Modal */}
      {showModal && selectedAnalysis && (
        <PRAnalysisModal
          analysis={selectedAnalysis}
          onClose={() => {
            setShowModal(false);
            setSelectedAnalysis(null);
          }}
        />
      )}
    </div>
  );
};

export default ReportsPage;

