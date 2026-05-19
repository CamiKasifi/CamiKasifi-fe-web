'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  ErrorBanner,
  Input,
  Label,
  Modal,
  Spinner,
} from '@/components/ui'
import {
  api,
  type ImamMosqueProfileUpdateInput,
  type Mosque,
  type MosqueProfile,
} from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

/// İmam'ın atandığı bir cami için: tarihçe, fotoğraf URL'i ve yarıçap
/// düzenleyebildiği panel. Backend: `PUT /api/imams/me/mosques/{id}/profile`.
/// Radius 10–5000 m aralığında; varsayılan backend tarafında 500 m.
///
/// Profil bilgileri (history + photoUrl) `Mosque` listesinde olmadığı için
/// modal açıldığında ayrı bir `/api/mosques/{id}/profile` çağrısıyla yüklenir.
export function ImamMosqueProfileEditor({
  mosque,
  onClose,
  onSaved,
}: {
  mosque: Mosque
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{
    historyText: string
    photoUrl: string
    radius: number
  }>({
    historyText: '',
    photoUrl: '',
    radius: mosque.radius,
  })

  // Mevcut profili yükle (history + photoUrl `Mosque` listesinde olmadığı için).
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const profile: MosqueProfile = await api.mosques.profile(mosque.id)
        if (cancelled) return
        setForm({
          historyText: profile.historyText ?? '',
          photoUrl: profile.photoUrl ?? '',
          radius: profile.radius ?? mosque.radius ?? 500,
        })
      } catch (err) {
        if (cancelled) return
        setError(formatApiError(err, 'Profil alınamadı.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mosque.id, mosque.radius])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload: ImamMosqueProfileUpdateInput = {
        historyText: form.historyText.trim() || null,
        photoUrl: form.photoUrl.trim() || null,
        radius: form.radius,
      }
      await api.imamMosques.updateProfile(mosque.id, payload)
      await onSaved()
    } catch (err) {
      setError(formatApiError(err, 'Kaydedilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mosque.name} — profil`}
      description="Cemaat mobil tarafında bu bilgileri görür. Yarıçap, yoklama mesafesi için kullanılır."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button
            form="imam-profile-form"
            type="submit"
            loading={saving}
            disabled={loading}
          >
            Kaydet
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Profil yükleniyor…
        </div>
      ) : (
        <form
          id="imam-profile-form"
          onSubmit={submit}
          className="space-y-3"
          noValidate
        >
          <ErrorBanner message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="historyText">Cami tarihçesi</Label>
            <textarea
              id="historyText"
              rows={5}
              value={form.historyText}
              onChange={(e) =>
                setForm((f) => ({ ...f, historyText: e.target.value }))
              }
              className="flex w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              placeholder="Cemaate gösterilecek kısa tarihçe…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photoUrl">Fotoğraf bağlantısı (URL)</Label>
            <Input
              id="photoUrl"
              type="url"
              value={form.photoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, photoUrl: e.target.value }))
              }
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="imam-radius">Yoklama yarıçapı</Label>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {form.radius} m
              </span>
            </div>
            <input
              id="imam-radius"
              type="range"
              min={10}
              max={5000}
              step={10}
              value={form.radius}
              onChange={(e) =>
                setForm((f) => ({ ...f, radius: Number(e.target.value) }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={10}
                max={5000}
                step={10}
                value={form.radius}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isFinite(v)) return
                  setForm((f) => ({
                    ...f,
                    radius: Math.min(5000, Math.max(10, Math.round(v))),
                  }))
                }}
                className="w-32"
                aria-label="Yarıçap (metre)"
              />
              <span className="text-xs text-muted-foreground">
                m — Cemaat bu mesafe dışına çıkarsa oturum kapatılır (varsayılan
                500 m, 10–5000 m).
              </span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
