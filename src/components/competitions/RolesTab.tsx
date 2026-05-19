'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, UserPlus, X } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  Label,
  Modal,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import {
  api,
  type CompetitionRole,
  type Mosque,
} from '@/lib/api'
import { formatApiError } from '@/lib/hooks'
import { ROLE_LABEL, STATUS_LABEL, statusVariant } from './constants'

/// Yarışma rolleri ekranı: aktif roller listesi + bekleyen istekler +
/// APPROVER cami seçim modalı. Üç alt-bölüm var ama eylem state'leri tightly
/// coupled (acting, refresh, approveTarget); tek dosyada kalması daha
/// okunabilir. Modal alt-komponent olarak ileride ayrıştırılabilir.
export function RolesTab({
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
  const [approveTarget, setApproveTarget] = useState<CompetitionRole | null>(null)
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
        setError(formatApiError(rolesRes.reason, 'Roller alınamadı.'))
      }

      if (reqRes.status === 'fulfilled') {
        setRequests(reqRes.value)
      } else {
        // listRequests OWNER/MANAGER dışı için forbidden olabilir — sessizce tolerate.
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
      setError(formatApiError(err, 'Talep gönderilemedi.'))
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
      setApproveError(formatApiError(err, 'Onaylanamadı.'))
    } finally {
      setApproveSubmitting(false)
    }
  }

  const rejectRequest = async (role: CompetitionRole) => {
    if (!confirm(`"${role.name} ${role.surname}" talebini reddetmek istiyor musun?`)) return
    setActing(role.id)
    setError(null)
    try {
      await api.competitionRoles.rejectRequest(competitionId, role.id)
      await refresh()
    } catch (err) {
      setError(formatApiError(err, 'Reddedilemedi.'))
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
      setError(formatApiError(err, 'Kaldırılamadı.'))
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
              <Button size="sm" onClick={requestApprover} loading={acting === -1}>
                <UserPlus className="h-4 w-4" /> Onaylayıcı olmak istiyorum
              </Button>
            )}
          </div>
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Aktif roller</h3>
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
                        <span className="text-xs text-muted-foreground">{r.email}</span>
                      </div>
                    </TD>
                    <TD>
                      <Badge variant={r.type === 'OWNER' ? 'accent' : 'default'}>
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
                          <span className="text-xs text-muted-foreground">—</span>
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
            <h3 className="text-sm font-semibold text-foreground">Bekleyen istekler</h3>
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
                        <span className="text-xs text-muted-foreground">{r.email}</span>
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
              Seçim yapmazsan kullanıcı hiçbir caminin misafir onaylarını göremez.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
