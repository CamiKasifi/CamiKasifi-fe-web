'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Button,
  ErrorBanner,
  Input,
  Label,
  Modal,
  Spinner,
} from '@/components/ui'
import { api, type Mosque } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

/// İmamın bir camiye atanmak için başvuru yaptığı modal.
///
/// Tek cami seçimi (radyo semantiği) + başvuru bilgileri (mesaj, telefon,
/// görev/unvan). Kaydet → `POST /api/imams/me/mosque-applications`. Başvuru
/// yöneticinin onayına düşer; cami doğrudan atanmaz.
///
/// Arama 350 ms debounce, `/api/mosques/search` üzerinden (ad + şehir).
export function ImamMosqueApplyModal({
  open,
  onClose,
  defaultPhone,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  defaultPhone?: string | null
  onSubmitted: () => Promise<void> | void
}) {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [results, setResults] = useState<Mosque[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Mosque | null>(null)
  const [note, setNote] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal her açıldığında formu sıfırla; telefonu profilden öntanımla.
  useEffect(() => {
    if (open) {
      setQ('')
      setCity('')
      setResults([])
      setSelected(null)
      setNote('')
      setContactPhone(defaultPhone ?? '')
      setRoleTitle('')
      setError(null)
    }
  }, [open, defaultPhone])

  // Debounced search (350 ms).
  useEffect(() => {
    if (!open) return
    const trimmed = q.trim()
    const cityTrimmed = city.trim()
    if (!trimmed && !cityTrimmed) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const list = await api.mosques.search({
          q: trimmed || undefined,
          city: cityTrimmed || undefined,
          limit: 80,
        })
        setResults(list)
      } catch (err) {
        setError(formatApiError(err, 'Arama başarısız.'))
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [q, city, open])

  // Seçili cami arama sonuçlarında olmasa da listede üstte gösterilsin.
  const displayItems = useMemo(() => {
    if (!selected) return results
    const others = results.filter((r) => r.id !== selected.id)
    return [selected, ...others]
  }, [selected, results])

  const submit = async () => {
    if (!selected) {
      setError('Lütfen bir cami seç.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.imamMosqueApplications.apply({
        mosqueId: selected.id,
        note: note.trim() || null,
        contactPhone: contactPhone.trim() || null,
        roleTitle: roleTitle.trim() || null,
      })
      await onSubmitted()
      onClose()
    } catch (err) {
      setError(formatApiError(err, 'Başvuru gönderilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cami başvurusu yap"
      description="İmamı olduğun camiyi seç ve başvuru bilgilerini doldur. Başvuru yöneticinin onayına gider."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button onClick={submit} loading={saving} disabled={!selected}>
            Başvuruyu gönder
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Cami seç
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cami adı ara…"
                className="pl-9"
                aria-label="Cami adı"
              />
            </div>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Şehir (örn. İstanbul)"
              aria-label="Şehir"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-1">
            {searching ? (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                <Spinner className="h-3.5 w-3.5" /> Aranıyor…
              </div>
            ) : displayItems.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {q.trim() || city.trim()
                  ? 'Sonuç bulunamadı.'
                  : 'Yukarıdan ara — cami adı ya da şehir yaz.'}
              </p>
            ) : (
              displayItems.map((m) => {
                const isSelected = selected?.id === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m)}
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
                          .filter((x) => x && x.trim() && x !== 'Bilinmiyor')
                          .join(', ') || `${m.city}`}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
          {selected && (
            <p className="text-xs text-muted-foreground">
              Seçili cami: <span className="font-medium text-foreground">{selected.name}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apply-role">Görev / unvan</Label>
          <Input
            id="apply-role"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Örn. Kadrolu imam-hatip"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apply-phone">İletişim telefonu</Label>
          <Input
            id="apply-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
            inputMode="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apply-note">Açıklama / mesaj</Label>
          <textarea
            id="apply-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Yöneticiye iletmek istediğin not (opsiyonel)…"
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>
    </Modal>
  )
}
