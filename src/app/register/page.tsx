'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import Link from 'next/link'
import { Check, Eye, EyeOff, MailCheck, Search } from 'lucide-react'
import {
  Button,
  ErrorBanner,
  Input,
  Label,
  Spinner,
} from '@/components/ui'
import { MosqueLogo } from '@/components/MosqueLogo'
import { supabase } from '@/lib/supabaseClient'
import { api, ApiError, type Mosque } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const TURNSTILE_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Cloudflare Turnstile global — yalnız kullandığımız metodlar.
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

/// İmam self-kayıt sayfası.
///
/// Akış: Supabase signUp (Turnstile captcha token'ı ile) → backend
/// `POST /api/imam-registrations` (CEMAAT profili + PENDING cami başvurusu) →
/// signOut → "başvurun alındı" ekranı. İMAM yetkisi yönetici onayında verilir.
export default function RegisterPage() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [note, setNote] = useState('')

  // Cami seçimi (tek).
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Mosque[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Turnstile.
  const captchaRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !captchaRef.current || !window.turnstile) return
      if (widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'auto',
        callback: (token) => setCaptchaToken(token),
        'error-callback': () => setCaptchaToken(null),
        'expired-callback': () => setCaptchaToken(null),
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existing = document.querySelector(
        `script[src="${TURNSTILE_SRC}"]`,
      )
      if (existing) {
        existing.addEventListener('load', renderWidget)
      } else {
        const script = document.createElement('script')
        script.src = TURNSTILE_SRC
        script.async = true
        script.defer = true
        script.addEventListener('load', renderWidget)
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
    }
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }

  // Debounced cami arama (350 ms).
  useEffect(() => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        setResults(await api.mosques.search({ q: trimmed, limit: 50 }))
      } catch {
        // Sessizce geç — kullanıcı tekrar deneyebilir.
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  const displayMosques = useMemo(() => {
    if (!selectedMosque) return results
    return [selectedMosque, ...results.filter((m) => m.id !== selectedMosque.id)]
  }, [selectedMosque, results])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedMosque) {
      setError('Lütfen bir cami seç.')
      return
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Lütfen doğrulamayı (captcha) tamamla.')
      return
    }

    setSubmitting(true)
    try {
      // 1) Supabase signUp (captcha Supabase tarafında doğrulanır).
      const { data, error: signUpError } = await supabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), surname: surname.trim() },
          ...(captchaToken ? { captchaToken } : {}),
        },
      })
      if (signUpError) {
        throw new ApiError(signUpError.status ?? 400, signUpError.message)
      }
      // E-posta doğrulaması açıksa session gelmez; akışı tamamlayamayız.
      if (!data.session) {
        setError(
          'Hesabın oluşturuldu fakat e-posta doğrulaması gerekiyor. ' +
            'E-postanı doğrulayıp giriş yaptıktan sonra başvurunu tamamlayabilirsin.',
        )
        return
      }

      // 2) Backend: profil + PENDING başvuru.
      await api.imamRegistrations.create({
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim() || null,
        mosqueId: selectedMosque.id,
        note: note.trim() || null,
        roleTitle: roleTitle.trim() || null,
      })

      // 3) Panel İMAM/YÖNETİCİ'ye açık; onaya kadar oturumu kapat.
      await supabase().auth.signOut()
      setDone(true)
    } catch (err) {
      resetCaptcha()
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? err.message
            : err.message || 'Kayıt tamamlanamadı.',
        )
      } else {
        setError(formatApiError(err, 'Kayıt tamamlanamadı.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-background px-5 py-10">
      <header className="mx-auto flex max-w-md flex-col items-center text-center">
        <MosqueLogo className="h-16 w-16 ring-2 ring-gold/40" />
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
          İmam Kaydı
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bilgilerini gir ve imamı olduğun camiye başvur. Başvurun yönetici
          onayından sonra aktifleşir.
        </p>
      </header>

      <section className="mx-auto mt-8 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
          {done ? (
            <div className="space-y-4 px-6 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Başvurun alındı
              </h2>
              <p className="text-sm text-muted-foreground">
                Hesabın oluşturuldu ve cami başvurun yöneticinin onayına
                gönderildi. Onaylandığında bu e-posta ve şifrenle giriş
                yapabilirsin.
              </p>
              <Link href="/login">
                <Button className="w-full">Giriş ekranına dön</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 px-6 py-6" noValidate>
              <ErrorBanner message={error} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Ad</Label>
                  <Input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-surname">Soyad</Label>
                  <Input
                    id="reg-surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">E-posta</Label>
                <Input
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@camikasifi.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="pr-11"
                    minLength={6}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone">Telefon</Label>
                  <Input
                    id="reg-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xx xxx xx xx"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-role">Görev / unvan</Label>
                  <Input
                    id="reg-role"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Kadrolu imam-hatip"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Cami</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cami adı ara…"
                    className="pl-9"
                    aria-label="Cami ara"
                  />
                </div>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-1">
                  {searching ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                      <Spinner className="h-3.5 w-3.5" /> Aranıyor…
                    </div>
                  ) : displayMosques.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {q.trim() ? 'Sonuç bulunamadı.' : 'Cami adı yaz.'}
                    </p>
                  ) : (
                    displayMosques.map((m) => {
                      const isSelected = selectedMosque?.id === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMosque(m)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? 'bg-accent/10 hover:bg-accent/15'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border bg-surface'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {m.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[m.neighbourhood, m.district, m.city]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-note">Açıklama / mesaj (opsiyonel)</Label>
                <textarea
                  id="reg-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Yöneticiye iletmek istediğin not…"
                  className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {TURNSTILE_SITE_KEY ? (
                <div ref={captchaRef} className="min-h-[65px]" />
              ) : (
                <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                  Captcha yapılandırılmamış (NEXT_PUBLIC_TURNSTILE_SITE_KEY boş).
                  Üretimde mutlaka ayarlanmalı.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                {submitting ? 'Gönderiliyor…' : 'Başvur'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Giriş yap
          </Link>
        </p>
      </section>
    </div>
  )
}
