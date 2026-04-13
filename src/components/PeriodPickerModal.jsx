// src/components/PeriodPickerModal.jsx
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import {
  format,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  addMonths, subMonths,
  addDays,
  subYears, addYears,
  setMonth, setYear,
  isSameDay, isSameMonth,
  isBefore, isAfter,
  isWithinInterval,
} from 'date-fns'
import { id } from 'date-fns/locale'

const PERIOD_OPTIONS = [
  { value: null,          label: 'Semua Waktu' },
  { value: 'Today',       label: 'Hari Ini'    },
  { value: 'Yesterday',   label: 'Kemarin'     },
  { value: 'This week',   label: 'Minggu Ini'  },
  { value: 'Last week',   label: 'Minggu Lalu' },
  { value: 'This month',  label: 'Bulan Ini'   },
  { value: 'Last month',  label: 'Bulan Lalu'  },
  { value: 'This year',   label: 'Tahun Ini'   },
  { value: 'Last year',   label: 'Tahun Lalu'  },
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function buildCalendarDays(viewDate) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd   = endOfMonth(viewDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 })
  const days = []
  let d = gridStart
  while (!isAfter(d, gridEnd)) {
    days.push(d)
    d = addDays(d, 1)
  }
  return days
}

function MiniCalendar({ startDate, endDate, phase, hoveredDate, onDayClick, onDayHover, onDayLeave }) {
  const [viewDate, setViewDate] = useState(startDate ?? new Date())
  const [viewMode, setViewMode] = useState('days')
  const days  = useMemo(() => buildCalendarDays(viewDate), [viewDate])
  const today = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t }, [])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const currentYear = viewDate.getFullYear()
  const startYear = currentYear - 5
  const years = Array.from({ length: 12 }, (_, i) => startYear + i)

  const handlePrev = () => {
    if (viewMode === 'days') setViewDate(d => subMonths(d, 1))
    else if (viewMode === 'years') setViewDate(d => subYears(d, 12))
    else setViewDate(d => subYears(d, 1))
  }
  const handleNext = () => {
    if (viewMode === 'days') setViewDate(d => addMonths(d, 1))
    else if (viewMode === 'years') setViewDate(d => addYears(d, 12))
    else setViewDate(d => addYears(d, 1))
  }

  return (
    <div className="select-none min-h-[260px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrev} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors">
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => {
            if (viewMode === 'days') setViewMode('months')
            else if (viewMode === 'months') setViewMode('years')
            else setViewMode('days')
          }}
          className="text-sm font-bold text-navy capitalize hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
        >
          {viewMode === 'days' ? format(viewDate, 'MMMM yyyy', { locale: id }) :
           viewMode === 'months' ? format(viewDate, 'yyyy') :
           `${years[0]} - ${years[years.length - 1]}`}
        </button>
        <button onClick={handleNext} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      {viewMode === 'days' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const inCurrentMonth = isSameMonth(day, viewDate)
              const isStart = !!(startDate && isSameDay(day, startDate))
              const isEnd   = !!(endDate   && isSameDay(day, endDate))
              const isToday = isSameDay(day, today)
              const effectiveEnd = endDate ?? (phase === 'end' ? hoveredDate : null)
              let rangeS = null, rangeE = null
              if (startDate && effectiveEnd && !isSameDay(startDate, effectiveEnd)) {
                if (isBefore(startDate, effectiveEnd)) { rangeS = startDate; rangeE = effectiveEnd }
                else { rangeS = effectiveEnd; rangeE = startDate }
              }
              const isInRange = !!(rangeS && rangeE && inCurrentMonth && !isSameDay(day, rangeS) && !isSameDay(day, rangeE) && isWithinInterval(day, { start: rangeS, end: rangeE }))
              const hasRange = !!(rangeS && rangeE)
              const isActualStart = !!(rangeS && isSameDay(day, rangeS))
              const isActualEnd   = !!(rangeE && isSameDay(day, rangeE))
              const isWeekStart = day.getDay() === 0
              const isWeekEnd   = day.getDay() === 6
              const showRightHalf = hasRange && isActualStart && !isWeekEnd
              const showLeftHalf  = hasRange && isActualEnd   && !isWeekStart

              // Single-day range: kedua ujung sama — tampilkan dot indicator khusus
              const isSingleDayRange = !!(startDate && endDate && isSameDay(startDate, endDate))
              const isSingleDaySelected = isSingleDayRange && isSameDay(day, startDate)

              const textColor = !inCurrentMonth ? 'text-slate-300'
                : (isStart || isEnd || isSingleDaySelected) ? 'text-white font-bold'
                : isInRange ? 'text-sapphire font-medium'
                : isToday ? 'text-sapphire font-bold'
                : 'text-slate-600'

              return (
                <button
                  key={i}
                  onClick={() => inCurrentMonth && onDayClick(day)}
                  onMouseEnter={() => inCurrentMonth && onDayHover(day)}
                  onMouseLeave={onDayLeave}
                  disabled={!inCurrentMonth}
                  className="relative flex items-center justify-center h-8"
                  style={{ cursor: inCurrentMonth ? 'pointer' : 'default' }}
                >
                  {showRightHalf && <span className="absolute inset-y-0.5 left-1/2 right-0 bg-blue-100" />}
                  {showLeftHalf && <span className="absolute inset-y-0.5 left-0 right-1/2 bg-blue-100" />}
                  {isInRange && <span className={['absolute inset-y-0.5 left-0 right-0 bg-blue-100', isWeekStart ? 'rounded-l-full' : '', isWeekEnd ? 'rounded-r-full' : ''].join(' ')} />}
                  {(isStart || isEnd || isSingleDaySelected) && <span className="absolute w-7 h-7 rounded-full bg-sapphire z-10" />}
                  {isToday && !isStart && !isEnd && !isSingleDaySelected && inCurrentMonth && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sapphire z-20" />
                  )}
                  <span className={`relative z-20 text-xs leading-none ${textColor}`}>{day.getDate()}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {viewMode === 'months' && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {months.map((m, i) => (
            <button
              key={m}
              onClick={() => { setViewDate(setMonth(viewDate, i)); setViewMode('days') }}
              className={`py-3 text-xs font-semibold rounded-xl transition-colors ${
                viewDate.getMonth() === i ? 'bg-sapphire text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'years' && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setViewDate(setYear(viewDate, y)); setViewMode('months') }}
              className={`py-3 text-xs font-semibold rounded-xl transition-colors ${
                viewDate.getFullYear() === y ? 'bg-sapphire text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PeriodPickerModal({ current, onSelect, onClose }) {
  const [startDate, setStartDate] = useState(null)
  const [endDate,   setEndDate]   = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [phase, setPhase] = useState('start')

  /**
   * FIX: Klik tanggal yang sama saat phase='end' sekarang menghasilkan
   * single-day range (start === end), BUKAN reset.
   * Standar date-picker: rentang 1 hari tetap valid dan harus bisa diterapkan.
   */
  const handleDayClick = (day) => {
    if (phase === 'start') {
      setStartDate(day)
      setEndDate(null)
      setPhase('end')
    } else {
      if (isSameDay(day, startDate)) {
        // Single-day range: start = end (BUKAN reset)
        setEndDate(day)
        setPhase('start')
      } else if (isBefore(day, startDate)) {
        setEndDate(startDate)
        setStartDate(day)
        setPhase('start')
      } else {
        setEndDate(day)
        setPhase('start')
      }
    }
  }

  const handleApply = () => {
    if (startDate && endDate) {
      const fmt = (d) => format(d, 'yyyy-MM-dd')
      onSelect(`Custom: ${fmt(startDate)} - ${fmt(endDate)}`)
    }
  }

  const displayDate = (d) => d
    ? format(d, 'dd MMM yyyy', { locale: id })
    : '—'

  // canApply: true jika kedua tanggal sudah dipilih (termasuk single-day)
  const canApply = !!(startDate && endDate)

  // Label untuk hint instruksi
  const isSingleDaySelected = !!(startDate && endDate && isSameDay(startDate, endDate))

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[28rem] flex flex-col overflow-hidden modal-content">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-sapphire" />
            <h3 className="font-display font-bold text-navy text-base">Pilih Periode</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex overflow-hidden">

          {/* Kiri: Preset */}
          <div className="w-32 border-r border-slate-100 py-3 overflow-y-auto shrink-0" style={{ maxHeight: '420px' }}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-2">Preset</p>
            {PERIOD_OPTIONS.map((opt) => {
              const isSelected = current === opt.value
              return (
                <button
                  key={opt.value ?? 'all'}
                  onClick={() => onSelect(opt.value)}
                  className={[
                    'w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-1.5',
                    isSelected ? 'bg-sapphire/10 text-sapphire font-semibold' : 'text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-sapphire shrink-0" />}
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Kanan: Calendar */}
          <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">

            {/* Date range display */}
            <div className="flex gap-2">
              <div className={[
                'flex-1 rounded-xl border px-3 py-2 transition-all duration-150',
                phase === 'start' ? 'border-sapphire bg-sapphire/5 shadow-sm' : 'border-slate-200',
              ].join(' ')}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dari</p>
                <p className={`text-xs font-semibold leading-tight ${startDate ? 'text-navy' : 'text-slate-300'}`}>
                  {displayDate(startDate)}
                </p>
              </div>
              <div className={[
                'flex-1 rounded-xl border px-3 py-2 transition-all duration-150',
                phase === 'end' ? 'border-sapphire bg-sapphire/5 shadow-sm' : 'border-slate-200',
              ].join(' ')}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sampai</p>
                <p className={`text-xs font-semibold leading-tight ${endDate ? 'text-navy' : 'text-slate-300'}`}>
                  {displayDate(endDate)}
                </p>
              </div>
            </div>

            {/* Instruction hint */}
            <p className="text-[11px] text-slate-400 text-center -mt-1">
              {phase === 'start'
                ? 'Pilih tanggal mulai'
                : isSingleDaySelected
                  ? '✓ Satu hari dipilih — klik Terapkan atau pilih tanggal akhir lain'
                  : 'Pilih tanggal selesai (boleh sama dengan mulai)'}
            </p>

            <MiniCalendar
              startDate={startDate}
              endDate={endDate}
              phase={phase}
              hoveredDate={hoveredDate}
              onDayClick={handleDayClick}
              onDayHover={setHoveredDate}
              onDayLeave={() => setHoveredDate(null)}
            />

            {/* Reset + Apply */}
            <div className="flex gap-2 mt-1">
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(null); setEndDate(null); setPhase('start') }}
                  className="btn-ghost px-3 py-2 text-xs"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleApply}
                disabled={!canApply}
                className="btn-primary flex-1 justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={13} />
                {isSingleDaySelected ? 'Terapkan (1 Hari)' : 'Terapkan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}