'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  decodeJwt,
  getToken,
  setToken,
  type Role,
  type UserProfile,
} from './api'

interface AuthState {
  user: UserProfile | null
  roles: Role[]
  loading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const hydrateFromToken = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setRoles([])
      setLoading(false)
      return
    }
    const payload = decodeJwt(token)
    if (!payload || payload.exp * 1000 < Date.now()) {
      setToken(null)
      setUser(null)
      setRoles([])
      setLoading(false)
      return
    }
    setRoles(payload.roles ?? [])
    try {
      const me = await api.auth.me()
      setUser(me)
    } catch {
      setToken(null)
      setUser(null)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrateFromToken()
  }, [hydrateFromToken])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    setToken(res.accessToken)
    const payload = decodeJwt(res.accessToken)
    setRoles(payload?.roles ?? [])
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setRoles([])
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      roles,
      loading,
      login,
      logout,
      refresh: hydrateFromToken,
    }),
    [user, roles, loading, login, logout, hydrateFromToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function isAdmin(roles: Role[]): boolean {
  return roles.includes('ROLE_ADMIN')
}

export function isImam(roles: Role[]): boolean {
  return roles.includes('ROLE_IMAM')
}
