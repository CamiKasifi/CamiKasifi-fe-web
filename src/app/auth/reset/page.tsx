'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Button, ErrorBanner, Input, Label, Spinner } from '@/components/ui'
import { MosqueLogo } from '@/components/MosqueLogo'
import { supabase } from '@/lib/supabaseClient'

// Recovery / şifre belirleme akışı landing'i. Supabase mail içindeki linke
// `#access_token=...&type=recovery` koyar; supabaseClient `detectSessionInUrl:true`
// ile bu token'ı tüketip geçici bir auth session'u açar. Bu sayfa o session içinde
// yeni şifre formunu gösterir; submit `auth.updateUser({password})` yapar.
export default function ResetPasswordPage() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState<'pending' | 'ok' | 'missing'>(
    'pending',
  )
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // detectSessionInUrl true olduğu için SDK init sırasında hash tüketilir.
    // Burada onAuthStateChange dinleyip "PASSWORD_RECOVERY" event'ini bekliyoruz;
    // event gelmezse zaten oturum açmış bir kullanıcı olabilir → ona da formu göster.
    const client = supabase()
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady('ok')
      }
    })

    // Mevcut session'a bak — link'in zaten işlenmiş olabileceği durum.
    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady('ok')
      } else {
        // Hash henüz işlenmemişse kısa süre bekle; sonra hâlâ yoksa "geçersiz link".
        const t = setTimeout(() => {
          client.auth.getSession().then(({ data: d2 }) => {
            setSessionReady(d2.session ? 'ok' : 'missing')
          })
        }, 800)
        return () => clearTimeout(t)
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setSubmitting(true)
    try {
      const { error: authError } = await supabase().auth.updateUser({ password })
      if (authError) {
        setError(authError.message)
        return
      }
      setSuccess(true)
      // 1.5 sn sonra login'e yönlendir; AuthProvider state'i tazelesin diye signOut.
      setTimeout(async () => {
        await supabase().auth.signOut()
        router.replace('/login')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre güncellenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-8">
      <header className="mb-6 flex flex-col items-center text-center">
        <MosqueLogo className="h-16 w-16 ring-2 ring-gold/40" />
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
          Şifreni Belirle
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Yeni şifren en az 8 karakter olmalı. Belirledikten sonra giriş sayfasına
          yönlendirileceksin.
        </p>
      </header>

      <section className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
          {sessionReady === 'pending' ? (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Bağlantı doğrulanıyor…
            </div>
          ) : sessionReady === 'missing' ? (
            <div className="space-y-3 px-6 py-8 text-sm">
              <ErrorBanner message="Bağlantı geçersiz veya süresi dolmuş. Giriş ekranındaki 'Şifremi unuttum' ile yeni bir e-posta talep et." />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.replace('/login')}
              >
                Giriş ekranına dön
              </Button>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <ShieldCheck className="h-10 w-10 text-success" />
              <p className="text-sm font-medium text-foreground">
                Şifren güncellendi. Yönlendiriliyorsun…
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 px-6 py-6" noValidate>
              <ErrorBanner message={error} />

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Yeni şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Yeni şifre (tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                <KeyRound className="h-4 w-4" /> Şifreyi belirle
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
