'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import { FileEdit, Pencil, Plus, Search, Settings, Trash2 } from 'lucide-react'
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
import { api, type Mosque, type MosqueInput } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'
import { ImamMosquePicker } from '@/components/mosques/ImamMosquePicker'
import { ImamMosqueProfileEditor } from '@/components/mosques/ImamMosqueProfileEditor'

/// Haritalı seçici client-side bir paket olduğu için SSR kapalı dynamic import.
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

/// Camiler yönetim sayfası — orkestratör.
///
/// Bu dosyada SADECE sayfa-seviyesi kaygılar kalır:
///   - Liste + arama + (admin için) create/edit modal
///   - İmam için "Camilerimi yönet" picker tetiği
///   - İmam için tek bir caminin profil editörünü açma akışı
///
/// İmam-spesifik panel'ler (`ImamMosquePicker`, `ImamMosqueProfileEditor`)
/// `@/components/mosques/*` altında — kendi state'leri sıkıca paketli,
/// sayfa dosyası 813 satırdan ~320'ye düşer.
export default function MosquesPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)

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
      setError(formatApiError(err, 'Camiler alınamadı.'))
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
      setFormError(formatApiError(err, 'Kayıt sırasında hata oluştu.'))
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
      setError(formatApiError(err, 'Silme başarısız.'))
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
              <Button form="mosque-form" type="submit" loading={submitting}>
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
