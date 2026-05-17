'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import {
  Button,
  Input,
  Label,
} from '@/components/ui'
import { MosqueLogo } from '@/components/MosqueLogo'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { login, user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, user, router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      router.replace('/dashboard')
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401 || err.status === 403
            ? 'E-posta veya şifre hatalı.'
            : err.message
          : 'Bağlantı kurulamadı. Lütfen tekrar deneyin.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-background px-5 py-8">
      {/* Decorative dome silhouette in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-accent"
        style={{
          clipPath:
            'path("M 0 0 L 400 0 L 400 140 C 360 140 320 160 280 200 C 260 220 240 260 200 260 C 160 260 140 220 120 200 C 80 160 40 140 0 140 Z")',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[260px] z-10"
      >
        <div className="arabesque-divider opacity-60" />
      </div>

      {/* Brand mark */}
      <header className="relative z-20 flex flex-col items-center pt-4 text-center">
        <MosqueLogo className="h-20 w-20 ring-2 ring-gold/40" />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-accent-foreground">
          Cami Kaşifi
        </h1>
        <p className="mt-1 text-sm text-gold-soft">
          Yönetim &amp; İmam Paneli
        </p>
      </header>

      {/* Form card */}
      <section className="relative z-20 mx-auto mt-10 w-full max-w-sm animate-fade-up">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
          <div className="border-b border-border bg-gradient-to-b from-muted/40 to-transparent px-6 pb-5 pt-6 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">
              Hoş geldin
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hesabınla devam et — cami ve cemaat işlerin seni bekliyor.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 px-6 py-6" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@camikasifi.com"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Yalnızca{' '}
          <strong className="font-semibold text-foreground/80">YÖNETİCİ</strong>{' '}
          ve <strong className="font-semibold text-foreground/80">İMAM</strong>{' '}
          rollerine açıktır.
        </p>
      </section>

      <footer className="relative z-20 mt-8 text-center text-[11px] text-muted-foreground">
        <p>“İnnemel-mü’minûne ihve.” — Mü’minler ancak kardeştir.</p>
      </footer>
    </div>
  )
}
