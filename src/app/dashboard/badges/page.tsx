'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  Modal,
  PageHeader,
  Select,
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
  BADGE_CATEGORIES,
  BADGE_CATEGORY_LABELS,
  BADGE_ICON_KEYS,
  BADGE_TIERS,
  BADGE_TIER_LABELS,
  type AdminBadge,
  type BadgeCategory,
  type BadgeInput,
  type BadgeTier,
  type SalahType,
} from '@/lib/api'
import { formatApiError } from '@/lib/hooks'

const EMPTY: BadgeInput = {
  code: '',
  name: '',
  description: '',
  category: 'PRAYER_STREAK',
  tier: 'CIRAK',
  targetValue: 5,
  iconKey: 'prayer_fajr',
  salahType: 'FAJR',
  sortOrder: 0,
}

const SALAH_TYPES: SalahType[] = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']
const SALAH_LABELS: Record<SalahType, string> = {
  FAJR: 'Sabah',
  DHUHR: 'Öğle',
  ASR: 'İkindi',
  MAGHRIB: 'Akşam',
  ISHA: 'Yatsı',
}

/// Admin rozet yönetimi.
///
/// Mobil tarafı bu sayfaya dokunmaz — sadece admin için. Backend `AdminBadgeController`
/// CRUD endpoint'lerini kullanır; silme guard'ı: kazanılmış UserBadge varsa 409 atar
/// ve butona basan admin'e Türkçe hata gösterilir.
export default function BadgesAdminPage() {
  const { user, loading: authLoading } = useAuth()
  const admin = isAdmin(user)

  const [badges, setBadges] = useState<AdminBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'ALL'>('ALL')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBadge | null>(null)
  const [form, setForm] = useState<BadgeInput>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await api.adminBadges.list()
      setBadges(list)
    } catch (err) {
      setError(formatApiError(err, 'Rozetler alınamadı.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!admin) return
    void refresh()
  }, [admin])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return badges.filter((b) => {
      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false
      if (!q) return true
      return (
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      )
    })
  }, [badges, search, categoryFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (b: AdminBadge) => {
    setEditing(b)
    setForm({
      code: b.code,
      name: b.name,
      description: b.description,
      category: b.category as BadgeCategory,
      tier: b.tier as BadgeTier,
      targetValue: b.targetValue,
      iconKey: b.iconKey,
      salahType: b.salahType,
      sortOrder: b.sortOrder,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      // PRAYER_STREAK dışı kategoriler için salahType backend'de null'a çekiliyor;
      // form temizliği için yine de gönderim öncesi düzelt.
      const payload: BadgeInput = {
        ...form,
        salahType: form.category === 'PRAYER_STREAK' ? form.salahType : null,
        sortOrder: form.sortOrder ?? 0,
      }
      if (editing) {
        await api.adminBadges.update(editing.id, payload)
      } else {
        await api.adminBadges.create(payload)
      }
      setModalOpen(false)
      await refresh()
    } catch (err) {
      setFormError(formatApiError(err, 'Kayıt sırasında hata oluştu.'))
    } finally {
      setSubmitting(false)
    }
  }

  const removeBadge = async (b: AdminBadge) => {
    if (b.earnedByCount > 0) {
      alert(
        `Bu rozet ${b.earnedByCount} kullanıcı tarafından kazanılmış; silinemez.`,
      )
      return
    }
    if (!confirm(`"${b.name}" rozetini silmek istiyor musun?`)) return
    try {
      await api.adminBadges.remove(b.id)
      await refresh()
    } catch (err) {
      setError(formatApiError(err, 'Silme başarısız.'))
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Yükleniyor…
      </div>
    )
  }

  if (!admin) {
    return (
      <EmptyState
        title="Erişim yok"
        description="Bu sayfa yalnız yönetici hesapları içindir."
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Rozetler"
        description="Rozet kataloğunu yönet — yeni tier ekle, eşikleri değiştir, ikonu güncelle."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Yeni Rozet
          </Button>
        }
      />

      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara: kod, ad, açıklama…"
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as BadgeCategory | 'ALL')
          }
          className="max-w-xs"
        >
          <option value="ALL">Tüm kategoriler</option>
          {BADGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BADGE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
        <Badge variant="default">{filtered.length}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={badges.length === 0 ? 'Henüz rozet yok' : 'Sonuç bulunamadı'}
          description={
            badges.length === 0
              ? 'İlk rozeti eklemek için "Yeni Rozet" butonunu kullan.'
              : 'Aramanı veya filtreni değiştirmeyi dene.'
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Kod</TH>
              <TH>Ad</TH>
              <TH>Kategori</TH>
              <TH>Tier</TH>
              <TH className="text-right">Hedef</TH>
              <TH className="text-right">Kazananlar</TH>
              <TH className="text-right">İşlem</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((b) => (
              <TR key={b.id}>
                <TD className="font-mono text-xs text-muted-foreground">
                  {b.code}
                </TD>
                <TD className="font-medium">{b.name}</TD>
                <TD className="text-muted-foreground">
                  {BADGE_CATEGORY_LABELS[b.category as BadgeCategory] ?? b.category}
                </TD>
                <TD>
                  <Badge variant="default">
                    {BADGE_TIER_LABELS[b.tier as BadgeTier] ?? b.tier}
                  </Badge>
                </TD>
                <TD className="text-right tabular-nums">{b.targetValue}</TD>
                <TD className="text-right tabular-nums text-muted-foreground">
                  {b.earnedByCount}
                </TD>
                <TD className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Düzenle"
                      onClick={() => openEdit(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sil"
                      onClick={() => removeBadge(b)}
                      className="text-destructive hover:bg-destructive/10"
                      disabled={b.earnedByCount > 0}
                      title={
                        b.earnedByCount > 0
                          ? 'Kazanılmış rozet silinemez'
                          : undefined
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Rozeti düzenle' : 'Yeni rozet'}
        description="Kategori + tier kombinasyonu rozetin zorluk yolunu belirler."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Vazgeç
            </Button>
            <Button form="badge-form" type="submit" loading={submitting}>
              {editing ? 'Güncelle' : 'Oluştur'}
            </Button>
          </>
        }
      >
        <form id="badge-form" onSubmit={submit} className="space-y-3" noValidate>
          <ErrorBanner message={formError} />

          <div className="space-y-1.5">
            <Label htmlFor="code">Kod</Label>
            <Input
              id="code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="örn. STREAK_FAJR_USTA"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Benzersiz. Kazanılan rozetler bu kodla saklanır; sonradan
              değiştirmek tüm referansları korur.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="örn. Sabah Ustası"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Input
              id="description"
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="örn. Sabah namazını 100 gün üst üste kıldın."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as BadgeCategory,
                  })
                }
              >
                {BADGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {BADGE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier">Tier</Label>
              <Select
                id="tier"
                value={form.tier}
                onChange={(e) =>
                  setForm({ ...form, tier: e.target.value as BadgeTier })
                }
              >
                {BADGE_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {BADGE_TIER_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetValue">Hedef değer</Label>
              <Input
                id="targetValue"
                type="number"
                required
                min={1}
                value={form.targetValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetValue: Number(e.target.value) || 0,
                  })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Eşik (gün/sayı/puan, kategoriye göre).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sıralama</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Listede sıralama (küçük = önce).
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iconKey">İkon</Label>
            <Select
              id="iconKey"
              value={form.iconKey}
              onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
            >
              {BADGE_ICON_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Mobil mapper bu anahtarı tanımıyorsa default kupa ikonuna düşer.
            </p>
          </div>

          {form.category === 'PRAYER_STREAK' && (
            <div className="space-y-1.5">
              <Label htmlFor="salahType">Vakit</Label>
              <Select
                id="salahType"
                value={form.salahType ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salahType: (e.target.value || null) as SalahType | null,
                  })
                }
              >
                <option value="">— Seç —</option>
                {SALAH_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {SALAH_LABELS[s]}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-muted-foreground">
                PRAYER_STREAK kategorisinde zorunlu.
              </p>
            </div>
          )}

          {editing && editing.earnedByCount > 0 && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Bu rozet {editing.earnedByCount} kullanıcı tarafından kazanılmış.
              Eşiği düşürürsen kazanım anında genişler; yükseltirsen mevcutlar
              korunur (rozetler kalıcıdır).
            </div>
          )}
        </form>
      </Modal>
    </>
  )
}
