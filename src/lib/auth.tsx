'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, type UserProfile, type WebUserType } from './api'
import { supabase } from './supabaseClient'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  /**
   * E-mail/şifre ile Supabase'e giriş yapar, profilini backend'den çeker ve
   * CEMAAT ise oturumu kapatıp `WebPanelForbiddenError` fırlatır.
   */
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/// CEMAAT kullanıcısı web paneline giriş yapmaya çalışırsa fırlatılır.
/// Login ekranı bunu yakalayıp anlaşılır mesaj gösterir.
export class WebPanelForbiddenError extends Error {
  constructor() {
    super('Bu panel yalnız İMAM ve YÖNETİCİ rolleri içindir.')
    this.name = 'WebPanelForbiddenError'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  // İlk hydrate ile auth-state-stream race koşmasın diye küçük bir bayrak.
  const initialHydrateDone = useRef(false)

  const refresh = useCallback(async () => {
    const session = (await supabase().auth.getSession()).data.session
    if (!session) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.auth.me()
      // CEMAAT panel'e giremez — sessizce sign-out ediyoruz.
      if (me.type === 'CEMAAT') {
        await supabase().auth.signOut()
        setUser(null)
        return
      }
      setUser(me)
    } catch (err) {
      // /api/users/me 401 → token geçersiz ya da WebUser provisioning eksik.
      // Sign-out + login'e fallback.
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        await supabase().auth.signOut()
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh().then(() => {
      initialHydrateDone.current = true
    })

    const { data: sub } = supabase().auth.onAuthStateChange((event) => {
      if (!initialHydrateDone.current) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void refresh()
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase().auth.signInWithPassword({ email, password })
      if (error) {
        throw new ApiError(error.status ?? 401, error.message)
      }
      const me = await api.auth.me()
      if (me.type === 'CEMAAT') {
        await supabase().auth.signOut()
        throw new WebPanelForbiddenError()
      }
      setUser(me)
      return me
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase().auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function isAdmin(user: UserProfile | null | undefined): boolean {
  return user?.type === 'ADMIN'
}

export function isImam(user: UserProfile | null | undefined): boolean {
  return user?.type === 'IMAM'
}

export type { WebUserType }
