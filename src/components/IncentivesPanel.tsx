'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CalendarRange,
  Gift,
  PencilLine,
  Plus,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  api,
  ApiError,
  type Incentive,
  type IncentiveInput,
  type IncentiveRuleType,
  type SalahType,
} from '@/lib/api'
import { DateTimePicker } from '@/components/DateTimePicker'

type Filter = 'ALL' | 'ACTIVE' | 'INACTIVE'

const RULE_LABEL: Record<IncentiveRuleType, string> = {
  DAILY_SALAH: 'Günlük Vakit',
  DAILY_ALL_SALAH: 'Tam Gün (5 Vakit)',
  WEEKLY_SALAH_COUNT: 'Haftalık Toplam',
}

const RULE_DESCRIPTION: Record<IncentiveRuleType, string> = {
  DAILY_SALAH: 'Belirli bir vakti bugün cami içinde kıl.',
  DAILY_ALL_SALAH: 'Bugün beş vakti de cami içinde kıl.',
  WEEKLY_SALAH_COUNT: 'Bu ISO haftası içinde belirlediğin sayıda vakit kıl.',
}

const SALAH_LABEL: Record<SalahType, string> = {
  FAJR: 'Sabah',
  DHUHR: 'Öğle',
  ASR: 'İkindi',
  MAGHRIB: 'Akşam',
  ISHA: 'Yatsı',
}

const SALAH_ORDER: SalahType[] = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']

function ruleIcon(rule: IncentiveRuleType) {
  if (rule === 'DAILY_ALL_SALAH') return Sparkles
  if (rule === 'WEEKLY_SALAH_COUNT') return CalendarRange
  return Sun
}

