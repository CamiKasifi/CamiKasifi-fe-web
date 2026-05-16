'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BarChart3,
  Check,
  Plus,
  ShieldCheck,
  Trophy,
  UserPlus,
  X,
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
  PageHeader,
  Select,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { isAdmin, isImam, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type Competition,
  type CompetitionRole,
  type CompetitionRoleType,
  type LeaderboardEntry,
  type Mosque,
} from '@/lib/api'

type Tab = 'leaderboard' | 'roles'

const ROLE_LABEL: Record<CompetitionRoleType, string> = {
  OWNER: 'Sahip',
  MANAGER: 'Yönetici',
  APPROVER: 'Onaylayıcı',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylı',
  REJECTED: 'Reddedildi',
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

export default function CompetitionsPage() {
  const { user, roles } = useAuth()
  const admin = isAdmin(roles)
  const imam = isImam(roles)
  const canCreate = admin || imam

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [mosques, setMosques] = useState<Mosque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('leaderboard')

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [centralMosqueId, setCentralMosqueId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [comps, ms] = await Promise.all([
        api.competitions.list(),
        admin ? api.mosques.list() : api.imamMosques.list(),
      ])
      setCompetitions(comps)
      setMosques(ms)
      if (selectedId == null && comps.length > 0) {
        setSelectedId(comps[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Veriler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin])

  const openCreate = () => {
    setName('')
    setCentralMosqueId('')
    setFormError(null)
    setModalOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      const created = await api.competitions.create({
        name: name.trim(),
        centralMosqueId: centralMosqueId ? Number(centralMosqueId) : null,
      })
      setModalOpen(false)
      setSelectedId(created.id)
      await refresh()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Yarışma oluşturulamadı.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCompetition = competitions.find((c) => c.id === selectedId)
  const centralMosque = selectedCompetition?.centralMosqueId
    ? mosques.find((m) => m.id === selectedCompetition.centralMosqueId)
    : null

  return (
    <>
      <PageHeader
        title={admin ? 'Yarışmalar' : 'Yarışmalarım'}
        description="Yarışmaları oluştur, sıralamaları ve rolleri yönet."
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Yeni Yarışma
            </Button>
          )
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : competitions.length === 0 ? (
        <EmptyState
          title="Henüz yarışma yok"
          description={
            canCreate
              ? 'İlk yarışmayı oluşturmak için "Yeni Yarışma" butonuna bas.'
              : 'Aktif yarışma bulunmuyor.'
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Yarışmalar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {competitions.map((c) => {
                  const active = c.id === selectedId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(c.id)
                          setTab('leaderboard')
                        }}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                          active
                            ? 'bg-accent/10 text-accent'
                            : 'text-foreground/80 hover:bg-muted',
                        )}
                      >
                        <Trophy className="h-4 w-4 shrink-0" />
                        <span className="truncate font-medium">{c.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {selectedCompetition?.name ?? 'Yarışma seç'}
                  </CardTitle>
                  {centralMosque && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Merkez cami:{' '}
                      <span className="font-medium text-foreground">
                        {centralMosque.name}
                      </span>{' '}
                      · {centralMosque.district}
                    </p>
                  )}
                </div>
                {selectedCompetition && (
                  <Badge variant="default">#{selectedCompetition.id}</Badge>
                )}
              </div>

              {selectedCompetition && (
                <div
                  role="tablist"
                  aria-label="Yarışma sekmeleri"
                  className="mt-3 inline-flex rounded-md border border-border bg-muted/40 p-0.5"
                >
                  <TabButton
                    active={tab === 'leaderboard'}
                    onClick={() => setTab('leaderboard')}
                    icon={BarChart3}
                  >
                    Sıralama
                  </TabButton>
                  <TabButton
                    active={tab === 'roles'}
                    onClick={() => setTab('roles')}
                    icon={ShieldCheck}
                  >
                    Roller
                  </TabButton>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              {!selectedCompetition ? (
                <p className="text-sm text-muted-foreground">
                  Detay için bir yarışma seç.
                </p>
              ) : tab === 'leaderboard' ? (
                <LeaderboardTab competitionId={selectedCompetition.id} />
              ) : (
                <RolesTab
                  competitionId={selectedCompetition.id}
                  imam={imam}
                  currentUserId={user?.id ?? null}
                  mosques={mosques}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni yarışma"
        description="İsteğe bağlı olarak bir merkez cami seçebilirsin."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Vazgeç
            </Button>
            <Button form="competition-form" type="submit" loading={submitting}>
              Oluştur
            </Button>
          </>
        }
      >
        <form
          id="competition-form"
          onSubmit={submit}
          className="space-y-3"
          noValidate
        >
          <ErrorBanner message={formError} />

          <div className="space-y-1.5">
            <Label htmlFor="competition-name">Yarışma adı</Label>
            <Input
              id="competition-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ramazan Cemaat Yarışması"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="central-mosque">Merkez cami (opsiyonel)</Label>
            <Select
              id="central-mosque"
              value={centralMosqueId}
              onChange={(e) => setCentralMosqueId(e.target.value)}
            >
              <option value="">— Seçilmedi —</option>
              {mosques.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.district})
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <button
      role="tab"
      type="button"
      onClick={onClick}
      aria-selected={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
        active
          ? 'bg-surface text-foreground shadow-soft'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

function LeaderboardTab({ competitionId }: { competitionId: number }) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.competitions
      .leaderboard(competitionId)
      .then((rows) => {
        if (!cancelled) setBoard(rows)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : 'Sıralama alınamadı.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [competitionId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Sıralama yükleniyor…
      </div>
    )
  }
  if (error) return <ErrorBanner message={error} />
  if (board.length === 0) {
    return (
      <EmptyState
        title="Henüz katılım yok"
        description="Yarışmaya katılan kullanıcılar burada görünecek."
      />
    )
  }
  return (
    <Table>
      <THead>
        <TR>
          <TH className="w-12">#</TH>
          <TH>Katılımcı</TH>
          <TH className="text-right">Puan</TH>
        </TR>
      </THead>
      <tbody>
        {board.map((row) => (
          <TR key={row.personId}>
            <TD className="tabular-nums text-muted-foreground">{row.rank}</TD>
            <TD className="font-medium">
              {row.name} {row.surname}
            </TD>
            <TD className="text-right font-mono tabular-nums">
              {row.totalPoint}
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  )
}

function RolesTab({
  competitionId,
  imam,
  currentUserId,
  mosques,
}: {
  competitionId: number
  imam: boolean
  currentUserId: number | null
  mosques: Mosque[]
}) {
  const [activeRoles, setActiveRoles] = useState<CompetitionRole[]>([])
  const [requests, setRequests] = useState<CompetitionRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<number | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<CompetitionRole | null>(
    null,
  )
  const [pickedMosqueIds, setPickedMosqueIds] = useState<number[]>([])
  const [approveSubmitting, setApproveSubmitting] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesRes, reqRes] = await Promise.allSettled([
        api.competitionRoles.list(competitionId),
        api.competitionRoles.listRequests(competitionId),
      ])

      if (rolesRes.status === 'fulfilled') {
        setActiveRoles(rolesRes.value)
      } else {
        const err = rolesRes.reason
        setError(
          err instanceof ApiError ? err.message : 'Roller alınamadı.',
        )
      }

      if (reqRes.status === 'fulfilled') {
        setRequests(reqRes.value)
      } else {
        // listRequests may be forbidden for non-OWNER/MANAGER → tolerate
        setRequests([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId])

  const myRole = useMemo(() => {
    if (currentUserId == null) return null
    return (
      activeRoles.find((r) => r.userId === currentUserId) ??
      requests.find((r) => r.userId === currentUserId) ??
      null
    )
  }, [activeRoles, requests, currentUserId])

  const canManage = useMemo(() => {
    if (!currentUserId) return false
    return activeRoles.some(
      (r) =>
        r.userId === currentUserId &&
        r.status === 'APPROVED' &&
        (r.type === 'OWNER' || r.type === 'MANAGER'),
    )
  }, [activeRoles, currentUserId])

  const pendingRequests = requests.filter((r) => r.status === 'PENDING')

  const requestApprover = async () => {
    setActing(-1)
    setError(null)
    setInfo(null)
    try {
      await api.competitionRoles.requestApprover(competitionId)
      setInfo('Onaylayıcı talebin gönderildi. Yönetici incelemesini bekliyor.')
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Talep gönderilemedi.')
    } finally {
      setActing(null)
    }
  }

  const openApprove = (role: CompetitionRole) => {
    setApproveTarget(role)
    setPickedMosqueIds(role.mosqueIds ?? [])
    setApproveError(null)
    setApproveOpen(true)
  }

  const submitApprove = async () => {
    if (!approveTarget) return
    setApproveSubmitting(true)
    setApproveError(null)
    try {
      await api.competitionRoles.approveRequest(
        competitionId,
        approveTarget.id,
        approveTarget.type === 'APPROVER'
          ? { mosqueIds: pickedMosqueIds }
          : undefined,
      )
      setApproveOpen(false)
      setApproveTarget(null)
      await refresh()
    } catch (err) {
      setApproveError(
        err instanceof ApiError ? err.message : 'Onaylanamadı.',
      )
    } finally {
      setApproveSubmitting(false)
    }
  }

  const rejectRequest = async (role: CompetitionRole) => {
    if (!confirm(`"${role.name} ${role.surname}" talebini reddetmek istiyor musun?`))
      return
    setActing(role.id)
    setError(null)
    try {
      await api.competitionRoles.rejectRequest(competitionId, role.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reddedilemedi.')
    } finally {
      setActing(null)
    }
  }

  const removeRole = async (role: CompetitionRole) => {
    if (role.type === 'OWNER') return
    if (
      !confirm(
        `"${role.name} ${role.surname}" — ${ROLE_LABEL[role.type]} rolünü kaldırmak istiyor musun?`,
      )
    )
      return
    setActing(role.id)
    setError(null)
    try {
      await api.competitionRoles.remove(competitionId, role.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaldırılamadı.')
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Roller yükleniyor…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />
      {info && (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {info}
        </div>
      )}

      {imam && (
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                Bu yarışmadaki rolün
              </p>
              <p className="text-xs text-muted-foreground">
                {myRole ? (
                  <>
                    <Badge variant={statusVariant(myRole.status)}>
                      {STATUS_LABEL[myRole.status] ?? myRole.status}
                    </Badge>{' '}
                    · {ROLE_LABEL[myRole.type]}
                  </>
                ) : (
                  'Henüz bir rolün yok.'
                )}
              </p>
            </div>
            {!myRole && (
              <Button
                size="sm"
                onClick={requestApprover}
                loading={acting === -1}
              >
                <UserPlus className="h-4 w-4" /> Onaylayıcı olmak istiyorum
              </Button>
            )}
          </div>
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Aktif roller
          </h3>
          <Badge variant="default">{activeRoles.length}</Badge>
        </div>
        {activeRoles.length === 0 ? (
          <EmptyState title="Aktif rol yok" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Kullanıcı</TH>
                <TH>Rol</TH>
                <TH>Camiler</TH>
                <TH>Durum</TH>
                {canManage && <TH className="text-right">İşlem</TH>}
              </TR>
            </THead>
            <tbody>
              {activeRoles.map((r) => {
                const mosqueNames = (r.mosqueIds ?? [])
                  .map((id) => mosques.find((m) => m.id === id)?.name ?? `#${id}`)
                  .join(', ')
                return (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.name} {r.surname}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.email}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <Badge
                        variant={r.type === 'OWNER' ? 'accent' : 'default'}
                      >
                        {ROLE_LABEL[r.type]}
                      </Badge>
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {mosqueNames || '—'}
                    </TD>
                    <TD>
                      <Badge variant={statusVariant(r.status)}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TD>
                    {canManage && (
                      <TD className="text-right">
                        {r.type === 'OWNER' ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRole(r)}
                            loading={acting === r.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" /> Kaldır
                          </Button>
                        )}
                      </TD>
                    )}
                  </TR>
                )
              })}
            </tbody>
          </Table>
        )}
      </section>

      {canManage && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Bekleyen istekler
            </h3>
            <Badge variant="warning">{pendingRequests.length}</Badge>
          </div>
          {pendingRequests.length === 0 ? (
            <EmptyState
              title="Bekleyen istek yok"
              description="Tüm rol istekleri sonuçlandırıldı."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Kullanıcı</TH>
                  <TH>İstenen rol</TH>
                  <TH className="text-right">İşlem</TH>
                </TR>
              </THead>
              <tbody>
                {pendingRequests.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.name} {r.surname}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.email}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <Badge variant="default">{ROLE_LABEL[r.type]}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => rejectRequest(r)}
                          loading={acting === r.id}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" /> Reddet
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openApprove(r)}
                          loading={acting === r.id}
                        >
                          <Check className="h-4 w-4" /> Onayla
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      )}

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Talebi onayla"
        description={
          approveTarget?.type === 'APPROVER'
            ? 'Onaylayıcının hangi camiler için yetkili olacağını seç.'
            : 'Talebi onaylamak için aşağıdaki butona bas.'
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setApproveOpen(false)}
              disabled={approveSubmitting}
            >
              Vazgeç
            </Button>
            <Button onClick={submitApprove} loading={approveSubmitting}>
              <Check className="h-4 w-4" /> Onayla
            </Button>
          </>
        }
      >
        <ErrorBanner message={approveError} />
        {approveTarget?.type === 'APPROVER' && (
          <div className="space-y-2">
            <Label>Yetkili camiler</Label>
            {mosques.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Önce yarışmaya bağlı camileri tanımla.
              </p>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                {mosques.map((m) => {
                  const checked = pickedMosqueIds.includes(m.id)
                  return (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setPickedMosqueIds((prev) =>
                            e.target.checked
                              ? [...prev, m.id]
                              : prev.filter((id) => id !== m.id),
                          )
                        }
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
                      />
                      <span className="flex-1">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({m.district})
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Seçim yapmazsan kullanıcı hiçbir caminin misafir onaylarını
              göremez.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
