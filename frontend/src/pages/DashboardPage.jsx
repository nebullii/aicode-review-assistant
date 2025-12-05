import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { repositoryAPI } from '../services/api'
import WebhookEventViewer from '../components/WebhookEventViewer'

const DashboardPage = () => {
  const { user } = useAuth()
  const [connectedRepoCount, setConnectedRepoCount] = useState(0)
  const [analysisSummary, setAnalysisSummary] = useState({
    total_analyses: 0,
    completed: 0,
    failed: 0,
    recent_7_days: 0
  })
  const [demoEmbedReady, setDemoEmbedReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const repoData = await repositoryAPI.getConnectedCount()
        setConnectedRepoCount(repoData.count)

        const summaryData = await repositoryAPI.getSummary()
        setAnalysisSummary(summaryData.summary)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Repositories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : connectedRepoCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Analyses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : analysisSummary.total_analyses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Failed Analyses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : analysisSummary.failed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : analysisSummary.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live product demo
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">See the review assistant in action</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Follow the guided walk-through to connect GitHub, trigger an analysis, and review the findings end-to-end.</p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connect repositories and enable webhooks.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run a pull request analysis and capture alerts.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Review findings on the dashboard and share results.
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 md:border-t-0 md:border-l">
            <div className="p-4">
              <div className="relative aspect-video min-h-[240px] rounded-lg overflow-hidden shadow-sm bg-black">
                {!demoEmbedReady && (
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full flex items-center justify-center group"
                    onClick={() => setDemoEmbedReady(true)}
                    aria-label="Play demo video"
                  >
                    <img
                      src="https://img.youtube.com/vi/ygxZAEhTOJc/hqdefault.jpg"
                      alt="Demo video preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                    <div className="relative flex items-center gap-3 bg-white/90 text-gray-900 px-4 py-2 rounded-full shadow-lg border border-gray-200">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.5 5.5a1 1 0 011.53-.848l6 4a1 1 0 010 1.696l-6 4A1 1 0 016.5 14.5v-8z" />
                      </svg>
                      <span className="text-sm font-semibold">Play demo</span>
                    </div>
                  </button>
                )}

                {demoEmbedReady && (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/ygxZAEhTOJc?rel=0&modestbranding=1"
                    title="Product demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Click to stream from YouTube; no large assets load until you play.</span>
                <a href="https://www.youtube.com/watch?v=ygxZAEhTOJc" className="font-medium text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noreferrer">Open in YouTube</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <WebhookEventViewer />
    </div>
  )
}

export default DashboardPage
