'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Button,
  ErrorBanner,
  Input,
  Modal,
  Spinner,
} from '@/components/ui'
import { api, type Mosque } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

/// İmam'ın kendi camilerini arayıp seçtiği picker. **Replace semantics**:
/// kaydet butonuna basıldığında seçili olan id'ler `PUT /api/imams/me/mosques`
/// ile tek seferde gönderilir — yani mevcut atamalar baştan seçili gelir ve
/// kaydedince sunucudaki listenin tamamı bu listeye eşitlenir.
///
/// Arama 350 ms debounce edilir; sonuçlar `name + city` filtresine göre
/// `/api/mosques/search` üzerinden döner. Daha önce seçili olup arama
/// sonucunda olmayan camiler `knownById` map'i sayesinde listede üstte
/// görünmeye devam eder (kullanıcı silmek istediğini ayırt edebilsin).
export function ImamMosquePicker({
  open,
  onClose,
  currentIds,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  currentIds: number[]
  onSaved: () => Promise<void> | void
}) {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [results, setResults] = useState<Mosque[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set(currentIds))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Pre-seçim için id→Mosque map'i (search sonuçlarında olmayan mevcut
  // camilerin adını da göstermek için).
  const [knownById, setKnownById] = useState<Map<number, Mosque>>(new Map())

  // Modal her açıldığında seçimi mevcut listeden başlat.
  useEffect(() => {
    if (open) {
      setSelected(new Set(currentIds))
      setError(null)
    }
  }, [open, currentIds])

  // Mevcut atanmış camilerin tam bilgilerini yükle ki listede gösterebilelim.
  useEffect(() => {
    if (!open || currentIds.length === 0) return
    void (async () => {
      try {
        const list = await api.imamMosques.list()
        const m = new Map<number, Mosque>()
        list.forEach((x) => m.set(x.id, x))
        setKnownById(m)
      } catch {
        // Sessizce geç — search yine çalışır.
      }
    })()
  }, [open, currentIds])

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
        setKnownById((prev) => {
          const next = new Map(prev)
          list.forEach((x) => next.set(x.id, x))
          return next
        })
      } catch (err) {
        setError(formatApiError(err, 'Arama başarısız.'))
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [q, city, open])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.imamMosques.update([...selected])
      await onSaved()
      onClose()
    } catch (err) {
      setError(formatApiError(err, 'Kaydedilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  // Listede göstereceğimiz öğeler: önce mevcut seçili (üstte sabit), sonra
  // search sonuçları (seçili olmayanlar).
  const displayItems = useMemo(() => {
    const selectedItems: Mosque[] = []
    selected.forEach((id) => {
      const m = knownById.get(id)
      if (m) selectedItems.push(m)
    })
    const others = results.filter((r) => !selected.has(r.id))
    return [...selectedItems, ...others]
  }, [selected, knownById, results])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Camilerimi yönet"
      description="Sorumlu olduğun camileri ara ve seç. Kaydedince sunucudaki liste güncellenir."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button onClick={save} loading={saving}>
            Kaydet ({selected.size})
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ErrorBanner message={error} />

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

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-1">
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
              const isSelected = selected.has(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-accent/10 hover:bg-accent/15'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
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

        {selected.size > 0 && (
          <p className="text-xs text-muted-foreground">
            {selected.size} cami seçili. Kaydedince mevcut listenin yerini alır.
          </p>
        )}
      </div>
    </Modal>
  )
}
