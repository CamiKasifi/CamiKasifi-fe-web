'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Save, KeyRound } from 'lucide-react'
import {
  Button,
  ErrorBanner,
  Input,
  Label,
  PageHeader,
  Spinner,
} from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api, ApiError, type Province, type UserUpdateInput } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth()

  const [profile, setProfile] = useState<{
    name: string
    surname: string
    birthday: string
    phoneNumber: string
    phoneVisible: boolean
    city: string
    district: string
  }>({
    name: '',
    surname: '',
    birthday: '',
    phoneNumber: '',
    phoneVisible: false,
    city: '',
    district: '',
  })

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Şifre değiştirme Supabase'de yapılır — backend bilmiyor.
  // Eski şifre kontrolü için signInWithPassword'ü re-auth amaçlı çağırıyoruz:
  // Supabase'in updateUser({password}) çağrısı eski şifre talep etmiyor, bu
  // yüzden re-authentication'ı kendimiz uyguluyoruz.
  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  useEffect(() => {
    api.provinces.list().then(setProvinces).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    const city = user.city ?? ''
    setProfile({
      name: user.name ?? '',
      surname: user.surname ?? '',
      birthday: user.birthday ?? '',
      phoneNumber: user.phoneNumber ?? '',
      phoneVisible: user.phoneVisible ?? false,
      city,
      district: user.district ?? '',
    })
    const found = provinces.find((p) => p.il === city)
    setDistricts(found ? found.ilceler : [])
  }, [user, provinces])

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(null)
    try {
      const payload: UserUpdateInput = {
        name: profile.name.trim(),
        surname: profile.surname.trim(),
        birthday: profile.birthday.trim() || null,
        phoneNumber: profile.phoneNumber.trim() || null,
        phoneVisible: profile.phoneVisible,
        city: profile.city.trim() || null,
        district: profile.district.trim() || null,
      }
      await api.users.update(payload)
      await refresh()
      setProfileSuccess('Profil güncellendi.')
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Güncellenemedi.')
    } finally {
      setProfileSaving(false)
    }
  }

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    if (!user) {
      setPwError('Oturum bulunamadı.')
      return
    }
    if (!pw.currentPassword) {
      setPwError('Mevcut şifreni gir.')
      return
    }
    if (pw.newPassword.length < 8) {
      setPwError('Yeni şifre en az 8 karakter olmalı.')
      return
    }
    if (pw.newPassword === pw.currentPassword) {
      setPwError('Yeni şifre eskisiyle aynı olamaz.')
      return
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError('Şifreler eşleşmiyor.')
      return
    }
    setPwSaving(true)
    try {
      // Re-auth — supabase.auth.updateUser eski şifre talep etmediği için
      // signInWithPassword ile manuel doğruluyoruz. Başarısızsa newPassword
      // çağrısına geçmeyiz; geçersek aynı kullanıcının session'u yenilenir.
      const { error: reauthError } = await supabase().auth.signInWithPassword({
        email: user.email,
        password: pw.currentPassword,
      })
      if (reauthError) {
        setPwError('Mevcut şifre hatalı.')
        return
      }

      const { error } = await supabase().auth.updateUser({ password: pw.newPassword })
      if (error) {
        setPwError(error.message)
        return
      }
      setPwSuccess('Şifren güncellendi.')
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Şifre güncellenemedi.')
    } finally {
      setPwSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Yükleniyor…
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Profilim"
        description="Kişisel bilgilerini ve cemaate görünen iletişim bilgini düzenle."
      />

      <form onSubmit={submitProfile} className="max-w-2xl space-y-4" noValidate>
        <ErrorBanner message={profileError} />
        {profileSuccess && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {profileSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surname">Soyad</Label>
            <Input
              id="surname"
              required
              value={profile.surname}
              onChange={(e) =>
                setProfile({ ...profile, surname: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birthday">Doğum tarihi</Label>
          <Input
            id="birthday"
            type="date"
            value={profile.birthday}
            onChange={(e) =>
              setProfile({ ...profile, birthday: e.target.value })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Telefon</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+90…"
            value={profile.phoneNumber}
            onChange={(e) =>
              setProfile({ ...profile, phoneNumber: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">İl</Label>
            <select
              id="city"
              value={profile.city}
              onChange={(e) => {
                const city = e.target.value
                const found = provinces.find((p) => p.il === city)
                setDistricts(found ? found.ilceler : [])
                setProfile({ ...profile, city, district: '' })
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Seçiniz —</option>
              {provinces.map((p) => (
                <option key={p.il} value={p.il}>
                  {p.il}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">İlçe</Label>
            <select
              id="district"
              value={profile.district}
              disabled={districts.length === 0}
              onChange={(e) =>
                setProfile({ ...profile, district: e.target.value })
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">— Seçiniz —</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={profile.phoneVisible}
            onChange={(e) =>
              setProfile({ ...profile, phoneVisible: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            <span className="font-medium text-foreground">
              Telefon numaramı cemaate göster
            </span>
            <span className="block text-xs text-muted-foreground">
              Mobil cami profili sayfasında imam iletişim listesinde görünür.
              Kapatırsan sadece adın gösterilir.
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <Button type="submit" loading={profileSaving}>
            <Save className="h-4 w-4" /> Kaydet
          </Button>
        </div>
      </form>

      {/* Şifre değiştirme ayrı form — Supabase üzerinden işler. */}
      <form
        onSubmit={submitPassword}
        className="mt-10 max-w-2xl space-y-3 rounded-lg border border-border bg-muted/20 p-4"
        noValidate
      >
        <div>
          <h2 className="text-base font-semibold">Şifre değiştir</h2>
          <p className="text-xs text-muted-foreground">
            Yeni şifren en az 8 karakter olmalı.
          </p>
        </div>

        <ErrorBanner message={pwError} />
        {pwSuccess && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {pwSuccess}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Mevcut şifre</Label>
          <Input
            id="currentPassword"
            type="password"
            required
            value={pw.currentPassword}
            onChange={(e) =>
              setPw({ ...pw, currentPassword: e.target.value })
            }
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Yeni şifre</Label>
          <Input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Yeni şifre (tekrar)</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={pw.confirmPassword}
            onChange={(e) =>
              setPw({ ...pw, confirmPassword: e.target.value })
            }
            autoComplete="new-password"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={pwSaving} variant="secondary">
            <KeyRound className="h-4 w-4" /> Şifreyi güncelle
          </Button>
        </div>
      </form>
    </>
  )
}
