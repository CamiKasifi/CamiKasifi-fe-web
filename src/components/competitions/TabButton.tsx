'use client'

import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/// Yarışma sekmeleri için küçük tab butonu. Detay sayfasının segmented control
/// görüntüsünü sürdürür — aktifken `bg-surface` + gölge, pasifte muted.
export function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <button
      role="tab"
      type="button"
      onClick={onClick}
      aria-selected={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
        active
          ? 'bg-surface text-foreground shadow-soft'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}
