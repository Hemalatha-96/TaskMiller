import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarDays, X } from 'lucide-react'

function fmtParam(d: Date): string {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getToday     = ()          => new Date()
const daysAgo      = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const startOfWeek  = ()          => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d }
const endOfWeek    = ()          => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return d }
const startOfMonth = (o: number) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + o, 1) }
const endOfMonth   = (o: number) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + o + 1, 0) }

const PRESETS: { label: string; range: () => [Date, Date] }[] = [
  { label: 'Today',      range: () => [getToday(),       getToday()]     },
  { label: 'Yesterday',  range: () => [daysAgo(1),       daysAgo(1)]     },
  { label: 'This Week',  range: () => [startOfWeek(),    endOfWeek()]    },
  { label: 'This Month', range: () => [startOfMonth(0),  endOfMonth(0)]  },
  { label: 'Last Month', range: () => [startOfMonth(-1), endOfMonth(-1)] },
  { label: 'Next Month', range: () => [startOfMonth(1),  endOfMonth(1)]  },
]

interface DateRangeFilterProps {
  from:     string | undefined
  to:       string | undefined
  onChange: (from: string | undefined, to: string | undefined) => void
  label?:   string
}

export default function DateRangeFilter({ from, to, onChange, label: defaultLabel = 'Due Date' }: DateRangeFilterProps) {
  const [open,         setOpen]         = useState(false)
  const [startDate,    setStartDate]    = useState<Date | null>(null)
  const [endDate,      setEndDate]      = useState<Date | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [pos,          setPos]          = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const wrapRef   = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const [y1, m1, d1] = (from ?? '').split('-').map(Number)
    const [y2, m2, d2] = (to   ?? '').split('-').map(Number)
    setStartDate(from ? new Date(y1, m1 - 1, d1) : null)
    setEndDate(to     ? new Date(y2, m2 - 1, d2) : null)
  }, [from, to])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  const handlePreset = (preset: typeof PRESETS[0]) => {
    const [s, e] = preset.range()
    setStartDate(s)
    setEndDate(e)
    setActivePreset(preset.label)
  }

  const handleOk = () => {
    onChange(
      startDate ? fmtParam(startDate) : undefined,
      endDate   ? fmtParam(endDate)   : undefined,
    )
    setOpen(false)
  }

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setStartDate(null)
    setEndDate(null)
    setActivePreset(null)
    onChange(undefined, undefined)
    setOpen(false)
  }

  const isActive = !!from || !!to
  const label    = isActive && from && to
    ? `${fmtDisplay(from)} – ${fmtDisplay(to)}`
    : isActive && from
    ? `From ${fmtDisplay(from)}`
    : defaultLabel

  return (
    <div ref={wrapRef}>

      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 pl-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
          isActive
            ? 'bg-gray-900 text-white border-gray-900 pr-2'
            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 pr-2.5'
        }`}
      >
        <CalendarDays size={12} />
        <span>{label}</span>
        {isActive && (
          <span onClick={(e) => handleRemove(e)} className="ml-0.5 hover:opacity-70 cursor-pointer">
            <X size={11} />
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl flex"
            style={{ top: pos.top, right: pos.right, width: 360 }}
          >

            {/* Presets */}
            <div className="flex flex-col border-r border-gray-100 py-3 w-32 flex-shrink-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">Presets</p>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={`text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activePreset === p.label
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* From / To inputs */}
            <div className="flex-1 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-3">

                {/* From */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <div className="relative">
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => { setStartDate(date); setActivePreset(null) }}
                      selectsStart
                      startDate={startDate ?? undefined}
                      endDate={endDate ?? undefined}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Start date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      calendarClassName="dp-calendar"
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-orange-400 transition-colors"
                      wrapperClassName="w-full"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      popperProps={{ strategy: 'fixed' } as any}
                    />
                    <CalendarDays size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <div className="relative">
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => { setEndDate(date); setActivePreset(null) }}
                      selectsEnd
                      startDate={startDate ?? undefined}
                      endDate={endDate ?? undefined}
                      minDate={startDate ?? undefined}
                      dateFormat="dd MMM yyyy"
                      placeholderText="End date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      calendarClassName="dp-calendar"
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-orange-400 transition-colors"
                      wrapperClassName="w-full"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      popperProps={{ strategy: 'fixed' } as any}
                    />
                    <CalendarDays size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-1">
                {(isActive || startDate || endDate) && (
                  <button
                    onClick={() => handleRemove()}
                    className="flex-1 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={handleOk}
                  disabled={!startDate}
                  className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  OK
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
