/**
 * `useFetchData` ve `formatApiError` için birim testler.
 *
 * Çalıştırmak için (henüz kurulu değil — paketleri user kararı):
 *   npm install -D vitest @testing-library/react jsdom
 *
 * package.json'a script ekle:
 *   "test": "vitest run",
 *   "test:watch": "vitest"
 *
 * Test runner JSDOM ortamı gerektirir. Önerilen `vitest.config.ts`:
 *
 *   import { defineConfig } from 'vitest/config'
 *   import react from '@vitejs/plugin-react'
 *   export default defineConfig({
 *     plugins: [react()],
 *     test: { environment: 'jsdom', globals: false },
 *     resolve: { alias: { '@': '/src' } },
 *   })
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './api'
import { formatApiError, useFetchData } from './hooks'

describe('formatApiError', () => {
  it('ApiError mesajını döner', () => {
    const err = new ApiError(400, 'Geçersiz veri')
    expect(formatApiError(err)).toBe('Geçersiz veri')
  })

  it('genel Error mesajını döner', () => {
    expect(formatApiError(new Error('boom'))).toBe('boom')
  })

  it('bilinmeyen değer için fallback döner', () => {
    expect(formatApiError('string-hata')).toBe('Beklenmeyen bir hata oluştu.')
    expect(formatApiError(null, 'Özel fallback')).toBe('Özel fallback')
  })
})

describe('useFetchData', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('happy path: mount\'ta fetch eder, data\'yı set eder, loading kapanır', async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3])

    const { result } = renderHook(() => useFetchData(fetcher, []))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual([1, 2, 3])
    expect(result.current.error).toBeNull()
  })

  it('fetch fail olduğunda error mesajına düşer, data initialData kalır', async () => {
    const fetcher = vi.fn().mockRejectedValue(new ApiError(500, 'Sunucu hatası'))

    const { result } = renderHook(() =>
      useFetchData(fetcher, [], { initialData: [] as number[] }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Sunucu hatası')
    expect(result.current.data).toEqual([])
  })

  it('enabled=false ise fetcher hiç çağrılmaz', async () => {
    const fetcher = vi.fn().mockResolvedValue(42)

    const { result } = renderHook(() =>
      useFetchData(fetcher, [], { enabled: false, initialData: 0 }),
    )

    // Bir tik bekle — eğer enabled gözardı ediliyorsa fetch tetiklenir.
    await new Promise((r) => setTimeout(r, 10))

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(0)
  })

  it('refresh çağrısı fetcher\'ı tekrar çalıştırır', async () => {
    let counter = 0
    const fetcher = vi.fn(() => Promise.resolve(++counter))

    const { result } = renderHook(() => useFetchData(fetcher, []))

    await waitFor(() => expect(result.current.data).toBe(1))

    await act(async () => {
      await result.current.refresh()
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.data).toBe(2)
  })

  it('race condition: son fetch kazanır, stale response yutulur', async () => {
    // İki ardışık fetch — birincisi geç döner, ikincisi hızlı.
    // Stale response yutulmazsa data önce 'late', sonra 'fast' olur (yanlış).
    // Bizim version-guard'ımız stale'i atar → data sadece 'fast' olur.
    let resolveSlow: (v: string) => void = () => {}
    const slowPromise = new Promise<string>((r) => {
      resolveSlow = r
    })
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(slowPromise)
      .mockResolvedValueOnce('fast')

    const { result } = renderHook(() => useFetchData(fetcher, []))

    // İlk fetch in-flight; refresh tetikle.
    await act(async () => {
      await result.current.refresh() // bu çağrı "fast"e bağlanır
    })

    // Şimdi slow'u çöz — stale.
    await act(async () => {
      resolveSlow('late')
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.data).toBe('fast')
    expect(result.current.data).not.toBe('late')
  })

  it('setData ile dışarıdan optimistic update yapılabilir', async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2])

    const { result } = renderHook(() => useFetchData(fetcher, []))

    await waitFor(() => expect(result.current.data).toEqual([1, 2]))

    act(() => {
      result.current.setData([1, 2, 3])
    })

    expect(result.current.data).toEqual([1, 2, 3])
  })
})
