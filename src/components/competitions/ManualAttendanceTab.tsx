'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  Select,
  Spinner,
} from '@/components/ui'
import { api, type LeaderboardEntry, type SalahType } from '@/lib/api'
import { useFetchData, formatApiError } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const SALAH_LABELS: { type: SalahType; label: string }[] = [
  { type: 'FAJR', label: 'Sabah' },
  { type: 'DHUHR', label: 'Öğle' },
  { type: 'ASR', label: 'İkindi' },
  { type: 'MAGHRIB', label: 'Akşam' },
  { type: 'ISHA', label: 'Yatsı' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/// İmam, yarışmasına katılan bir kullanıcıya manuel ibadet (vakit) ekler.
/// Katılımcı listesi leaderboard'dan gelir; bir tarih + bir veya birden çok vakit
/// seçilip gönderilir. Farklı günler için form tekrar gönderilir.
export function ManualAttendanceTab({
  competitionId,
}: {
  competitionId: number
}) {
  const { data, loading, error } = useFetchData<LeaderboardEntry[]>(
    () => api.competitions.leaderboard(competitionId),
    [competitionId],
    { initialData: [] },
  )
  const participants = data ?? []

  const [personId, setPersonId] = useState<string>('')
  const [date, setDate] = useState<string>(todayIso())
  const [selectedSalahs, setSelectedSalahs] = useState<Set<SalahType>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const toggleSalah = (t: SalahType) => {
    setSelectedSalahs((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setResult(null)
    if (!personId) {
      setFormError('Bir katılımcı seç.')
      return
    }
    if (!date) {
      setFormError('Tarih seç.')
      return
    }
    if (selectedSalahs.size === 0) {
      setFormError('En az bir vakit seç.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.competitions.manualAttendance(competitionId, {
        personId: Number(personId),
        entries: Array.from(selectedSalahs).map((salahType) => ({
          salahDate: date,
          salahType,
        })),
      })
      setResult(
        `${res.added} vakit eklendi (+${res.pointsAdded} puan)` +
          (res.skipped > 0
            ? `, ${res.skipped} vakit zaten kayıtlıydı (atlandı)`
            : '.'),
      )
      setSelectedSalahs(new Set())
    } catch (err) {
      setFormError(formatApiError(err, 'İbadet eklenemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Katılımcılar yükleniyor…
      </div>
    )
  }
  if (error) return <ErrorBanner message={error} />
  if (participants.length === 0) {
    return (
      <EmptyState
        title="Henüz katılımcı yok"
        description="Bu yarışmaya bir kullanıcı katıldığında buradan manuel ibadet ekleyebilirsin."
      />
    )
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
      <ErrorBanner message={formError} />
      {result && (
        <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="ma-person">Katılımcı</Label>
        <Select
          id="ma-person"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
        >
          <option value="">— Katılımcı seç —</option>
          {participants.map((p) => (
            <option key={p.personId} value={p.personId}>
              {p.name} {p.surname}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ma-date">Tarih</Label>
        <Input
          id="ma-date"
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Vakitler</Label>
        <div className="flex flex-wrap gap-2">
          {SALAH_LABELS.map(({ type, label }) => {
            const active = selectedSalahs.has(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleSalah(type)}
                aria-pressed={active}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer',
                  active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-foreground/80 hover:bg-muted',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Seçtiğin vakitler bu tarih için eklenir. Farklı gün için tarihi değiştir
          ve tekrar ekle.
        </p>
      </div>

      <Button type="submit" loading={submitting}>
        İbadet ekle
      </Button>
    </form>
  )
}
