'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search } from 'lucide-react'
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
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { isAdmin, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type AdminUser,
  type Mosque,
} from '@/lib/api'

export default function ImamsPage() {
  const router = useRouter()
  const { roles, loading: authLoading } = useAuth()
  const admin = isAdmin(roles)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [mosques, setMosques] = useState<Mosque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [mosqueQuery, setMosqueQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !admin) router.replace('/dashboard')
  }, [authLoading, admin, router])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, m] = await Promise.all([
        api.adminUsers.list('IMAM'),
        api.mosques.list(),
      ])
      setUsers(u)
      setMosques(m)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Veriler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (admin) void refresh()
  }, [admin])

  const mosqueById = useMemo(() => {
    const map = new Map<number, Mosque>()
    for (const m of mosques) map.set(m.id, m)
    return map
  }, [mosques])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const fullName =
        `${u.name ?? ''} ${u.surname ?? ''}`.trim().toLowerCase()
      return (
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
  }, [users, search])

  const openEdit = (u: AdminUser) => {
    setEditTarget(u)
    setPicked([...u.mosqueIds])
    setMosqueQuery('')
    setEditError(null)
  }

  const filteredMosques = useMemo(() => {
    const q = mosqueQuery.trim().toLowerCase()
    if (!q) return mosques
    return mosques.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.neighbourhood.toLowerCase().includes(q),
    )
  }, [mosques, mosqueQuery])

  const submit = async () => {
    if (!editTarget) return
    setSubmitting(true)
    setEditError(null)
    try {
      const updated = await api.adminUsers.updateMosques(
        editTarget.id,
        picked,
      )
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      )
      setEditTarget(null)
    } catch (err) {
      setEditError(
        err instanceof ApiError ? err.message : 'Atama güncellenemedi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!admin) return null

  return (
    <>
      <PageHeader
        title="İmamlar"
        description="İmamları görüntüle ve hangi camilerle ilgilendiklerini ata."
      />

      <ErrorBanner message={error} />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara: ad, soyad, e-posta…"
            className="pl-9"
          />
        </div>
        <Badge variant="default">{filtered.length}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={users.length === 0 ? 'Henüz imam yok' : 'Sonuç bulunamadı'}
          description={
            users.length === 0
              ? 'İmam rolündeki kullanıcılar kayıt olduktan sonra burada görünecek.'
              : 'Aramanı değiştirmeyi dene.'
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>İmam</TH>
              <TH>E-posta</TH>
              <TH>Atanmış Camiler</TH>
              <TH className="text-right">İşlem</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((u) => {
              const fullName =
                [u.name, u.surname].filter(Boolean).join(' ') ||
                `#${u.id}`
              const mosqueNames = u.mosqueIds
                .map((id) => mosqueById.get(id)?.name ?? `#${id}`)
                .join(', ')
              return (
                <TR key={u.id}>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium">{fullName}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        #{u.id}
                      </span>
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">{u.email}</TD>
                  <TD>
                    {u.mosqueIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Henüz atanmamış
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="default">
                          {u.mosqueIds.length}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {mosqueNames}
                        </span>
                      </div>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(u)}
                    >
                      <Building2 className="h-4 w-4" /> Camileri düzenle
                    </Button>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      )}

      <Modal
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        title="Camileri düzenle"
        description={
          editTarget
            ? `${[editTarget.name, editTarget.surname]
                .filter(Boolean)
                .join(' ')} için atanmış camileri seç.`
            : ''
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditTarget(null)}
              disabled={submitting}
            >
              Vazgeç
            </Button>
            <Button onClick={submit} loading={submitting}>
              Kaydet ({picked.length})
            </Button>
          </>
        }
      >
        <ErrorBanner message={editError} />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Camiler
            </Label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPicked(mosques.map((m) => m.id))}
                className="text-accent hover:underline"
              >
                Tümünü seç
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setPicked([])}
                className="text-destructive hover:underline"
              >
                Temizle
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={mosqueQuery}
              onChange={(e) => setMosqueQuery(e.target.value)}
              placeholder="Cami ara…"
              className="pl-9"
            />
          </div>

          {mosques.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz cami yok. Önce "Camiler" sayfasından cami ekle.
            </p>
          ) : filteredMosques.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aramaya uygun cami bulunamadı.
            </p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
              {filteredMosques.map((m) => {
                const checked = picked.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setPicked((prev) =>
                          e.target.checked
                            ? [...prev, m.id]
                            : prev.filter((id) => id !== m.id),
                        )
                      }
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">
                        {m.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.neighbourhood}, {m.district} · {m.city}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
