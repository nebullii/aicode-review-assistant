import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Repositories', href: '/dashboard/repositories', icon: '📁' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
    { name: 'Subscription', href: '/dashboard/subscription', icon: '💳' },
    { name: 'Support', href: '/dashboard/support', icon: '💬' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors">
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🤖</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Code Review AI</span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Theme Toggle & User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 mb-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.github_username} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span>👤</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.github_username || user?.name || 'User'}
              </p>
              <button
                onClick={logout}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 transition-colors">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout

