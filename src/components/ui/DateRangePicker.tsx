import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface DateRange {
  from: string | undefined
  to:   string | undefined
}

interface Props {
  value:    DateRange
  onChange: (range: DateRange) => void
  label?:   string
}

const DAYS    = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayYMD(): string {
  return toYMD(new Date())
}

function formatDisplay(ymd: string | undefined): string {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}

export default function DateRangePicker({ value, onChange, label = 'Due Date' }: Props) {
  const today = new Date()
  const [open, setOpen]       = useState(false)
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [draft, setDraft]     = useState<DateRange>(value)
  const [picking, setPicking] = useState<'from' | 'to'>('from')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function applyPreset(preset: 'today' | 'yesterday' | 'thisWeek') {
    const now = new Date()
    if (preset === 'today') {
      const ymd = todayYMD()
      setDraft({ from: ymd, to: ymd })
    } else if (preset === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      const ymd = toYMD(y)
      setDraft({ from: ymd, to: ymd })
    } else {
      const day = now.getDay()
      const mon = new Date(now); mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      setDraft({ from: toYMD(mon), to: toYMD(sun) })
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function handleDayClick(ymd: string) {
    if (picking === 'from') {
      setDraft({ from: ymd, to: undefined })
      setPicking('to')
    } else {
      if (draft.from && ymd < draft.from) {
        setDraft({ from: ymd, to: draft.from })
      } else {
        setDraft(prev => ({ ...prev, to: ymd }))
      }
      setPicking('from')
    }
  }

  function handleOk() {
    onChange(draft)
    setOpen(false)
  }

  function handleClear() {
    const cleared = { from: undefined, to: undefined }
    setDraft(cleared)
    onChange(cleared)
    setOpen(false)
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const totalDays       = daysInMonth(viewYear, viewMonth)

  const hasValue = value.from || value.to
  const displayLabel = hasValue
    ? [formatDisplay(value.from), formatDisplay(value.to)].filter(Boolean).join(' – ')
    : label

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 border rounded-lg pl-3 pr-3 py-1.5 text-xs bg-gray-50 outline-none ${hasValue ? 'border-blue-400 text-blue-600' : 'border-gray-200 text-gray-500'}`}
      >
        <CalendarDays size={13} className={hasValue ? 'text-blue-500' : 'text-gray-400'} />
        <span>{displayLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-72 p-4">

          {/* Presets */}
          <div className="flex gap-2 mb-3">
            {(['today', 'yesterday', 'thisWeek'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex-1 text-[11px] py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'This Week'}
              </button>
            ))}
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft size={14} className="text-gray-500" />
            </button>
            <span className="text-xs font-semibold text-gray-700">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-0.5">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isFrom   = draft.from === ymd
              const isTo     = draft.to === ymd
              const inRange  = draft.from && draft.to && ymd > draft.from && ymd < draft.to
              const isToday  = ymd === todayYMD()

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => handleDayClick(ymd)}
                  className={[
                    'text-[11px] h-7 w-full rounded-lg flex items-center justify-center transition-colors',
                    isFrom || isTo
                      ? 'bg-blue-600 text-white font-semibold'
                      : inRange
                        ? 'bg-blue-50 text-blue-700'
                        : isToday
                          ? 'text-blue-600 font-semibold hover:bg-gray-100'
                          : 'text-gray-700 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Selected range display */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-500">
            <span className={`flex-1 border rounded px-2 py-1 ${draft.from ? 'text-gray-700' : 'text-gray-300'}`}>
              {formatDisplay(draft.from) || 'Start date'}
            </span>
            <span>–</span>
            <span className={`flex-1 border rounded px-2 py-1 ${draft.to ? 'text-gray-700' : 'text-gray-300'}`}>
              {formatDisplay(draft.to) || 'End date'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              OK
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
