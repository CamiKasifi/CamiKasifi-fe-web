'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { Spinner } from '@/components/ui'
import { isAdmin, isImam, useAuth } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const { user, roles, loading } = useAuth()
  const allowed = isAdmin(roles) || isImam(roles)

  useEffect(() => {
    if (loading) return
    if (!user || !allowed) {
      router.replace('/login')
    }
  }, [loading, user, allowed, router])

  if (loading || !user || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  return <Shell>{children}</Shell>
}
