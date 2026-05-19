'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MailCheck, Search, UserPlus } from 'lucide-react'
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
  type AdminUser,
  type AdminUserCreateResponse,
  type Mosque,
  type WebUserType,
} from '@/lib/api'
import { formatApiError, useFetchData } from '@/lib/hooks'

export default function ImamsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const admin = isAdmin(user)

  // İki bağımsız fetch — paralel başlar; tek bir composite hata bayrağı yeter.
  const usersFetch = useFetchData(() => api.adminUsers.list('IMAM'), [], {
    enabled: admin,
    initialData: [] as AdminUser[],
  })
  const mosquesFetch = useFetchData(() => api.mosques.list(), [], {
    enabled: admin,
    initialData: [] as Mosque[],
  })
  const users = usersFetch.data ?? []
  const mosques = mosquesFetch.data ?? []
  const loading = usersFetch.loading || mosquesFetch.loading
  const error = usersFetch.error ?? mosquesFetch.error
  const refresh = useCallback(
    () =>
      Promise.all([usersFetch.refresh(), mosquesFetch.refresh()]).then(() => undefined),
    [usersFetch.refresh, mosquesFetch.refresh],
  )
  const setUsers = (next: AdminUser[]) => usersFetch.setData(next)

  const [search, setSearch] = useState('')

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [mosqueQuery, setMosqueQuery] = useState('')

  // "Yeni kullanıcı ekle" modal state — admin yeni IMAM veya ADMIN açabilir.
  // Backend Supabase'de hesabı açıp şifre belirleme e-postası tetikler;
  // emailSent durumuna göre success ekranı renklenir.
  type CreateForm = {
    email: string
    name: string
    surname: string
    type: WebUserType
  }
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({
    email: '',
    name: '',
    surname: '',
    type: 'IMAM',
  })
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<AdminUserCreateResponse | null>(
    null,
  )

  useEffect(() => {
    if (!authLoading && !admin) router.replace('/dashboard')
  }, [authLoading, admin, router])

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
      // Optimistic update — submit sıralı çalıştığı için stale closure riski yok.
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)))
      setEditTarget(null)
    } catch (err) {
      setEditError(formatApiError(err, 'Atama güncellenemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  const openCreate = () => {
    setCreateForm({ email: '', name: '', surname: '', type: 'IMAM' })
    setCreateError(null)
    setCreateResult(null)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    // Başarılı yaratıldıysa refresh çalıştır — yeni IMAM listede görünsün.
    setCreateOpen(false)
    if (createResult) {
      void refresh()
    }
    setCreateResult(null)
  }

  const submitCreate = async () => {
    setCreateSubmitting(true)
    setCreateError(null)
    try {
      const res = await api.adminUsers.create({
        email: createForm.email.trim(),
        name: createForm.name.trim(),
        surname: createForm.surname.trim(),
        type: createForm.type,
      })
      setCreateResult(res)
    } catch (err) {
      setCreateError(formatApiError(err, 'Kullanıcı oluşturulamadı.'))
    } finally {
      setCreateSubmitting(false)
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
        <div className="ml-auto">
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Yeni kullanıcı
          </Button>
        </div>
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

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={createResult ? 'Kullanıcı oluşturuldu' : 'Yeni kullanıcı ekle'}
        description={
          createResult
            ? createResult.emailSent
              ? 'Kullanıcıya şifre belirleme e-postası gönderildi. Linke tıklayıp kendi şifresini kurabilir.'
              : 'Hesap oluşturuldu fakat e-posta gönderilemedi. Kullanıcıyı manuel olarak "Şifremi unuttum" akışına yönlendir.'
            : 'Yeni İMAM veya YÖNETİCİ hesabı oluştur. Şifre kurma maili kullanıcıya gönderilecek.'
        }
        footer={
          createResult ? (
            <Button onClick={closeCreate}>Tamam</Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={closeCreate}
                disabled={createSubmitting}
              >
                Vazgeç
              </Button>
              <Button onClick={submitCreate} loading={createSubmitting}>
                Oluştur
              </Button>
            </>
          )
        }
      >
        {createResult ? (
          <div className="space-y-3">
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                createResult.emailSent
                  ? 'border-success/30 bg-success/10'
                  : 'border-destructive/30 bg-destructive/10'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-medium ${
                  createResult.emailSent ? 'text-success' : 'text-destructive'
                }`}
              >
                <MailCheck className="h-4 w-4" />
                {createResult.type === 'ADMIN' ? 'Yönetici' : 'İmam'} hesabı hazır
              </div>
              <div className="mt-1 text-muted-foreground">
                {createResult.email}
              </div>
              {!createResult.emailSent && (
                <p className="mt-2 text-xs text-destructive">
                  Şifre belirleme e-postası gönderilemedi. Kullanıcıya giriş
                  ekranındaki "Şifremi unuttum" akışını kullanmasını söyle.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ErrorBanner message={createError} />

            <div className="space-y-1.5">
              <Label htmlFor="create-email">E-posta</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="ornek@camikasifi.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-name">Ad</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-surname">Soyad</Label>
                <Input
                  id="create-surname"
                  value={createForm.surname}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, surname: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Rol
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['IMAM', 'ADMIN'] as const).map((t) => {
                  const active = createForm.type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, type: t })}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      {t === 'IMAM' ? 'İmam' : 'Yönetici'}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Yöneticiler tüm panel yetkilerine sahiptir. İmamlar yalnızca
                kendi atandıkları camiyle ilgilenebilir.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
