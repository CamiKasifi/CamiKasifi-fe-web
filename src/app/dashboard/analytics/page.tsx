'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorBanner,
  Label,
  PageHeader,
  Select,
  Spinner,
  Stat,
} from '@/components/ui'
import { isImam, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type Mosque,
  type MosqueAnalytics,
  type SalahType,
} from '@/lib/api'

const SALAH_LABEL: Record<SalahType, string> = {
  FAJR: 'Sabah',
  DHUHR: 'Öğle',
  ASR: 'İkindi',
  MAGHRIB: 'Akşam',
  ISHA: 'Yatsı',
}

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

const DAY_LABEL: Record<(typeof DAY_ORDER)[number], string> = {
  MONDAY: 'Pzt',
  TUESDAY: 'Sal',
  WEDNESDAY: 'Çar',
  THURSDAY: 'Per',
  FRIDAY: 'Cum',
  SATURDAY: 'Cmt',
  SUNDAY: 'Paz',
}

function BarRow({
  label,
  value,
  max,
  highlight = false,
}: {
  label: string
  value: number
  max: number
  highlight?: boolean
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={highlight ? 'font-semibold text-destructive' : 'text-foreground/80'}>
          {label}
        </span>
        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {value}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            highlight
              ? 'h-full rounded-full bg-destructive/70'
              : 'h-full rounded-full bg-accent'
          }
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { roles } = useAuth()
  const imam = isImam(roles)

  const [mosques, setMosques] = useState<Mosque[]>([])
  const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null)
  const [analytics, setAnalytics] = useState<MosqueAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!imam) {
      setLoading(false)
      return
    }
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await api.imamMosques.list()
        if (cancelled) return
        setMosques(list)
        if (list.length > 0) setSelectedMosqueId(list[0].id)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Camiler alınamadı.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [imam])

  useEffect(() => {
    if (selectedMosqueId == null) return
    let cancelled = false
    void (async () => {
      setLoadingData(true)
      setError(null)
      try {
        const data = await api.imamMosques.analytics(selectedMosqueId)
        if (cancelled) return
        setAnalytics(data)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Analitik alınamadı.')
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedMosqueId])

  const salahRows = useMemo(() => {
    if (!analytics) return []
    const order: SalahType[] = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']
    const max = Math.max(1, ...order.map((s) => analytics.bySalahType[s] ?? 0))
    return order.map((s) => ({
      key: s,
      label: SALAH_LABEL[s],
      value: analytics.bySalahType[s] ?? 0,
      max,
      highlight: analytics.weakestSalahType === s,
    }))
  }, [analytics])

  const dayRows = useMemo(() => {
    if (!analytics) return []
    const max = Math.max(
      1,
      ...DAY_ORDER.map((d) => analytics.byDayOfWeek[d] ?? 0),
    )
    return DAY_ORDER.map((d) => ({
      key: d,
      label: DAY_LABEL[d],
      value: analytics.byDayOfWeek[d] ?? 0,
      max,
    }))
  }, [analytics])

  const ageRows = useMemo(() => {
    if (!analytics) return []
    const entries = Object.entries(analytics.ageDistribution)
    const max = Math.max(1, ...entries.map(([, v]) => v))
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ key: k, label: k, value: v, max }))
  }, [analytics])

  const frequencyRows = useMemo(() => {
    if (!analytics) return []
    const order = ['1', '2_3', '4_7', '8_PLUS']
    const labels: Record<string, string> = {
      '1': '1 oturum',
      '2_3': '2–3 oturum',
      '4_7': '4–7 oturum',
      '8_PLUS': '8+ oturum',
    }
    const entries = order
      .filter((k) => analytics.visitFrequencyBuckets[k] != null)
      .map((k) => ({
        key: k,
        label: labels[k] ?? k,
        value: analytics.visitFrequencyBuckets[k] ?? 0,
      }))
    const max = Math.max(1, ...entries.map((e) => e.value))
    return entries.map((e) => ({ ...e, max }))
  }, [analytics])

  if (!imam) {
    return (
      <>
        <PageHeader title="Analitik" />
        <ErrorBanner message="Bu sayfa yalnızca imam hesabıyla görülebilir." />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Analitik"
        description={
          analytics
            ? `Son ${analytics.windowDays} günün cemaat hareketleri.`
            : 'Sorumlu olduğun camilerin cemaat hareketlerini incele.'
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : mosques.length === 0 ? (
        <EmptyState
          title="Atanmış cami yok"
          description="Önce Camilerim sayfasından sorumlu olduğun camileri seç."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Label
              htmlFor="mosque"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Cami
            </Label>
            <Select
              id="mosque"
              value={selectedMosqueId ?? ''}
              onChange={(e) => setSelectedMosqueId(Number(e.target.value))}
              className="max-w-sm"
            >
              {mosques.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.district}, {m.city}
                </option>
              ))}
            </Select>
          </div>

          {loadingData || !analytics ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Analitik yükleniyor…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat
                  label="Tekil cemaat"
                  value={analytics.uniqueAttendees}
                  hint={`Son ${analytics.windowDays} gün`}
                  icon={Users}
                />
                <Stat
                  label="Geçerli oturum"
                  value={analytics.totalValidSessions}
                  hint="Onaylanan namaz oturumları"
                  icon={TrendingUp}
                />
                <Stat
                  label="En zayıf vakit"
                  value={
                    analytics.weakestSalahType
                      ? SALAH_LABEL[analytics.weakestSalahType as SalahType] ??
                        analytics.weakestSalahType
                      : '—'
                  }
                  hint="Katılım en düşük"
                  icon={Sparkles}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-accent" /> Vakit dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {salahRows.map((r) => (
                      <BarRow
                        key={r.key}
                        label={r.label}
                        value={r.value}
                        max={r.max}
                        highlight={r.highlight}
                      />
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Kırmızı çubuk en zayıf vakti gösterir.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-accent" /> Gün dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayRows.map((r) => (
                      <BarRow
                        key={r.key}
                        label={r.label}
                        value={r.value}
                        max={r.max}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Yaş dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ageRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Cemaatin yaş bilgisi henüz yetersiz.
                      </p>
                    ) : (
                      ageRows.map((r) => (
                        <BarRow
                          key={r.key}
                          label={r.label}
                          value={r.value}
                          max={r.max}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Ziyaret sıklığı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {frequencyRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Yeterli veri yok.
                      </p>
                    ) : (
                      frequencyRows.map((r) => (
                        <BarRow
                          key={r.key}
                          label={r.label}
                          value={r.value}
                          max={r.max}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    En sadık cemaat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topAttendees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Henüz sıralanacak cemaat yok.
                    </p>
                  ) : (
                    <ol className="divide-y divide-border">
                      {analytics.topAttendees.map((t, idx) => (
                        <li
                          key={t.personId}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent">
                              {idx + 1}
                            </span>
                            <span className="truncate text-sm font-medium text-foreground">
                              {t.name} {t.surname}
                            </span>
                          </span>
                          <span className="font-mono tabular-nums text-xs text-muted-foreground">
                            {t.validSessionCount} oturum
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  )
}
