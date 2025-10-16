import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
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
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
