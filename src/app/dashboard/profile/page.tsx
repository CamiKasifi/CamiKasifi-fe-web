'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import {
  Button,
  ErrorBanner,
  Input,
  Label,
  PageHeader,
  Spinner,
} from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api, ApiError, type UserUpdateInput } from '@/lib/api'

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth()

  const [form, setForm] = useState<{
    name: string
    surname: string
    birthday: string
    phoneNumber: string
    phoneVisible: boolean
    oldPassword: string
    newPassword: string
  }>({
    name: '',
    surname: '',
    birthday: '',
    phoneNumber: '',
    phoneVisible: false,
    oldPassword: '',
    newPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: user.name ?? '',
      surname: user.surname ?? '',
      birthday: user.birthday ?? '',
      phoneNumber: user.phoneNumber ?? '',
      phoneVisible: user.phoneVisible ?? false,
    }))
  }, [user])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: UserUpdateInput = {
        name: form.name.trim(),
        surname: form.surname.trim(),
        birthday: form.birthday.trim() || null,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        phoneVisible: form.phoneVisible,
      }
      await api.users.update(payload)
      await refresh()
      setSuccess('Profil güncellendi.')
      setForm((f) => ({ ...f, oldPassword: '', newPassword: '' }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Güncellenemedi.')
    } finally {
      setSaving(false)
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

      <form onSubmit={submit} className="max-w-2xl space-y-4" noValidate>
        <ErrorBanner message={error} />
        {success && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surname">Soyad</Label>
            <Input
              id="surname"
              required
              value={form.surname}
              onChange={(e) => setForm({ ...form, surname: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birthday">Doğum tarihi</Label>
          <Input
            id="birthday"
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Telefon</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+90…"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.phoneVisible}
            onChange={(e) =>
              setForm({ ...form, phoneVisible: e.target.checked })
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

        <fieldset className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <legend className="px-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Şifre
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor="oldPassword">Mevcut şifre</Label>
            <Input
              id="oldPassword"
              type="password"
              required
              value={form.oldPassword}
              onChange={(e) =>
                setForm({ ...form, oldPassword: e.target.value })
              }
              autoComplete="current-password"
            />
            <p className="text-xs text-muted-foreground">
              Profil değişikliklerini doğrulamak için her zaman gerekir.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Yeni şifre (opsiyonel)</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Değiştirmek istemiyorsan boş bırak"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> Kaydet
          </Button>
        </div>
      </form>
    </>
  )
}
