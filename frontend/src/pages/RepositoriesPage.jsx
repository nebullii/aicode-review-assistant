import { useState, useEffect } from 'react'
import { repositoryAPI } from '../services/api'

const CACHE_KEY = 'repositories_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState(() => {
    // Load from cache on mount
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data
        }
      } catch (e) {
        // Invalid cache, ignore
      }
    }
    return []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if we have valid cache
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          // Cache is valid, skip fetch
          return
        }
      } catch (e) {
        // Invalid cache, fetch
      }
    }
    // No valid cache, fetch
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const data = await repositoryAPI.getRepositories()
      const repos = data.repositories || []
      setRepositories(repos)
      setError(null)

      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: repos,
        timestamp: Date.now()
      }))
    } catch (err) {
      setError('Failed to fetch repositories')
      console.error('Error fetching repositories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectRepo = async (repo) => {
    // Validate required fields
    if (!repo || !repo.github_id || !repo.name || !repo.full_name) {
      setError('Invalid repository data. Missing required fields.')
      return
    }

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
      setError('Failed to connect repository. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Repositories</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect Python repositories to enable AI-powered code reviews
            </p>
          </div>
          <button
            onClick={fetchRepositories}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Repository List */}
      {!loading && repositories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center transition-colors">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Python repositories found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Make sure you have Python repositories in your GitHub account
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.github_id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {repo.name}
                        </h3>
                        {repo.private && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {repo.full_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {repo.description || 'No description available'}
                  </p>

                  <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {repo.stargazers_count || 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      {repo.language || 'Python'}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {repo.is_connected ? (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Connected
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnectRepo(repo)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
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

