import type { CompetitionRoleType } from '@/lib/api'

/// Yarışma rol/status sabitleri ve UI yardımcıları — tab dosyalarının paylaştığı tek nokta.
/// Buradaki değerler backend enum'larıyla 1-1 eşleşir; yeni rol/status eklenirse
/// önce backend, sonra burası güncellenmeli.

export const ROLE_LABEL: Record<CompetitionRoleType, string> = {
  OWNER: 'Sahip',
  MANAGER: 'Yönetici',
  APPROVER: 'Onaylayıcı',
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylı',
  REJECTED: 'Reddedildi',
}

export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'destructive'

export function statusVariant(status: string): StatusBadgeVariant {
  const s = status.toUpperCase()
  if (s === 'APPROVED') return 'success'
  if (s === 'PENDING') return 'warning'
  if (s === 'REJECTED') return 'destructive'
  return 'default'
}
