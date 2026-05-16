'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  UserCog,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAdmin, isImam, useAuth } from '@/lib/auth'
import { Button } from './ui'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Camiler', href: '/dashboard/mosques', icon: Building2 },
  { label: 'İmamlar', href: '/dashboard/imams', icon: UserCog },
  { label: 'Yarışmalar', href: '/dashboard/competitions', icon: Trophy },
]

const IMAM_NAV: NavItem[] = [
  { label: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Camilerim', href: '/dashboard/mosques', icon: Building2 },
  { label: 'Yarışmalarım', href: '/dashboard/competitions', icon: Trophy },
  { label: 'Onaylar', href: '/dashboard/approvals', icon: ClipboardCheck },
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, roles, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const nav = isAdmin(roles) ? ADMIN_NAV : isImam(roles) ? IMAM_NAV : []
  const roleLabel = isAdmin(roles)
    ? 'Yönetici'
    : isImam(roles)
      ? 'İmam'
      : 'Kullanıcı'

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold">CamiKaşifi</span>
        </div>
        <span className="text-xs text-muted-foreground">{roleLabel}</span>
      </header>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">CamiKaşifi</p>
            <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          {user && (
            <div className="mb-2 rounded-md bg-muted/60 px-3 py-2">
              <p className="truncate text-sm font-medium">
                {user.name} {user.surname}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {roleLabel}
              </p>
            </div>
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

      {open && (
        <button
          type="button"
          aria-label="Kapat"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-foreground/30 lg:hidden"
        />
      )}

      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
