import React, { createContext, useContext, useState, useEffect } from 'react'
import api, { setAccessToken } from '../api/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try refresh on mount
    async function init() {
      try {
        const res = await api.post('/api/auth/refresh')
        const token = res.data.accessToken
        setAccessToken(token)
        setUser(res.data.user)
      } catch (e) {
        setUser(null)
        setAccessToken(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    setAccessToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
