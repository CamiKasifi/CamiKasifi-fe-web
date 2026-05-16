'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
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
  PageHeader,
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
  const { user, roles } = useAuth()
  const admin = isAdmin(roles)
  const imam = isImam(roles)

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
      <PageHeader
        title={`Hoş geldin, ${user?.name ?? ''}`}
        description={
          admin
            ? 'Tüm camileri ve yarışmaları buradan yönetebilirsin.'
            : 'Camilerini ve onay bekleyen istekleri buradan takip et.'
        }
      />

      <ErrorBanner message={error} />

      {loading || !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Yükleniyor…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                  <ul className="divide-y divide-border">
                    {data.mosques.slice(0, 5).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.neighbourhood}, {m.district} · {m.city}
                          </p>
                        </div>
                        <Badge variant="default">{m.radius} m</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <Link
                    href="/dashboard/mosques"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Tümünü gör →
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
                  <ul className="divide-y divide-border">
                    {data.competitions.slice(0, 5).map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.name}
                        </p>
                        <Link
                          href="/dashboard/competitions"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Detay
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <Link
                    href="/dashboard/competitions"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Tümünü gör →
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
