'use client'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Megaphone, Plus, Send } from 'lucide-react'
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
import { isImam, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type AnnouncementType,
  type Mosque,
  type MosqueAnnouncement,
  type MosqueAnnouncementCreateInput,
} from '@/lib/api'

const TYPE_LABEL: Record<AnnouncementType, string> = {
  HUTBE: 'Hutbe',
  GENERAL: 'Genel',
  IFTAR: 'İftar',
  MEVLID: 'Mevlid',
  TAZIYE: 'Taziye',
  OTHER: 'Diğer',
}

const TYPE_OPTIONS: AnnouncementType[] = [
  'GENERAL',
  'HUTBE',
  'IFTAR',
  'MEVLID',
  'TAZIYE',
  'OTHER',
]

function formatDateTime(iso: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AnnouncementsPage() {
  const { roles } = useAuth()
  const imam = isImam(roles)

  const [mosques, setMosques] = useState<Mosque[]>([])
  const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null)
  const [announcements, setAnnouncements] = useState<MosqueAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  // Initial: imam'in atanmis camilerini yukle.
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

  // Seçilen cami değişince duyuruları yükle.
  useEffect(() => {
    if (selectedMosqueId == null) return
    let cancelled = false
    void (async () => {
      setLoadingList(true)
      setError(null)
      try {
        const list = await api.mosques.announcements(selectedMosqueId)
        if (cancelled) return
        setAnnouncements(list)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Duyurular alınamadı.')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedMosqueId])

  const selectedMosque = useMemo(
    () => mosques.find((m) => m.id === selectedMosqueId) ?? null,
    [mosques, selectedMosqueId],
  )

  const refreshList = async () => {
    if (selectedMosqueId == null) return
    setLoadingList(true)
    try {
      const list = await api.mosques.announcements(selectedMosqueId)
      setAnnouncements(list)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Duyurular alınamadı.')
    } finally {
      setLoadingList(false)
    }
  }

  if (!imam) {
    return (
      <>
        <PageHeader title="Duyurular" />
        <ErrorBanner message="Bu sayfa yalnızca imam hesabıyla görülebilir." />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Duyurular"
        description="Cemaate hutbe, mevlid, iftar, taziye gibi duyurular bırak. İstersen aktif yoklamadaki cemaate anlık bildirim gönder."
        actions={
          <Button
            onClick={() => setModalOpen(true)}
            disabled={selectedMosqueId == null}
          >
            <Plus className="h-4 w-4" /> Yeni duyuru
          </Button>
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
            <Label htmlFor="mosque" className="text-xs uppercase tracking-wider text-muted-foreground">
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

          {loadingList ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Duyurular yükleniyor…
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              title="Henüz duyuru yok"
              description='İlk duyuruyu eklemek için "Yeni duyuru" butonunu kullan.'
            />
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        <Megaphone className="mr-1 inline h-4 w-4 align-text-bottom text-accent" />
                        {a.title}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.authorName} {a.authorSurname} ·{' '}
                        {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                    <Badge variant="default">{TYPE_LABEL[a.type] ?? a.type}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-sm">
                    {a.eventAt && (
                      <p className="text-sm font-medium text-accent">
                        Etkinlik zamanı: {formatDateTime(a.eventAt)}
                      </p>
                    )}
                    {a.body && (
                      <p className="whitespace-pre-wrap text-foreground/85">
                        {a.body}
                      </p>
                    )}
                    {a.pushedToCount != null && a.pushedToCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <Send className="mr-1 inline h-3 w-3 align-text-bottom" />
                        {a.pushedToCount} cihaza bildirim iletildi.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && selectedMosque && (
        <NewAnnouncementModal
          mosque={selectedMosque}
          onClose={() => setModalOpen(false)}
          onCreated={async () => {
            setModalOpen(false)
            await refreshList()
          }}
        />
      )}
    </>
  )
}

function NewAnnouncementModal({
  mosque,
  onClose,
  onCreated,
}: {
  mosque: Mosque
  onClose: () => void
  onCreated: () => Promise<void> | void
}) {
  const [type, setType] = useState<AnnouncementType>('GENERAL')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [eventAt, setEventAt] = useState('')
  const [notify, setNotify] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Başlık zorunlu.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload: MosqueAnnouncementCreateInput = {
        type,
        title: title.trim(),
        body: body.trim() || null,
        // datetime-local => ISO with seconds; backend expects ISO-8601.
        eventAt: eventAt ? new Date(eventAt).toISOString() : null,
        notifyAttendees: notify,
      }
      await api.imamMosques.createAnnouncement(mosque.id, payload)
      await onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mosque.name} — yeni duyuru`}
      description="Duyuru kaydedildiğinde anlık yoklamadaki cemaate bildirim gönderilebilir."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Vazgeç
          </Button>
          <Button form="announcement-form" type="submit" loading={submitting}>
            Yayınla
          </Button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner message={error} />

        <div className="space-y-1.5">
          <Label htmlFor="type">Tip</Label>
          <Select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cuma hutbesi: Sabır"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">Açıklama</Label>
          <textarea
            id="body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            placeholder="Detayları cemaate yaz…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="eventAt">Etkinlik zamanı (opsiyonel)</Label>
          <Input
            id="eventAt"
            type="datetime-local"
            value={eventAt}
            onChange={(e) => setEventAt(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            İftar/mevlid gibi bir etkinlikse zamanı belirt — cemaat takvimde
            görür.
          </p>
        </div>

        <label className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            <span className="font-medium text-foreground">
              Aktif yoklamadaki cemaate anlık bildirim gönder
            </span>
            <span className="block text-xs text-muted-foreground">
              Şu an camide yoklamadaki kullanıcılara push bildirim iletilir.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  )
}
