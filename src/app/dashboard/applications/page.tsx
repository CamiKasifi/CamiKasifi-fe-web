'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Mail, Phone, Search, X } from 'lucide-react'
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
} from '@/components/ui'
import { isAdmin, useAuth } from '@/lib/auth'
import {
  api,
  type ApplicationStatus,
  type ImamMosqueApplication,
  type Mosque,
} from '@/lib/api'
import { formatApiError, useFetchData } from '@/lib/hooks'

type FilterValue = ApplicationStatus | 'ALL'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'PENDING', label: 'Bekleyen' },
  { value: 'APPROVED', label: 'Onaylanan' },
  { value: 'REJECTED', label: 'Reddedilen' },
  { value: 'ALL', label: 'Tümü' },
]

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
}

const STATUS_VARIANT: Record<
  ApplicationStatus,
  'warning' | 'success' | 'destructive'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const admin = isAdmin(user)

  const [filter, setFilter] = useState<FilterValue>('PENDING')

  const appsFetch = useFetchData(
    () =>
      api.adminImamApplications.list(
        filter === 'ALL' ? undefined : filter,
      ),
    [filter],
    { enabled: admin, initialData: [] as ImamMosqueApplication[] },
  )
  const applications = appsFetch.data ?? []

  const [approveTarget, setApproveTarget] =
    useState<ImamMosqueApplication | null>(null)
  const [rejectTarget, setRejectTarget] =
    useState<ImamMosqueApplication | null>(null)

  useEffect(() => {
    if (!authLoading && !admin) router.replace('/dashboard')
  }, [authLoading, admin, router])

  if (!admin) return null

  const onDecided = () => appsFetch.refresh()

  return (
    <>
      <PageHeader
        title="İmam Başvuruları"
        description="İmamların cami başvurularını incele, onayla (gerekirse camiyi değiştir) veya reddet."
      />

      <ErrorBanner message={appsFetch.error} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-muted/20 text-foreground hover:bg-muted/40'
              }`}
            >
              {f.label}
            </button>
          )
        })}
        <Badge variant="default" className="ml-auto">
          {applications.length}
        </Badge>
      </div>

      {appsFetch.loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="Başvuru yok"
          description={
            filter === 'PENDING'
              ? 'Şu an bekleyen başvuru bulunmuyor.'
              : 'Bu filtreye uygun başvuru bulunamadı.'
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {[a.applicantName, a.applicantSurname]
                        .filter(Boolean)
                        .join(' ') || `#${a.applicantUserId}`}
                    </span>
                    {a.roleTitle && (
                      <Badge variant="default">{a.roleTitle}</Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[a.status]}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {a.applicantEmail}
                    </span>
                    {a.contactPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {a.contactPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {a.mosqueName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ·{' '}
                      {[a.mosqueNeighbourhood, a.mosqueDistrict, a.mosqueCity]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>

                  {a.note && (
                    <p className="max-w-2xl whitespace-pre-line pt-1 text-sm text-foreground/80">
                      {a.note}
                    </p>
                  )}

                  {a.status !== 'PENDING' && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {a.decidedByName ? `${a.decidedByName} · ` : ''}
                      {a.decidedAt
                        ? new Date(a.decidedAt).toLocaleString('tr-TR')
                        : ''}
                      {a.decisionNote ? ` — ${a.decisionNote}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                  {a.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRejectTarget(a)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" /> Reddet
                      </Button>
                      <Button size="sm" onClick={() => setApproveTarget(a)}>
                        <Check className="h-4 w-4" /> Onayla
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {approveTarget && (
        <ApproveModal
          application={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={() => {
            setApproveTarget(null)
            void onDecided()
          }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          application={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null)
            void onDecided()
          }}
        />
      )}
    </>
  )
}

/// Onay modalı — yönetici camiyi değiştirebilir (varsayılan: başvurulan cami)
/// ve opsiyonel karar notu ekleyebilir.
function ApproveModal({
  application,
  onClose,
  onDone,
}: {
  application: ImamMosqueApplication
  onClose: () => void
  onDone: () => void
}) {
  const [chosen, setChosen] = useState<{
    id: number
    name: string
    sub: string
  }>({
    id: application.mosqueId,
    name: application.mosqueName,
    sub: [
      application.mosqueNeighbourhood,
      application.mosqueDistrict,
      application.mosqueCity,
    ]
      .filter(Boolean)
      .join(', '),
  })
  const [changing, setChanging] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Mosque[]>([])
  const [searching, setSearching] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!changing) return
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        setResults(await api.mosques.search({ q: trimmed, limit: 50 }))
      } catch (err) {
        setError(formatApiError(err, 'Arama başarısız.'))
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [q, changing])

  const applicantName =
    [application.applicantName, application.applicantSurname]
      .filter(Boolean)
      .join(' ') || `#${application.applicantUserId}`

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await api.adminImamApplications.approve(application.id, {
        mosqueId: chosen.id,
        decisionNote: note.trim() || null,
      })
      onDone()
    } catch (err) {
      setError(formatApiError(err, 'Onaylanamadı.'))
    } finally {
      setSubmitting(false)
    }
  }

  const changed = chosen.id !== application.mosqueId

  return (
    <Modal
      open
      onClose={onClose}
      title="Başvuruyu onayla"
      description={`${applicantName} adlı imam için camiyi onayla.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Vazgeç
          </Button>
          <Button onClick={submit} loading={submitting}>
            <Check className="h-4 w-4" /> Onayla
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Atanacak cami {changed && '(değiştirildi)'}
              </p>
              <p className="truncate font-medium text-foreground">
                {chosen.name}
              </p>
              {chosen.sub && (
                <p className="truncate text-xs text-muted-foreground">
                  {chosen.sub}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChanging((v) => !v)}
            >
              {changing ? 'Kapat' : 'Camiyi değiştir'}
            </Button>
          </div>

          {changing && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Yeni cami ara…"
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-1">
                {searching ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                    <Spinner className="h-3.5 w-3.5" /> Aranıyor…
                  </div>
                ) : results.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    {q.trim() ? 'Sonuç yok.' : 'Cami adı yaz.'}
                  </p>
                ) : (
                  results.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setChosen({
                          id: m.id,
                          name: m.name,
                          sub: [m.neighbourhood, m.district, m.city]
                            .filter(Boolean)
                            .join(', '),
                        })
                        setChanging(false)
                        setQ('')
                      }}
                      className="flex w-full flex-col rounded px-3 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="truncate font-medium">{m.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[m.neighbourhood, m.district, m.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="approve-note">Karar notu (opsiyonel)</Label>
          <textarea
            id="approve-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>
    </Modal>
  )
}

/// Red modalı — opsiyonel gerekçe.
function RejectModal({
  application,
  onClose,
  onDone,
}: {
  application: ImamMosqueApplication
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applicantName =
    [application.applicantName, application.applicantSurname]
      .filter(Boolean)
      .join(' ') || `#${application.applicantUserId}`

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await api.adminImamApplications.reject(application.id, {
        decisionNote: note.trim() || null,
      })
      onDone()
    } catch (err) {
      setError(formatApiError(err, 'Reddedilemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Başvuruyu reddet"
      description={`${applicantName} adlı imamın "${application.mosqueName}" başvurusunu reddet.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Vazgeç
          </Button>
          <Button variant="destructive" onClick={submit} loading={submitting}>
            <X className="h-4 w-4" /> Reddet
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ErrorBanner message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="reject-note">Red gerekçesi (opsiyonel)</Label>
          <textarea
            id="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="İmama iletilecek gerekçe…"
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>
    </Modal>
  )
}
