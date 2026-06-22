import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token    = localStorage.getItem('auth_token')
    const saved    = localStorage.getItem('auth_user')
    if (token && saved) {
      try {
        setUser(JSON.parse(saved))
        setLoading(false)
        return
      } catch { /* fall through to API check */ }
    }

    // If token exists try to verify via /profile
    if (token) {
      api.get('/profile')
        .then(res => {
          const u = {
            username: res.data.username || 'User',
            role:     res.data.role     || 'STUDENT',
            fullName: res.data.full_name || ''
          }
          setUser(u)
          localStorage.setItem('auth_user', JSON.stringify(u))
        })
        .catch(() => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/login', { username, password })
    const { token, role, full_name } = res.data
    // Persist token and user info
    localStorage.setItem('auth_token', token)
    const u = {
      username: res.data.username,
      role,
      fullName: full_name
    }
    localStorage.setItem('auth_user', JSON.stringify(u))
    setUser(u)
    return res.data
  }

  const register = async (username, password, fullName = null, mobile = null) => {
    const res = await api.post('/register', { username, password, fullName, mobile })
    return res.data
  }

  const logout = async () => {
    await api.post('/logout').catch(() => {})
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
