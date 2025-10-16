import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Check for token in URL (from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    
    if (token) {
      localStorage.setItem('auth_token', token)
      // Clean up URL
      window.history.replaceState({}, document.title, location.pathname)
      // Fetch user data
      fetchUserData()
    } else {
      // Check for existing token
      const savedToken = localStorage.getItem('auth_token')
      if (savedToken) {
        fetchUserData()
      } else {
        setIsLoading(false)
      }
    }
  }, [location])

  const fetchUserData = async () => {
    try {
      const data = await authAPI.getMe()
      setUser(data.user)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('auth_token')
      setUser(null)
      setIsLoading(false)
    }
  }

  const loginWithGitHub = () => {
    authAPI.loginWithGitHub()
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    navigate('/')
  }

  const value = {
    user,
    loginWithGitHub,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
