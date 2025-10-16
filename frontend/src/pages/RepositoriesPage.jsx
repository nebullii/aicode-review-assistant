import { useState, useEffect } from 'react'
import { repositoryAPI } from '../services/api'

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const data = await repositoryAPI.getRepositories()
      setRepositories(data.repositories || [])
      setError(null)
    } catch (err) {
      setError('Failed to fetch repositories')
      console.error('Error fetching repositories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectRepo = async (repo) => {
    try {
      await repositoryAPI.connectRepository({
        github_id: repo.github_id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
      })
      // Refresh the list
      fetchRepositories()
    } catch (err) {
      console.error('Error connecting repository:', err)
      alert('Failed to connect repository')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading repositories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Repositories</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect Python repositories to enable AI code reviews
            </p>
          </div>
          <button
            onClick={fetchRepositories}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Repository List */}
      {repositories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center transition-colors">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Python repositories found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Make sure you have Python repositories in your GitHub account
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {repositories.map((repo) => (
            <div
              key={repo.github_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {repo.name}
                    </h3>
                    {repo.private && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {repo.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {repo.stargazers_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      {repo.language || 'Python'}
                    </span>
                    <span>{repo.full_name}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {repo.is_connected ? (
                    <button
                      disabled
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-not-allowed opacity-75"
                    >
                      ✓ Connected
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectRepo(repo)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RepositoriesPage

