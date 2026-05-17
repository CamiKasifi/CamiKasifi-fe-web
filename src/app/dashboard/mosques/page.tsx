'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import { Check, FileEdit, Pencil, Plus, Search, Settings, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  Modal,
  PageHeader,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { isAdmin, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type ImamMosqueProfileUpdateInput,
  type Mosque,
  type MosqueInput,
  type MosqueProfile,
} from '@/lib/api'

const MosqueMapPicker = dynamic(
  () => import('@/components/MosqueMapPicker').then((m) => m.MosqueMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-md border border-border bg-muted/30 text-xs text-muted-foreground">
        Harita yükleniyor…
      </div>
    ),
  },
)

const EMPTY: MosqueInput = {
  name: '',
  city: '',
  district: '',
  neighbourhood: '',
  radius: 500,
  latitude: 0,
  longitude: 0,
}

export default function MosquesPage() {
  const { roles } = useAuth()
  const admin = isAdmin(roles)

  const [mosques, setMosques] = useState<Mosque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Mosque | null>(null)
  const [form, setForm] = useState<MosqueInput>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // İmam için kendi camilerini yönetme picker'ı
  const [pickerOpen, setPickerOpen] = useState(false)

  // İmam'ın per-cami profil editörü (history, photo, radius)
  const [profileMosque, setProfileMosque] = useState<Mosque | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = admin
        ? await api.mosques.list()
        : await api.imamMosques.list()
      setMosques(list)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Camiler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return mosques
    return mosques.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.neighbourhood.toLowerCase().includes(q),
    )
  }, [mosques, search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (m: Mosque) => {
    setEditing(m)
    setForm({
      name: m.name,
      city: m.city,
      district: m.district,
      neighbourhood: m.neighbourhood,
      radius: m.radius,
      latitude: m.latitude,
      longitude: m.longitude,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await api.mosques.update(editing.id, form)
      } else {
        await api.mosques.create(form)
      }
      setModalOpen(false)
      await refresh()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Kayıt sırasında hata oluştu.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const removeMosque = async (m: Mosque) => {
    if (!confirm(`"${m.name}" camisini silmek istiyor musun?`)) return
    try {
      await api.mosques.remove(m.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silme başarısız.')
    }
  }

  return (
    <>
      <PageHeader
        title={admin ? 'Camiler' : 'Camilerim'}
        description={
          admin
            ? 'Sisteme kayıtlı tüm camileri yönet.'
            : 'Atandığın camilerin listesi.'
        }
        actions={
          admin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Yeni Cami
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setPickerOpen(true)}>
              <Settings className="h-4 w-4" /> Camilerimi yönet
            </Button>
          )
        }
      />

      <ErrorBanner message={error} />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara: ad, şehir, ilçe…"
            className="pl-9"
          />
        </div>
        <Badge variant="default">{filtered.length}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={mosques.length === 0 ? 'Henüz cami yok' : 'Sonuç bulunamadı'}
          description={
            mosques.length === 0
              ? admin
                ? 'İlk camiyi eklemek için "Yeni Cami" butonunu kullan.'
                : 'Henüz sana atanmış cami bulunmuyor.'
              : 'Aramanı değiştirmeyi dene.'
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Ad</TH>
              <TH>Konum</TH>
              <TH className="text-right">Yarıçap</TH>
              <TH className="text-right">Koordinat</TH>
              <TH className="text-right">İşlem</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((m) => (
              <TR key={m.id}>
                <TD className="font-medium">{m.name}</TD>
                <TD className="text-muted-foreground">
                  {m.neighbourhood}, {m.district} · {m.city}
                </TD>
                <TD className="text-right tabular-nums">{m.radius} m</TD>
                <TD className="text-right font-mono text-xs text-muted-foreground">
                  {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
                </TD>
                <TD className="text-right">
                  <div className="inline-flex gap-1">
                    {admin ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Düzenle"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Sil"
                          onClick={() => removeMosque(m)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setProfileMosque(m)}
                      >
                        <FileEdit className="h-4 w-4" /> Profili düzenle
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {!admin && (
        <ImamMosquePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          currentIds={mosques.map((m) => m.id)}
          onSaved={refresh}
        />
      )}

      {!admin && profileMosque && (
        <ImamMosqueProfileEditor
          mosque={profileMosque}
          onClose={() => setProfileMosque(null)}
          onSaved={async () => {
            setProfileMosque(null)
            await refresh()
          }}
        />
      )}

      {admin && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Camiyi düzenle' : 'Yeni cami'}
          description="Konum ve yarıçap, devam noktası tespiti için kullanılır."
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Vazgeç
              </Button>
              <Button
                form="mosque-form"
                type="submit"
                loading={submitting}
              >
                {editing ? 'Güncelle' : 'Oluştur'}
              </Button>
            </>
          }
        >
          <form id="mosque-form" onSubmit={submit} className="space-y-3" noValidate>
            <ErrorBanner message={formError} />

            <div className="space-y-1.5">
              <Label htmlFor="name">Cami adı</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="neighbourhood">Mahalle</Label>
              <Input
                id="neighbourhood"
                required
                value={form.neighbourhood}
                onChange={(e) =>
                  setForm({ ...form, neighbourhood: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Konum</Label>
              <MosqueMapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                radius={form.radius}
                onChange={({ latitude, longitude }) =>
                  setForm((f) => ({ ...f, latitude, longitude }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Haritaya tıklayarak veya pin'i sürükleyerek konumu seç.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="radius">Yarıçap</Label>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {form.radius} m
                </span>
              </div>
              <input
                id="radius"
                type="range"
                min={10}
                max={5000}
                step={10}
                value={form.radius}
                onChange={(e) =>
                  setForm({ ...form, radius: Number(e.target.value) })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
              />
              <p className="text-xs text-muted-foreground">
                Cami sınırı: kullanıcı bu yarıçap içindeyken namaz oturumu
                geçerli sayılır. 10–5000 m aralığında ayarlanabilir.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

/* ------------------------------------------------------------------------- */
/*  İmam'ın kendi camilerini arayıp seçtiği picker. Replace semantics:      */
/*  Modal kapatılırken seçili olan id'ler PUT /api/imams/me/mosques ile      */
/*  tek seferde gönderilir. Bu yüzden mevcut atamalar baştan seçili gelir.  */
/* ------------------------------------------------------------------------- */

function ImamMosquePicker({
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
  // Pre-seçim için id→Mosque map'i (search sonuçlarında olmayan mevcut camilerin
  // adını da göstermek için).
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

  // Debounced search (350ms).
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
        setError(err instanceof ApiError ? err.message : 'Arama başarısız.')
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
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.')
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

/* ------------------------------------------------------------------------- */
/*  İmam'ın atandığı bir cami için: tarihçe, fotoğraf URL'i ve yarıçap        */
/*  düzenleyebildiği panel. Backend: PUT /api/imams/me/mosques/{id}/profile.  */
/*  Radius 10–5000 m aralığında; default backend tarafında 500 m.             */
/* ------------------------------------------------------------------------- */

function ImamMosqueProfileEditor({
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
        setError(err instanceof ApiError ? err.message : 'Profil alınamadı.')
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
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.')
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