function formatLocalDateTime(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.split('.')[0]
  const date = new Date(trimmed.includes('Z') ? trimmed : trimmed + 'Z')
  if (Number.isNaN(date.getTime())) return trimmed
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.split('.')[0]
  const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]}T${m[2]}` : ''
}

function fromInputValue(value: string): string | null {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

interface FormState {
  title: string
  description: string
  ruleType: IncentiveRuleType
  targetSalahType: SalahType | ''
  targetCount: string
  rewardPoints: string
  startsAt: string
  endsAt: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  ruleType: 'DAILY_SALAH',
  targetSalahType: 'FAJR',
  targetCount: '',
  rewardPoints: '50',
  startsAt: '',
  endsAt: '',
  active: true,
}

function toFormState(inc: Incentive): FormState {
  return {
    title: inc.title,
    description: inc.description ?? '',
    ruleType: inc.ruleType,
    targetSalahType: inc.targetSalahType ?? '',
    targetCount: inc.targetCount != null ? String(inc.targetCount) : '',
    rewardPoints: String(inc.rewardPoints ?? 0),
    startsAt: toInputValue(inc.startsAt),
    endsAt: toInputValue(inc.endsAt),
    active: inc.active,
  }
}

function toInput(form: FormState): IncentiveInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    ruleType: form.ruleType,
    rewardPoints: Number(form.rewardPoints || 0),
    targetSalahType:
      form.ruleType === 'DAILY_SALAH'
        ? (form.targetSalahType || null) as SalahType | null
        : null,
    targetCount:
      form.ruleType === 'WEEKLY_SALAH_COUNT' && form.targetCount
        ? Number(form.targetCount)
        : null,
    startsAt: fromInputValue(form.startsAt),
    endsAt: fromInputValue(form.endsAt),
    active: form.active,
  }
}

function validate(form: FormState): string | null {
  if (form.title.trim().length < 2) return 'Başlık en az 2 karakter olmalı.'
  const reward = Number(form.rewardPoints)
  if (Number.isNaN(reward) || reward < 0) {
    return 'Ödül puanı 0 veya daha büyük olmalı.'
  }
  if (form.ruleType === 'DAILY_SALAH' && !form.targetSalahType) {
    return 'Günlük Vakit teşviki için bir vakit seçmelisin.'
  }
  if (form.ruleType === 'WEEKLY_SALAH_COUNT') {
    const c = Number(form.targetCount)
    if (Number.isNaN(c) || c < 1) {
      return 'Haftalık teşvik için hedef sayı en az 1 olmalı.'
    }
  }
  if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
    return 'Bitiş tarihi başlangıçtan önce olamaz.'
  }
  return null
}

export interface IncentivesPanelProps {
  competitionId: number
  /** OWNER / MANAGER / ADMIN ise true — CRUD aksiyonları görünür olur. */
  canManage: boolean
}

export function IncentivesPanel({
  competitionId,
  canManage,
}: IncentivesPanelProps) {
  const [items, setItems] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Incentive | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [busyId, setBusyId] = useState<number | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await api.competitionIncentives.list(competitionId)
      setItems(list)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Teşvikler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId])

  const filtered = useMemo(() => {
    if (filter === 'ACTIVE') return items.filter((i) => i.active)
    if (filter === 'INACTIVE') return items.filter((i) => !i.active)
    return items
  }, [items, filter])

  const activeCount = useMemo(
    () => items.filter((i) => i.active).length,
    [items],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (inc: Incentive) => {
    setEditing(inc)
    setForm(toFormState(inc))
    setFormError(null)
    setModalOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate(form)
    if (v) {
      setFormError(v)
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = toInput(form)
      if (editing) {
        await api.competitionIncentives.update(
          competitionId,
          editing.id,
          payload,
        )
      } else {
        await api.competitionIncentives.create(competitionId, payload)
      }
      setModalOpen(false)
      setEditing(null)
      await refresh()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Teşvik kaydedilemedi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (inc: Incentive) => {
    setBusyId(inc.id)
    setError(null)
    try {
      await api.competitionIncentives.update(competitionId, inc.id, {
        title: inc.title,
        description: inc.description,
        ruleType: inc.ruleType,
        rewardPoints: inc.rewardPoints,
        targetSalahType: inc.targetSalahType,
        targetCount: inc.targetCount,
        startsAt: inc.startsAt,
        endsAt: inc.endsAt,
        active: !inc.active,
      })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Durum güncellenemedi.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (inc: Incentive) => {
    if (!confirm(`"${inc.title}" teşvikini silmek istiyor musun?`)) return
    setBusyId(inc.id)
    setError(null)
    try {
      await api.competitionIncentives.remove(competitionId, inc.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
            Tümü
            <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 text-[10px] tabular-nums">
              {items.length}
            </span>
          </FilterChip>
          <FilterChip
            active={filter === 'ACTIVE'}
            onClick={() => setFilter('ACTIVE')}
          >
            Aktif
            <span className="ml-1.5 rounded-full bg-success/15 px-1.5 text-[10px] tabular-nums text-success">
              {activeCount}
            </span>
          </FilterChip>
          <FilterChip
            active={filter === 'INACTIVE'}
            onClick={() => setFilter('INACTIVE')}
          >
            Pasif
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
              {items.length - activeCount}
            </span>
          </FilterChip>
        </div>

        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Yeni Teşvik
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            items.length === 0
              ? 'Bu yarışmada henüz teşvik yok'
              : 'Bu filtrede teşvik yok'
          }
          description={
            items.length === 0 && canManage
              ? 'İlk teşviki oluşturmak için "Yeni Teşvik" butonuna bas.'
              : items.length === 0
                ? 'Henüz tanımlanmış bir ödül bulunmuyor.'
                : 'Filtreyi değiştirerek diğer teşvikleri görebilirsin.'
          }
          action={
            items.length === 0 && canManage ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Yeni Teşvik
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          {filtered.map((inc) => (
            <IncentiveCard
              key={inc.id}
              incentive={inc}
              busy={busyId === inc.id}
              canManage={canManage}
              onEdit={() => openEdit(inc)}
              onDelete={() => remove(inc)}
              onToggleActive={() => toggleActive(inc)}
            />
          ))}
        </div>
      )}

      {canManage && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Teşviki düzenle' : 'Yeni teşvik'}
          description={
            editing
              ? `#${editing.id} numaralı teşviki güncelliyorsun.`
              : 'Bu yarışmaya özel yeni bir teşvik tanımla.'
          }
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
                form="incentive-form"
                type="submit"
                loading={submitting}
              >
                {editing ? 'Kaydet' : 'Oluştur'}
              </Button>
            </>
          }
        >
          <form
            id="incentive-form"
            onSubmit={onSubmit}
            className="space-y-4"
            noValidate
          >
            <ErrorBanner message={formError} />

            <div className="space-y-1.5">
              <Label htmlFor="inc-title">Başlık</Label>
              <Input
                id="inc-title"
                required
                minLength={2}
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Örn: Sabah Namazını Kıl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc-desc">Açıklama (opsiyonel)</Label>
              <textarea
                id="inc-desc"
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Cemaate bu teşviki kısaca anlat."
                className="flex w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc-rule">Kural tipi</Label>
              <Select
                id="inc-rule"
                value={form.ruleType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ruleType: e.target.value as IncentiveRuleType,
                  })
                }
              >
                <option value="DAILY_SALAH">
                  Günlük Vakit — tek vakit hedefi
                </option>
                <option value="DAILY_ALL_SALAH">
                  Tam Gün — 5 vakit hedefi
                </option>
                <option value="WEEKLY_SALAH_COUNT">
                  Haftalık Toplam — N vakit hedefi
                </option>
              </Select>
              <p className="text-xs text-muted-foreground">
                {RULE_DESCRIPTION[form.ruleType]}
              </p>
            </div>

            {form.ruleType === 'DAILY_SALAH' && (
              <div className="space-y-1.5 animate-fade-up">
                <Label htmlFor="inc-salah">Hedef vakit</Label>
                <Select
                  id="inc-salah"
                  value={form.targetSalahType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      targetSalahType: e.target.value as SalahType,
                    })
                  }
                  required
                >
                  <option value="">— Vakit seç —</option>
                  {SALAH_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {SALAH_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {form.ruleType === 'WEEKLY_SALAH_COUNT' && (
              <div className="space-y-1.5 animate-fade-up">
                <Label htmlFor="inc-count">Hedef vakit sayısı</Label>
                <Input
                  id="inc-count"
                  type="number"
                  min={1}
                  max={35}
                  inputMode="numeric"
                  value={form.targetCount}
                  onChange={(e) =>
                    setForm({ ...form, targetCount: e.target.value })
                  }
                  placeholder="Örn: 20"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ISO haftası içinde toplam onaylı vakit sayısı.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="inc-points">Ödül puanı</Label>
              <Input
                id="inc-points"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.rewardPoints}
                onChange={(e) =>
                  setForm({ ...form, rewardPoints: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inc-start">Başlangıç (ops.)</Label>
                <DateTimePicker
                  id="inc-start"
                  value={form.startsAt}
                  onChange={(v) => setForm({ ...form, startsAt: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-end">Bitiş (ops.)</Label>
                <DateTimePicker
                  id="inc-end"
                  value={form.endsAt}
                  onChange={(v) => setForm({ ...form, endsAt: v })}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
              />
              <span className="text-sm">
                <span className="font-semibold text-foreground">Aktif</span>
                <span className="ml-1 text-muted-foreground">
                  — pasif teşvikler cemaate gösterilmez.
                </span>
              </span>
            </label>
          </form>
        </Modal>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
        active
          ? 'bg-surface text-foreground shadow-soft'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function IncentiveCard({
  incentive: inc,
  busy,
  canManage,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  incentive: Incentive
  busy: boolean
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  const RuleIcon = ruleIcon(inc.ruleType)
  const target =
    inc.ruleType === 'DAILY_SALAH'
      ? inc.targetSalahType
        ? SALAH_LABEL[inc.targetSalahType]
        : '—'
      : inc.ruleType === 'WEEKLY_SALAH_COUNT'
        ? `${inc.targetCount ?? '—'} vakit / hafta`
        : '5 vakit / gün'

  const endsLabel = formatLocalDateTime(inc.endsAt)
  const startsLabel = formatLocalDateTime(inc.startsAt)

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-opacity',
        !inc.active && 'opacity-70',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/10"
      />

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-gold/25">
              <RuleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-lg">
                {inc.title}
              </CardTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="default">{RULE_LABEL[inc.ruleType]}</Badge>
                <Badge variant="default">{target}</Badge>
                {!inc.active && <Badge variant="warning">Pasif</Badge>}
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-lg bg-gold/15 px-3 py-1.5 text-right ring-1 ring-gold/30">
            <p className="font-display text-xl font-bold tabular-nums leading-none text-foreground">
              {inc.rewardPoints}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              puan
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {inc.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {inc.description}
          </p>
        )}

        {(startsLabel || endsLabel) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {startsLabel && (
              <span>
                <span className="font-medium text-foreground/80">Başlar:</span>{' '}
                {startsLabel}
              </span>
            )}
            {endsLabel && (
              <span>
                <span className="font-medium text-foreground/80">Biter:</span>{' '}
                {endsLabel}
              </span>
            )}
          </div>
        )}

        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleActive}
              loading={busy}
            >
              {inc.active ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit} disabled={busy}>
              <PencilLine className="h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={busy}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { Gift }
