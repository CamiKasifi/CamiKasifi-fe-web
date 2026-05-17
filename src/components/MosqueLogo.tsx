import { cn } from '@/lib/utils'

interface MosqueLogoProps {
  className?: string
  /** When true, renders only the icon mark (no background). */
  bare?: boolean
}

/**
 * Stylised mosque silhouette — central dome, two minarets, crescent finial.
 * Drawn on a 48x48 grid; scales via the wrapping element's width/height.
 */
export function MosqueLogo({ className, bare = false }: MosqueLogoProps) {
  const svg = (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="ck-dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* Crescent finial on central dome */}
      <path
        d="M24 4.2 C 24 6.3 25.6 7.9 27.7 7.9 C 26.6 8.6 25.3 9 24 9 C 21.5 9 19.5 7 19.5 4.5 C 19.5 4.4 19.5 4.3 19.5 4.2 Z"
        fill="rgb(var(--color-gold))"
      />
      {/* Spires on minarets */}
      <path d="M9 13 L10.3 17 L7.7 17 Z" fill="rgb(var(--color-gold))" />
      <path d="M39 13 L40.3 17 L37.7 17 Z" fill="rgb(var(--color-gold))" />
      {/* Minarets */}
      <rect x="7.4" y="17" width="3.2" height="22" rx="0.6" fill="url(#ck-dome)" />
      <rect x="37.4" y="17" width="3.2" height="22" rx="0.6" fill="url(#ck-dome)" />
      {/* Minaret balconies */}
      <rect x="6.6" y="24" width="4.8" height="1.4" rx="0.4" fill="rgb(var(--color-gold) / 0.7)" />
      <rect x="36.6" y="24" width="4.8" height="1.4" rx="0.4" fill="rgb(var(--color-gold) / 0.7)" />
      {/* Central dome */}
      <path
        d="M14 24 C 14 16.3 18.5 11 24 11 C 29.5 11 34 16.3 34 24 Z"
        fill="url(#ck-dome)"
      />
      {/* Dome base ring */}
      <rect x="13" y="24" width="22" height="2" rx="0.5" fill="rgb(var(--color-gold) / 0.85)" />
      {/* Building body */}
      <path
        d="M11 26 H 37 V 39 H 11 Z"
        fill="url(#ck-dome)"
        opacity="0.85"
      />
      {/* Mihrab (arched door) */}
      <path
        d="M22 31 C 22 29.3 23 28 24 28 C 25 28 26 29.3 26 31 V 39 H 22 Z"
        fill="rgb(var(--color-gold) / 0.95)"
      />
      {/* Side arched windows */}
      <path
        d="M15 32 C 15 30.7 16 30 16.8 30 C 17.6 30 18.6 30.7 18.6 32 V 35 H 15 Z"
        fill="rgb(var(--color-gold) / 0.55)"
      />
      <path
        d="M29.4 32 C 29.4 30.7 30.4 30 31.2 30 C 32 30 33 30.7 33 32 V 35 H 29.4 Z"
        fill="rgb(var(--color-gold) / 0.55)"
      />
      {/* Ground line */}
      <rect x="7" y="39" width="34" height="1.2" rx="0.6" fill="currentColor" opacity="0.85" />
    </svg>
  )

  if (bare) {
    return (
      <span className={cn('inline-block text-accent', className)}>
        {svg}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-card ring-1 ring-gold/40',
        className,
      )}
    >
      <span className="block h-[78%] w-[78%]">{svg}</span>
    </span>
  )
}
