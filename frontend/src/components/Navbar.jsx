import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">AI Code Review Assistant</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.github_username} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{user.github_username || user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
