'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  BarChart3,
  CalendarPlus,
  Gift,
  Plus,
  ShieldCheck,
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
import { IncentivesTab } from '@/components/competitions/IncentivesTab'
import { LeaderboardTab } from '@/components/competitions/LeaderboardTab'
import { ManualAttendanceTab } from '@/components/competitions/ManualAttendanceTab'
import { RolesTab } from '@/components/competitions/RolesTab'
import { TabButton } from '@/components/competitions/TabButton'

type Tab = 'leaderboard' | 'roles' | 'incentives' | 'manual'

/// Yarışma yönetim sayfası — orkestratör.
///
/// Bu dosyada SADECE sayfa-seviyesi kaygılar kalır:
///   - Yarışma listesi + seçim
///   - Tab state (`leaderboard` / `roles` / `incentives`)
///   - "Yeni Yarışma" modal akışı
///
/// Tab içerikleri `@/components/competitions/*` altında ayrı dosyalardadır.
/// Bu sayede tab başına state/efekt sıkıca paketlenir, sayfa dosyası 1k+ satırdan
/// 200 küçüğe düşer ve her tab tek başına test edilebilir.
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
      setFormError(formatApiError(err, 'Yarışma oluşturulamadı.'))
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
                <LeaderboardTab competitionId={selectedCompetition.id} />
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
