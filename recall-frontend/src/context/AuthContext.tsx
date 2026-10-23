import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Synchronously read both the stored user and token from localStorage.
    const token = api.auth.getToken()
    const current = api.auth.getCurrentUser()
    if (token && current) {
      setUser(current)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // api.auth.login stores both token and user in localStorage automatically.
    const { user } = await api.auth.login(email, password)
    setUser(user)
  }

  const register = async (name: string, email: string, password: string) => {
    // api.auth.register stores both token and user in localStorage automatically.
    const { user } = await api.auth.register({ name, email, password })
    setUser(user)
  }

  const logout = () => {
    // api.auth.logout clears both token and user from localStorage.
    api.auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
