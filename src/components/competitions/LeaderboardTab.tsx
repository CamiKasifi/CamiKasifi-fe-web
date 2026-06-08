'use client'

import { useState } from 'react'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Modal,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui'
import { api, type LeaderboardEntry } from '@/lib/api'
import { useFetchData, formatApiError } from '@/lib/hooks'

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardTab({
  competitionId,
  canManage = false,
}: {
  competitionId: number
  canManage?: boolean
}) {
  const { data, loading, error, refresh: refetch } = useFetchData<LeaderboardEntry[]>(
    () => api.competitions.leaderboard(competitionId),
    [competitionId],
    { initialData: [] },
  )
  const board = data ?? []

  const [removing, setRemoving] = useState<number | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [confirmEntry, setConfirmEntry] = useState<LeaderboardEntry | null>(null)

  const handleRemove = async () => {
    if (!confirmEntry) return
    setRemoving(confirmEntry.personId)
    setRemoveError(null)
    try {
      await api.competitions.removeParticipant(competitionId, confirmEntry.personId)
      setConfirmEntry(null)
      await refetch()
    } catch (err) {
      setRemoveError(formatApiError(err, 'Katılımcı çıkarılamadı.'))
    } finally {
      setRemoving(null)
    }
  }

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
    <>
      <Table>
        <THead>
          <TR>
            <TH className="w-12">#</TH>
            <TH>Katılımcı</TH>
            <TH className="text-right">Puan</TH>
            {canManage && <TH className="w-16" />}
          </TR>
        </THead>
        <tbody>
          {board.map((row) => {
            const medal = row.rank <= 3 ? MEDALS[row.rank - 1] : null
            return (
              <TR key={row.personId}>
                <TD className="tabular-nums text-muted-foreground">
                  {medal ? (
                    <span title={`${row.rank}. sıra`}>{medal}</span>
                  ) : (
                    row.rank
                  )}
                </TD>
                <TD className="font-medium">
                  {row.name} {row.surname}
                </TD>
                <TD className="text-right font-mono tabular-nums">
                  {row.totalPoint}
                </TD>
                {canManage && (
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmEntry(row)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      Çıkar
                    </Button>
                  </TD>
                )}
              </TR>
            )
          })}
        </tbody>
      </Table>

      <Modal
        open={!!confirmEntry}
        onClose={() => setConfirmEntry(null)}
        title="Katılımcıyı çıkar"
        description={
          confirmEntry
            ? `"${confirmEntry.name} ${confirmEntry.surname}" adlı kişiyi yarışmadan çıkarmak istediğinden emin misin?`
            : undefined
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmEntry(null)}
              disabled={!!removing}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              loading={!!removing}
            >
              Evet, Çıkar
            </Button>
          </>
        }
      >
        <ErrorBanner message={removeError} />
      </Modal>
    </>
  )
}
