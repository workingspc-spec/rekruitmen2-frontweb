import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [token, logout])

  // Intercept 401 globally
  useEffect(() => {
    const id = api.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) logout()
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(id)
  }, [logout])

  const login = useCallback(async (username, password, expiredDays) => {
    const { data } = await api.post('/auth/login', { username, password, expiredDays })
    const { token: t, user: u } = data.data
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
    return u
  }, [])

  const isHrd = user?.is_hrd === 1

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isHrd }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}