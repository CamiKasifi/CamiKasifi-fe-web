'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Trophy,
  UserCog,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAdmin, isImam, useAuth } from '@/lib/auth'
import { Button } from './ui'
import { MosqueLogo } from './MosqueLogo'

interface NavItem {
  label: string
  shortLabel: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Genel Bakış', shortLabel: 'Özet', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Camiler', shortLabel: 'Camiler', href: '/dashboard/mosques', icon: Building2 },
  { label: 'İmamlar', shortLabel: 'İmamlar', href: '/dashboard/imams', icon: UserCog },
  { label: 'Yarışmalar', shortLabel: 'Yarışma', href: '/dashboard/competitions', icon: Trophy },
]

const IMAM_NAV: NavItem[] = [
  { label: 'Genel Bakış', shortLabel: 'Özet', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Camilerim', shortLabel: 'Camiler', href: '/dashboard/mosques', icon: Building2 },
  { label: 'Duyurular', shortLabel: 'Duyuru', href: '/dashboard/announcements', icon: Megaphone },
  { label: 'Analitik', shortLabel: 'Analitik', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Yarışmalarım', shortLabel: 'Yarışma', href: '/dashboard/competitions', icon: Trophy },
  { label: 'Onaylar', shortLabel: 'Onaylar', href: '/dashboard/approvals', icon: ClipboardCheck },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, roles, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nav = isAdmin(roles) ? ADMIN_NAV : isImam(roles) ? IMAM_NAV : []
  const roleLabel = isAdmin(roles)
    ? 'Yönetici'
    : isImam(roles)
      ? 'İmam'
      : 'Kullanıcı'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 lg:hidden">
        <div className="bg-accent text-accent-foreground shadow-card">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <MosqueLogo className="h-9 w-9 rounded-lg bg-accent-foreground/10 ring-1 ring-gold/30" />
              <div className="leading-tight">
                <p className="font-display text-base font-bold tracking-tight">
                  Cami Kaşifi
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold-soft">
                  {roleLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Hesap menüsünü aç"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-foreground/10 text-accent-foreground transition-colors hover:bg-accent-foreground/20 active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <div className="arabesque-divider opacity-70" />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <MosqueLogo className="h-11 w-11" />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
              Cami Kaşifi
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
              {roleLabel} Paneli
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-accent text-accent-foreground shadow-card'
                        : 'text-foreground/75 hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-gold-soft' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          {user && (
            <Link
              href="/dashboard/profile"
              aria-label="Profilim"
              className="mb-2 block rounded-lg border border-border bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name} {user.surname}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Mobile account drawer */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 top-0 z-50 animate-fade-up rounded-b-2xl border-b border-border bg-surface p-5 shadow-pop lg:hidden"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <MosqueLogo className="h-10 w-10" />
                <div className="leading-tight">
                  <p className="font-display text-base font-bold text-foreground">
                    {user?.name} {user?.surname}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-gold">
                    {roleLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Kapat"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link
              href="/dashboard/profile"
              onClick={() => setDrawerOpen(false)}
              className="mb-2 flex w-full items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <UserCog className="h-4 w-4 text-muted-foreground" /> Profilim
            </Link>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setDrawerOpen(false)
                logout()
              }}
              className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div
          className={cn(
            'mx-auto w-full max-w-6xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8',
          )}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Ana gezinme"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(nav.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {nav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    active ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                      active ? 'bg-accent/10' : 'bg-transparent',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-accent' : 'text-muted-foreground',
                      )}
                    />
                    {active && (
                      <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                    )}
                  </span>
                  <span>{item.shortLabel}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
