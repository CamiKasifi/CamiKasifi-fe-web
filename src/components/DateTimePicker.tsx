'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  /** ISO-like string without timezone: `YYYY-MM-DDTHH:mm` (or empty). */
  value: string
  onChange: (next: string) => void
  id?: string
  placeholder?: string
}

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]
const WEEKDAYS_TR_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function parseValue(value: string): {
  year: number
  month: number // 0-11
  day: number
  hour: number
  minute: number
} | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const hour = Number(m[4])
  const minute = Number(m[5])
  if (
    [year, month, day, hour, minute].some((n) => Number.isNaN(n)) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }
  return { year, month, day, hour, minute }
}

function compose(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`
}

function formatTr(value: string): string {
  const parsed = parseValue(value)
  if (!parsed) return ''
  return `${pad2(parsed.day)} ${MONTHS_TR[parsed.month]} ${parsed.year} · ${pad2(parsed.hour)}:${pad2(parsed.minute)}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Pzt=0, …, Paz=6. (JS Sunday=0 → 6.) */
function firstWeekdayMon(year: number, month: number): number {
  const js = new Date(year, month, 1).getDay()
  return (js + 6) % 7
}

export function DateTimePicker({
  value,
  onChange,
  id,
  placeholder = 'Tarih seç',
}: DateTimePickerProps) {
  const parsed = useMemo(() => parseValue(value), [value])
  const today = new Date()

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(
    parsed?.year ?? today.getFullYear(),
  )
  const [viewMonth, setViewMonth] = useState(
    parsed?.month ?? today.getMonth(),
  )
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // sync view month when external value changes (e.g. form reset)
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year)
      setViewMonth(parsed.month)
    }
  }, [parsed?.year, parsed?.month])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const display = parsed ? formatTr(value) : ''

  const selectDay = (day: number) => {
    const hour = parsed?.hour ?? 12
    const minute = parsed?.minute ?? 0
    onChange(compose(viewYear, viewMonth, day, hour, minute))
  }

  const updateTime = (hour: number, minute: number) => {
    const year = parsed?.year ?? viewYear
    const month = parsed?.month ?? viewMonth
    const day = parsed?.day ?? today.getDate()
    onChange(compose(year, month, day, hour, minute))
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const setToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    onChange(
      compose(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      ),
    )
  }

  const clear = () => {
    onChange('')
  }

  // Build the day grid (leading blanks + days).
  const lead = firstWeekdayMon(viewYear, viewMonth)
  const total = daysInMonth(viewYear, viewMonth)
  const cells: Array<{ day: number | null; iso?: string }> = []
  for (let i = 0; i < lead; i++) cells.push({ day: null })
  for (let d = 1; d <= total; d++) cells.push({ day: d })

  const selDay =
    parsed && parsed.year === viewYear && parsed.month === viewMonth
      ? parsed.day
      : null
  const isToday = (d: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d

  const hour = parsed?.hour ?? 12
  const minute = parsed?.minute ?? 0

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 text-left text-[15px] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          !display && 'text-muted-foreground',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{display || placeholder}</span>
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              clear()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                clear()
              }
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Temizle"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-30 mt-1.5 w-[19rem] rounded-xl border border-border bg-surface p-3 shadow-pop"
        >
          {/* Month header */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>{MONTHS_TR[viewMonth]}</span>
              <span className="tabular-nums text-muted-foreground">
                {viewYear}
              </span>
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS_TR_SHORT.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (c.day === null) return <div key={`b-${i}`} className="h-8" />
              const isSel = selDay === c.day
              const isTd = isToday(c.day)
              return (
                <button
                  key={c.day}
                  type="button"
                  onClick={() => selectDay(c.day!)}
                  className={cn(
                    'h-8 rounded-md text-sm tabular-nums transition-colors',
                    isSel
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted/60 text-foreground',
                    !isSel && isTd && 'ring-1 ring-accent/60',
                  )}
                  aria-pressed={isSel}
                >
                  {c.day}
                </button>
              )
            })}
          </div>

          {/* Time picker */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Saat</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={23}
                value={pad2(hour)}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(23, Number(e.target.value) || 0))
                  updateTime(n, minute)
                }}
                className="h-9 w-14 rounded-md border border-border bg-surface text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Saat"
              />
              <span className="text-muted-foreground">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={pad2(minute)}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(59, Number(e.target.value) || 0))
                  updateTime(hour, n)
                }}
                className="h-9 w-14 rounded-md border border-border bg-surface text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Dakika"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clear}
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              Temizle
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setToday}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
