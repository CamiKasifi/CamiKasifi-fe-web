'use client'

import {
  EmptyState,
  ErrorBanner,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { api, type LeaderboardEntry } from '@/lib/api'
import { useFetchData } from '@/lib/hooks'

/// Yarışma sıralaması — basit liste; yarışma değişince otomatik refetch.
export function LeaderboardTab({ competitionId }: { competitionId: number }) {
  const { data, loading, error } = useFetchData<LeaderboardEntry[]>(
    () => api.competitions.leaderboard(competitionId),
    [competitionId],
    { initialData: [] },
  )
  const board = data ?? []

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Sıralama yükleniyor…
      </div>
    )
  }
  if (error) return <ErrorBanner message={error} />
  if (board.length === 0) {
    return (
      <EmptyState
        title="Henüz katılım yok"
        description="Yarışmaya katılan kullanıcılar burada görünecek."
      />
    )
  }
  return (
    <Table>
      <THead>
        <TR>
          <TH className="w-12">#</TH>
          <TH>Katılımcı</TH>
          <TH className="text-right">Puan</TH>
        </TR>
      </THead>
      <tbody>
        {board.map((row) => (
          <TR key={row.personId}>
            <TD className="tabular-nums text-muted-foreground">{row.rank}</TD>
            <TD className="font-medium">
              {row.name} {row.surname}
            </TD>
            <TD className="text-right font-mono tabular-nums">
              {row.totalPoint}
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  )
}
