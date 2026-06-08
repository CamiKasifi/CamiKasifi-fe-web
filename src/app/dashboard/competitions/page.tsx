'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  BarChart3,
  Calendar,
  CalendarClock,
  CalendarPlus,
  Gift,
  Plus,
  ShieldCheck,
  StopCircle,
  Trophy,
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
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { isAdmin, isImam, useAuth } from '@/lib/auth'
import { api, type Competition, type Mosque } from '@/lib/api'
import { formatApiError } from '@/lib/hooks'
import { DateTimePicker } from '@/components/DateTimePicker'
import { IncentivesTab } from '@/components/competitions/IncentivesTab'
import { LeaderboardTab } from '@/components/competitions/LeaderboardTab'
import { ManualAttendanceTab } from '@/components/competitions/ManualAttendanceTab'
import { RolesTab } from '@/components/competitions/RolesTab'
import { TabButton } from '@/components/competitions/TabButton'

type Tab = 'leaderboard' | 'roles' | 'incentives' | 'manual'

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
}

function isClosed(c: Competition) {
  return c.status === 'CLOSED' || !!c.closedAt
}

export default function CompetitionsPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const imam = isImam(user)
  const canCreate = admin || imam

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [mosques, setMosques] = useState<Mosque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('leaderboard')

  // Create modal
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [centralMosqueId, setCentralMosqueId] = useState<string>('')
  const [createEndsAt, setCreateEndsAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Close confirm modal
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [closeSubmitting, setCloseSubmitting] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  // Update endsAt modal
  const [updateEndsAtOpen, setUpdateEndsAtOpen] = useState(false)
  const [newEndsAt, setNewEndsAt] = useState('')
  const [endsAtSubmitting, setEndsAtSubmitting] = useState(false)
  const [endsAtError, setEndsAtError] = useState<string | null>(null)

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
      setError(formatApiError(err, 'Veriler alınamadı.'))
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
    setCreateEndsAt('')
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
        endsAt: createEndsAt ? new Date(createEndsAt).toISOString() : null,
      })
      setModalOpen(false)
      setSelectedId(created.id)
      await refresh()
    } catch (err) {
      setFormError(formatApiError(err, 'Yarışma oluşturulamadı.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId) return
    setCloseSubmitting(true)
    setCloseError(null)
    try {
      await api.competitions.close(selectedId)
      setCloseConfirmOpen(false)
      await refresh()
    } catch (err) {
      setCloseError(formatApiError(err, 'Yarışma kapatılamadı.'))
    } finally {
      setCloseSubmitting(false)
    }
  }

  const openUpdateEndsAt = () => {
    const current = selectedCompetition?.endsAt
    setNewEndsAt(current ? current.slice(0, 16) : '')
    setEndsAtError(null)
    setUpdateEndsAtOpen(true)
  }

  const handleUpdateEndsAt = async () => {
    if (!selectedId || !newEndsAt) return
    setEndsAtSubmitting(true)
    setEndsAtError(null)
    try {
      await api.competitions.updateEndsAt(selectedId, new Date(newEndsAt).toISOString())
      setUpdateEndsAtOpen(false)
      await refresh()
    } catch (err) {
      setEndsAtError(formatApiError(err, 'Bitiş tarihi güncellenemedi.'))
    } finally {
      setEndsAtSubmitting(false)
    }
  }

  const selectedCompetition = competitions.find((c) => c.id === selectedId)
  const centralMosque = selectedCompetition?.centralMosqueId
    ? mosques.find((m) => m.id === selectedCompetition.centralMosqueId)
    : null
  const selectedIsClosed = selectedCompetition ? isClosed(selectedCompetition) : false

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
                  const closed = isClosed(c)
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
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-medium">{c.name}</span>
                          {(c.startedAt || c.endsAt) && (
                            <span className="block text-[10px] text-muted-foreground">
                              {fmtDate(c.startedAt)} – {fmtDate(c.endsAt)}
                            </span>
                          )}
                        </span>
                        {closed && (
                          <Badge variant="destructive" className="shrink-0 text-[9px] py-0 px-1.5">
                            KAPANDI
                          </Badge>
                        )}
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
                <div className="flex-1 min-w-0">
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
                  {selectedCompetition && (selectedCompetition.startedAt || selectedCompetition.endsAt || selectedCompetition.closedAt) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {fmtDate(selectedCompetition.startedAt)}
                      {' – '}
                      {selectedCompetition.closedAt
                        ? `Kapandı: ${fmtDate(selectedCompetition.closedAt)}`
                        : fmtDate(selectedCompetition.endsAt)}
                    </p>
                  )}
                  {canCreate && selectedCompetition && !selectedIsClosed && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={openUpdateEndsAt}
                        className="h-7 px-2.5 text-xs"
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Bitiş Tarihini Güncelle
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setCloseConfirmOpen(true)}
                        className="h-7 px-2.5 text-xs"
                      >
                        <StopCircle className="h-3.5 w-3.5" /> Yarışmayı Bitir
                      </Button>
                    </div>
                  )}
                </div>
                {selectedCompetition && (
                  <Badge variant={selectedIsClosed ? 'destructive' : 'default'}>
                    {selectedIsClosed ? 'KAPANDI' : `#${selectedCompetition.id}`}
                  </Badge>
                )}
              </div>

              {selectedCompetition && (
                <div
                  role="tablist"
                  aria-label="Yarışma sekmeleri"
                  className="mt-3 inline-flex flex-wrap rounded-md border border-border bg-muted/40 p-0.5"
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
                  <TabButton
                    active={tab === 'incentives'}
                    onClick={() => setTab('incentives')}
                    icon={Gift}
                  >
                    Teşvikler
                  </TabButton>
                  {canCreate && (
                    <TabButton
                      active={tab === 'manual'}
                      onClick={() => setTab('manual')}
                      icon={CalendarPlus}
                    >
                      İbadet Ekle
                    </TabButton>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              {!selectedCompetition ? (
                <p className="text-sm text-muted-foreground">
                  Detay için bir yarışma seç.
                </p>
              ) : tab === 'leaderboard' ? (
                <LeaderboardTab
                  competitionId={selectedCompetition.id}
                  canManage={canCreate && !selectedIsClosed}
                />
              ) : tab === 'roles' ? (
                <RolesTab
                  competitionId={selectedCompetition.id}
                  imam={imam}
                  currentUserId={user?.id ?? null}
                  mosques={mosques}
                />
              ) : tab === 'manual' ? (
                <ManualAttendanceTab competitionId={selectedCompetition.id} />
              ) : (
                <IncentivesTab
                  competitionId={selectedCompetition.id}
                  imam={imam}
                  admin={admin}
                  currentUserId={user?.id ?? null}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Yeni Yarışma Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni yarışma"
        description="İsteğe bağlı olarak bir merkez cami ve bitiş tarihi seçebilirsin."
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

          <div className="space-y-1.5">
            <Label>Bitiş tarihi (opsiyonel)</Label>
            <DateTimePicker
              value={createEndsAt}
              onChange={setCreateEndsAt}
            />
          </div>
        </form>
      </Modal>

      {/* Yarışmayı Bitir — onay modalı */}
      <Modal
        open={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        title="Yarışmayı bitir"
        description={`"${selectedCompetition?.name}" yarışmasını şimdi kapatmak istediğinden emin misin? Bu işlem geri alınamaz.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCloseConfirmOpen(false)}
              disabled={closeSubmitting}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              loading={closeSubmitting}
            >
              Evet, Kapat
            </Button>
          </>
        }
      >
        <ErrorBanner message={closeError} />
      </Modal>

      {/* Bitiş Tarihini Güncelle Modal */}
      <Modal
        open={updateEndsAtOpen}
        onClose={() => setUpdateEndsAtOpen(false)}
        title="Bitiş tarihini güncelle"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setUpdateEndsAtOpen(false)}
              disabled={endsAtSubmitting}
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleUpdateEndsAt}
              loading={endsAtSubmitting}
              disabled={!newEndsAt}
            >
              Güncelle
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <ErrorBanner message={endsAtError} />
          <div className="space-y-1.5">
            <Label>Yeni bitiş tarihi</Label>
            <DateTimePicker value={newEndsAt} onChange={setNewEndsAt} />
          </div>
        </div>
      </Modal>
    </>
  )
}
