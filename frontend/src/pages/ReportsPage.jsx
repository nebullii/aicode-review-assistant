const ReportsPage = () => {
  const reports = []  // This will come from API later

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Code Analysis Reports</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View detailed analysis reports for your repositories
        </p>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center transition-colors">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reports yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Reports will appear here once you connect repositories and analyses are run
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Report cards will go here */}
        </div>
      )}
    </div>
  )
}

export default ReportsPage

