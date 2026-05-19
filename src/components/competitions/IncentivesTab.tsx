'use client'

import { useEffect, useState } from 'react'
import { IncentivesPanel } from '@/components/IncentivesPanel'
import { Spinner } from '@/components/ui'
import { api } from '@/lib/api'

/// Teşvik sekmesi — IncentivesPanel'i sarar, ancak önce kullanıcının
/// "yönetebilir mi" yetkisini hesaplar:
///   - admin → her zaman yönetir
///   - imam → bu yarışmada OWNER veya MANAGER ise yönetir (network çağrısı gerekir)
///   - cemaat → sadece görüntüler
export function IncentivesTab({
  competitionId,
  imam,
  admin,
  currentUserId,
}: {
  competitionId: number
  imam: boolean
  admin: boolean
  currentUserId: number | null
}) {
  const [canManage, setCanManage] = useState<boolean>(admin)
  const [checkingRole, setCheckingRole] = useState<boolean>(!admin && imam)

  useEffect(() => {
    if (admin) {
      setCanManage(true)
      setCheckingRole(false)
      return
    }
    if (!imam || currentUserId == null) {
      setCanManage(false)
      setCheckingRole(false)
      return
    }
    let cancelled = false
    setCheckingRole(true)
    api.competitionRoles
      .list(competitionId)
      .then((rows) => {
        if (cancelled) return
        const mine = rows.some(
          (r) =>
            r.userId === currentUserId &&
            r.status === 'APPROVED' &&
            (r.type === 'OWNER' || r.type === 'MANAGER'),
        )
        setCanManage(mine)
      })
      .catch(() => {
        if (!cancelled) setCanManage(false)
      })
      .finally(() => {
        if (!cancelled) setCheckingRole(false)
      })
    return () => {
      cancelled = true
    }
  }, [competitionId, admin, imam, currentUserId])

  if (checkingRole) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Yetki kontrol ediliyor…
      </div>
    )
  }

  return <IncentivesPanel competitionId={competitionId} canManage={canManage} />
}
