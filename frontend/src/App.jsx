import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './components/HomePage'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import RepositoriesPage from './pages/RepositoriesPage'
import ReportsPage from './pages/ReportsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SupportPage from './pages/SupportPage'
import ProfilePage from './pages/ProfilePage'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/" replace />
}

// 404 Not Found Page
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
        <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">Go back home</a>
      </div>
    </div>
  )
}

// App Routes component (inside providers)
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="repositories" element={<RepositoriesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
