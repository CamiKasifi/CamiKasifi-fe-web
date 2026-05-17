'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Gauge, RefreshCw, X } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Select,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { isImam, useAuth } from '@/lib/auth'
import { api, ApiError, type ApprovalItem } from '@/lib/api'
import { formatDateTime, salahLabel } from '@/lib/utils'

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
}

const KIND_LABEL: Record<string, string> = {
  CENTRAL: 'Merkez',
  GUEST: 'Misafir',
}

const FLAG_LABEL: Record<string, string> = {
  MOCK_LOCATION: 'Sahte konum',
  ANOMALOUS_SPEED: 'Anormal hız',
}

function statusVariant(
  status: string,
): 'default' | 'success' | 'warning' | 'destructive' {
  const s = status.toUpperCase()
  if (s === 'APPROVED') return 'success'
  if (s === 'PENDING') return 'warning'
  if (s === 'REJECTED') return 'destructive'
  return 'default'
}

export default function ApprovalsPage() {
  const router = useRouter()
  const { roles, loading: authLoading } = useAuth()
  const imam = isImam(roles)

  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [acting, setActing] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkInfo, setBulkInfo] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !imam) router.replace('/dashboard')
  }, [authLoading, imam, router])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    setBulkInfo(null)
    try {
      const list = await api.approvals.list()
      setItems(list)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Onaylar alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (imam) void refresh()
  }, [imam])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return items
    return items.filter((i) => i.status?.toUpperCase() === filter)
  }, [items, filter])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      ALL: items.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    }
    for (const i of items) {
      const s = i.status?.toUpperCase() as Filter
      if (s === 'PENDING' || s === 'APPROVED' || s === 'REJECTED') c[s] += 1
    }
    return c
  }, [items])

  const suspiciousCount = useMemo(
    () =>
      filtered.filter(
        (i) =>
          i.status?.toUpperCase() === 'PENDING' &&
          i.suspiciousFlags &&
          i.suspiciousFlags.length > 0,
      ).length,
    [filtered],
  )

  const pendingIdsInFiltered = useMemo(
    () =>
      filtered
        .filter((i) => i.status?.toUpperCase() === 'PENDING')
        .map((i) => i.id),
    [filtered],
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === pendingIdsInFiltered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingIdsInFiltered))
    }
  }

  const act = async (item: ApprovalItem, kind: 'approve' | 'reject') => {
    setActing(item.id)
    setError(null)
    try {
      if (kind === 'approve') await api.approvals.approve(item.id)
      else await api.approvals.reject(item.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız.')
    } finally {
      setActing(null)
    }
  }

  const bulkAct = async (kind: 'approve' | 'reject') => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setBulkBusy(true)
    setError(null)
    setBulkInfo(null)
    try {
      const result =
        kind === 'approve'
          ? await api.approvals.bulkApprove(ids)
          : await api.approvals.bulkReject(ids)
      const parts: string[] = []
      parts.push(`${result.succeeded} ${kind === 'approve' ? 'onaylandı' : 'reddedildi'}`)
      if (result.failed > 0) {
        parts.push(`${result.failed} başarısız`)
      }
      setBulkInfo(parts.join(', '))
      await refresh()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Toplu işlem başarısız.',
      )
    } finally {
      setBulkBusy(false)
    }
  }

  if (!imam) return null

  const showBulkBar =
    filter === 'PENDING' && pendingIdsInFiltered.length > 0
  const allSelected =
    selected.size > 0 && selected.size === pendingIdsInFiltered.length

  return (
    <>
      <PageHeader
        title="Onaylar"
        description="Cemaat üyelerinin gönderdiği namaz onaylarını incele."
        actions={
          <Button variant="secondary" onClick={refresh}>
            <RefreshCw className="h-4 w-4" /> Yenile
          </Button>
        }
      />

      <ErrorBanner message={error} />
      {bulkInfo && (
        <div className="mb-4 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {bulkInfo}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Durum filtresi"
          >
            <option value="PENDING">Bekleyen ({counts.PENDING})</option>
            <option value="APPROVED">Onaylanan ({counts.APPROVED})</option>
            <option value="REJECTED">Reddedilen ({counts.REJECTED})</option>
            <option value="ALL">Tümü ({counts.ALL})</option>
          </Select>
        </div>
        <Badge variant="default">{filtered.length} kayıt</Badge>
        {suspiciousCount > 0 && (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            {suspiciousCount} şüpheli
          </Badge>
        )}
      </div>

      {showBulkBar && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {selected.size} / {pendingIdsInFiltered.length} seçili
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSelectAll}
          >
            {allSelected ? 'Seçimi kaldır' : 'Tümünü seç'}
          </Button>
          <span className="flex-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => bulkAct('reject')}
            loading={bulkBusy}
            disabled={selected.size === 0}
            className="text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" /> Toplu reddet
          </Button>
          <Button
            size="sm"
            onClick={() => bulkAct('approve')}
            loading={bulkBusy}
            disabled={selected.size === 0}
          >
            <Check className="h-4 w-4" /> Toplu onayla
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            filter === 'PENDING'
              ? 'Bekleyen onay yok'
              : 'Bu filtrede kayıt yok'
          }
          description={
            filter === 'PENDING'
              ? 'Tüm onaylar tamamlanmış görünüyor.'
              : 'Farklı bir filtre dene.'
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              {showBulkBar && <TH className="w-8" />}
              <TH>Kullanıcı</TH>
              <TH>Yarışma</TH>
              <TH>Namaz</TH>
              <TH>Cami</TH>
              <TH>Tip</TH>
              <TH>Tarih</TH>
              <TH>Şüpheli</TH>
              <TH>Durum</TH>
              <TH className="text-right">İşlem</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((item) => {
              const isPending = item.status?.toUpperCase() === 'PENDING'
              const busy = acting === item.id
              const fullName =
                [item.personName, item.personSurname]
                  .filter(Boolean)
                  .join(' ') ||
                (item.personId != null ? `#${item.personId}` : '—')
              const kindRaw = (item.type ?? '').toString().toUpperCase()
              const kindLabel = KIND_LABEL[kindRaw] ?? kindRaw ?? '—'
              const flags = item.suspiciousFlags ?? []
              const suspicious = isPending && flags.length > 0
              return (
                <TR
                  key={item.id}
                  className={
                    suspicious
                      ? 'bg-destructive/5'
                      : undefined
                  }
                >
                  {showBulkBar && (
                    <TD>
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`#${item.id} seç`}
                          className="h-4 w-4 cursor-pointer"
                        />
                      ) : null}
                    </TD>
                  )}
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium">{fullName}</span>
                      {item.personId != null && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          #{item.personId}
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">
                    {item.competitionName ??
                      (item.competitionId != null
                        ? `#${item.competitionId}`
                        : '—')}
                  </TD>
                  <TD>{salahLabel(item.salahType)}</TD>
                  <TD className="text-muted-foreground">
                    {item.mosqueName ??
                      (item.mosqueId != null ? `#${item.mosqueId}` : '—')}
                  </TD>
                  <TD>
                    <Badge variant={kindRaw === 'CENTRAL' ? 'accent' : 'default'}>
                      {kindLabel}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {formatDateTime(item.sessionStartTime ?? item.createdAt)}
                  </TD>
                  <TD>
                    {flags.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {flags.map((f) => (
                          <Badge key={f} variant="destructive">
                            <AlertTriangle className="mr-1 inline h-3 w-3" />
                            {FLAG_LABEL[f] ?? f}
                          </Badge>
                        ))}
                        {item.maxSpeedKmh != null && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                            <Gauge className="h-3 w-3" />
                            pik {Math.round(item.maxSpeedKmh)} km/h
                          </span>
                        )}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(item.status ?? '')}>
                      {STATUS_LABEL[item.status?.toUpperCase() ?? ''] ??
                        item.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    {isPending ? (
                      <div className="inline-flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => act(item, 'reject')}
                          loading={busy}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" /> Reddet
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => act(item, 'approve')}
                          loading={busy}
                        >
                          <Check className="h-4 w-4" /> Onayla
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      )}
    </>
  )
}
