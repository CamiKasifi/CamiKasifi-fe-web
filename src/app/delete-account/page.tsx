'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { api, ApiError } from '@/lib/api'

type DeletionStatus = {
  pending: boolean
  daysLeft?: number | null
  requestedAt?: string | null
  deleteAt?: string | null
}

type Step = 'loading' | 'login' | 'status' | 'confirm'

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<DeletionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      if (data.session) {
        loadStatus()
      } else {
        setStep('login')
      }
    })
  }, [])

  async function loadStatus() {
    setStep('loading')
    setError(null)
    try {
      const s = await api.users.deletionStatus()
      setStatus(s)
      setStep('status')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await supabase().auth.signOut()
        setStep('login')
      } else {
        setError('Durum alınamadı. Lütfen tekrar deneyin.')
        setStep('status')
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error: authError } = await supabase().auth.signInWithPassword({ email, password })
      if (authError) throw new Error(authError.message)
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRequestDeletion() {
    setBusy(true)
    setError(null)
    try {
      await api.users.requestDeletion()
      await loadStatus()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancelDeletion() {
    setBusy(true)
    setError(null)
    try {
      await api.users.cancelDeletion()
      await loadStatus()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'İptal işlemi başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-[#0B4E41] mb-1">Hesap Silme</h1>
        <p className="text-sm text-gray-500 mb-6">Cami Kaşifi</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'loading' && (
          <p className="text-center text-gray-400 py-8">Yükleniyor…</p>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Devam etmek için hesabınıza giriş yapın.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4E41]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4E41]"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#0B4E41] text-white py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
        )}

        {step === 'status' && status && !status.pending && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Hesabınız aktif durumda. Hesabınızı silmek isterseniz aşağıdaki butona
              tıklayın. Talebinizden sonra <strong>7 gün</strong> içinde hesabınız
              kalıcı olarak silinir; bu süre içinde iptal edebilirsiniz.
            </p>
            <button
              onClick={() => setStep('confirm')}
              className="w-full rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700"
            >
              Hesabımı Sil
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              <strong>Emin misiniz?</strong> Hesabınız 7 gün sonra kalıcı olarak
              silinecek. Tüm verileriniz (puan, rozet, namaz geçmişi) geri alınamaz
              biçimde kaldırılacaktır.
            </div>
            <button
              onClick={handleRequestDeletion}
              disabled={busy}
              className="w-full rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-red-700"
            >
              {busy ? 'İşleniyor…' : 'Evet, hesabımı silmek istiyorum'}
            </button>
            <button
              onClick={() => setStep('status')}
              className="w-full rounded-lg border border-gray-300 text-gray-700 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              Vazgeç
            </button>
          </div>
        )}

        {step === 'status' && status?.pending && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Silme talebi beklemede</p>
              <p>
                Hesabınız{' '}
                <strong>{status.daysLeft != null ? `${status.daysLeft} gün` : 'yakında'}</strong>{' '}
                içinde kalıcı olarak silinecek.
              </p>
              {status.deleteAt && (
                <p className="mt-1 text-xs text-amber-700">
                  Silme tarihi:{' '}
                  {new Date(status.deleteAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <button
              onClick={handleCancelDeletion}
              disabled={busy}
              className="w-full rounded-lg bg-[#0B4E41] text-white py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? 'İşleniyor…' : 'Talebi İptal Et'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
