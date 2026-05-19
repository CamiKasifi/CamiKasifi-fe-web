import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Amiri, Fira_Code } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const amiri = Amiri({
  subsets: ['latin', 'arabic'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cami Kaşifi — Yönetim',
  description:
    'Cami Kaşifi yönetici ve imam paneli — camileri, yarışmaları ve cemaat onaylarını mobil dostu bir arayüzle yönet.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B4E41',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${amiri.variable} ${firaCode.variable}`}
    >
      {/* suppressHydrationWarning: ColorZilla / Grammarly gibi tarayıcı uzantıları
          body'ye `cz-shortcut-listen` benzeri attribute enjekte ederek hydration
          mismatch'e yol açıyor. Sadece body düzeyinde bastırıyoruz. */}
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
