'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  ChevronRight,
  ClipboardCheck,
  Trophy,
  UserCircle2,
} from 'lucide-react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorBanner,
  Spinner,
  Stat,
} from '@/components/ui'
import { isAdmin, isImam, useAuth } from '@/lib/auth'
import {
  api,
  ApiError,
  type ApprovalItem,
  type Competition,
  type Mosque,
} from '@/lib/api'

interface OverviewData {
  mosques: Mosque[]
  competitions: Competition[]
  approvals: ApprovalItem[] | null
}

export default function DashboardOverviewPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const imam = isImam(user)

  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const mosquesPromise = admin
          ? api.mosques.list()
          : api.imamMosques.list()
        const competitionsPromise = api.competitions.list()
        const approvalsPromise = imam
          ? api.approvals.list()
          : Promise.resolve(null)

        const [mosques, competitions, approvals] = await Promise.all([
          mosquesPromise,
          competitionsPromise,
          approvalsPromise,
        ])

        if (cancelled) return
        setData({ mosques, competitions, approvals })
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Veriler yüklenirken bir hata oluştu.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [admin, imam])

  const pendingApprovals = (data?.approvals ?? []).filter(
    (a) => a.status?.toUpperCase() === 'PENDING',
  )

  return (
    <>
      {/* Hero — concept-themed greeting */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-accent text-accent-foreground shadow-card">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23eacf90' stroke-width='1'%3E%3Cpath d='M40 4 L52 16 L68 16 L68 32 L80 40 L68 48 L68 64 L52 64 L40 76 L28 64 L12 64 L12 48 L0 40 L12 32 L12 16 L28 16 Z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative px-5 py-6 sm:px-7 sm:py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold-soft">
            {admin ? 'Yönetici Paneli' : 'İmam Paneli'} · Hoş geldin
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {user?.name ? `${user.name},` : 'Selamünaleyküm,'}{' '}
            <span className="text-gold-soft">bereketli bir gün dileriz</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-accent-foreground/85">
            {admin
              ? 'Tüm camileri, imamları ve yarışmaları buradan yönet. Cemaat puanları arka planda işleniyor.'
              : 'Camilerini takip et, onay bekleyen istekleri çöz ve yarışmalarını yönet.'}
          </p>
        </div>
        <div className="arabesque-divider opacity-70" />
      </section>

      <ErrorBanner message={error} />

      {loading || !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Yükleniyor…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat
              label={admin ? 'Toplam Cami' : 'Camilerim'}
              value={data.mosques.length}
              icon={Building2}
            />
            <Stat
              label={admin ? 'Yarışma' : 'Yarışmalarım'}
              value={data.competitions.length}
              icon={Trophy}
            />
            {imam && (
              <Stat
                label="Bekleyen Onay"
                value={pendingApprovals.length}
                hint={
                  pendingApprovals.length > 0
                    ? 'Onay bekliyor'
                    : 'Bekleyen istek yok'
                }
                icon={ClipboardCheck}
              />
            )}
            <Stat
              label="Rol"
              value={admin ? 'Yönetici' : 'İmam'}
              hint={user?.email}
              icon={UserCircle2}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Son Camiler</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.mosques.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz cami bulunmuyor.
                  </p>
                ) : (
                  <ul className="-mx-1 divide-y divide-border">
                    {data.mosques.slice(0, 5).map((m) => (
                      <li key={m.id}>
                        <Link
                          href="/dashboard/mosques"
                          className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {m.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.neighbourhood}, {m.district} · {m.city}
                            </p>
                          </div>
                          <Badge variant="default" className="shrink-0">
                            {m.radius} m
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <Link
                    href="/dashboard/mosques"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Tümünü gör
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Yarışmalar</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.competitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz yarışma bulunmuyor.
                  </p>
                ) : (
                  <ul className="-mx-1 divide-y divide-border">
                    {data.competitions.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <Link
                          href="/dashboard/competitions"
                          className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {c.name}
                          </p>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <Link
                    href="/dashboard/competitions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Tümünü gör
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
