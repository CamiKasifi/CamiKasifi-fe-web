import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api'

/// Generic veri çekme hook'u — her sayfada tekrar eden
/// `useState + useEffect + try/catch + loading/error/data` üçlüsünü tek satıra indirir.
///
/// Kullanım:
/// ```tsx
/// const { data, loading, error, refresh } = useFetchData(
///   () => api.approvals.list(),
///   [], // bağımlılıklar değiştiğinde refetch
/// )
/// ```
///
/// `enabled` ile koşullu yükleme:
/// ```tsx
/// const { data } = useFetchData(() => api.x(), [], { enabled: isImam })
/// ```
///
/// `initialData` ile SSR/varsayılan değer:
/// ```tsx
/// const { data } = useFetchData(() => api.x(), [], { initialData: [] })
/// ```
///
/// Race condition'a karşı: en son tetiklenen fetch'in sonucu kazanır;
/// arada `refresh` 3 kez tetiklenirse yalnız sonuncusu state'i günceller.
export interface UseFetchDataResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (data: T) => void
}

export interface UseFetchDataOptions<T> {
  enabled?: boolean
  initialData?: T
}

export function useFetchData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: UseFetchDataOptions<T> = {},
): UseFetchDataResult<T> {
  const { enabled = true, initialData } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  // Stale fetch'i atmak için her çağrıyı bir "version" ile etiketliyoruz.
  // Component unmount olursa veya yeni bir refresh tetiklenirse eski
  // promise sonuçları yutulur.
  const versionRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!enabled) return
    const myVersion = ++versionRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (mountedRef.current && versionRef.current === myVersion) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current && versionRef.current === myVersion) {
        setError(formatApiError(err))
      }
    } finally {
      if (mountedRef.current && versionRef.current === myVersion) {
        setLoading(false)
      }
    }
    // fetcher'ı kasten dependency'den çıkardık — çağıran taraf inline fonksiyon
    // verirse her render'da değişir ve sonsuz döngüye düşer. `deps` parametresi
    // refetch'i kontrol etmek için yeterli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  return { data, loading, error, refresh, setData }
}

/// `ApiError` veya genel `Error`'ı kullanıcıya gösterilebilir mesaja çevirir.
/// `fallback` parametresi verilmezse generic Türkçe mesaj döner.
export function formatApiError(error: unknown, fallback = 'Beklenmeyen bir hata oluştu.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
