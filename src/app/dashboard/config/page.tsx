'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Button, ErrorBanner, Input, Label, PageHeader, Spinner } from '@/components/ui'
import { isAdmin, useAuth } from '@/lib/auth'
import { api, type PointsConfig } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

const FIELDS: { key: keyof PointsConfig; label: string; hint: string }[] = [
  { key: 'fajrPoints', label: 'Sabah (Fajr)', hint: 'Sabah namazı için kazanılan puan' },
  { key: 'dhuhrPoints', label: 'Öğle (Dhuhr)', hint: 'Öğle namazı için kazanılan puan' },
  { key: 'asrPoints', label: 'İkindi (Asr)', hint: 'İkindi namazı için kazanılan puan' },
  { key: 'maghribPoints', label: 'Akşam (Maghrib)', hint: 'Akşam namazı için kazanılan puan' },
  { key: 'ishaPoints', label: 'Yatsı (Isha)', hint: 'Yatsı namazı için kazanılan puan' },
  { key: 'fullDayBonus', label: 'Tam Gün Bonusu', hint: '5 vakti de kılınca verilen ek puan' },
  { key: 'sameSalahStreakBonus', label: 'Streak Bonusu', hint: 'Aynı vakti 5 gün üst üste kılınca verilen ek puan' },
]

const EMPTY: PointsConfig = {
  fajrPoints: 25,
  dhuhrPoints: 10,
  asrPoints: 10,
  maghribPoints: 10,
  ishaPoints: 15,
  fullDayBonus: 10,
  sameSalahStreakBonus: 10,
}

export default function PointsConfigPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<PointsConfig>(EMPTY)

  useEffect(() => {
    if (!admin) return
    setLoading(true)
    api.adminConfig
      .getPoints()
      .then((cfg) => setForm(cfg))
      .catch((e) => setError(formatApiError(e)))
      .finally(() => setLoading(false))
  }, [admin])

  function handleChange(key: keyof PointsConfig, raw: string) {
    const val = parseInt(raw, 10)
    setForm((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }))
    setSuccess(false)
    setSaveError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSuccess(false)
    try {
      const updated = await api.adminConfig.updatePoints(form)
      setForm(updated)
      setSuccess(true)
    } catch (e) {
      setSaveError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  if (!admin) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Bu sayfaya erişim yetkiniz yok.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Puan Ayarları"
        description="Her namaz vakti için kazanılan puanları ve bonus puanları yapılandırın. Değişiklikler anında devreye girer."
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Namaz Puanları
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {saveError && <ErrorBanner message={saveError} />}

          {success && (
            <p className="text-sm font-medium text-green-600">
              Puan ayarları başarıyla güncellendi.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : null}
              Kaydet
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
