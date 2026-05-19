import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // SSR build sırasında env var eksikse bir uyarı; runtime'da işlem yapan yer
  // (login, useAuth) singleton'ı kullanır ve hata fırlatır.
  // eslint-disable-next-line no-console
  console.warn(
    'NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY eksik — auth çalışmayacak.',
  )
}

let _client: SupabaseClient | null = null

/// Singleton Supabase client. Auth state localStorage'da tutulur; SSR olmayan
/// "use client" sayfalarında doğrudan kullanılır.
export function supabase(): SupabaseClient {
  if (_client) return _client
  if (!url || !anonKey) {
    throw new Error(
      'Supabase yapılandırılmamış. .env.local içine NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin.',
    )
  }
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Şifre kurma/sıfırlama akışında Supabase, URL hash'inde access_token +
      // refresh_token döner. `detectSessionInUrl: true` bunları otomatik tüketip
      // session açıyor; /auth/reset sayfası buna güvenir.
      detectSessionInUrl: true,
    },
  })
  return _client
}
