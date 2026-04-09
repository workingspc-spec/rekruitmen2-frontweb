// src/components/ui/PeriodPickerModal.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar } from 'lucide-react'

const PERIOD_OPTIONS = [
  { value: null,          label: 'Semua Waktu' },
  { value: 'Today',       label: 'Hari Ini' },
  { value: 'Yesterday',   label: 'Kemarin' },
  { value: 'This week',   label: 'Minggu Ini' },
  { value: 'Last week',   label: 'Minggu Lalu' },
  { value: 'This month',  label: 'Bulan Ini' },
  { value: 'Last month',  label: 'Bulan Lalu' },
  { value: 'This year',   label: 'Tahun Ini' },
  { value: 'Last year',   label: 'Tahun Lalu' },
]

/**
 * PeriodPickerModal — shared component
 * Mengikuti pola DropdownModal di RecruitmentFormPage (createPortal + centered)
 *
 * @param {string|null} current   - period aktif saat ini
 * @param {Function}    onSelect  - callback(value: string|null)
 * @param {Function}    onClose   - callback untuk menutup modal
 */
export function PeriodPickerModal({ current, onSelect, onClose }) {
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onSelect(`Custom: ${customStart} - ${customEnd}`)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-sapphire" />
            <h3 className="font-display font-bold text-navy text-base">Pilih Periode</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-0 overflow-hidden">

          {/* Kiri: Preset Options */}
          <div className="flex-1 border-r border-slate-100 py-3 overflow-y-auto max-h-[60vh]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-2">
              Preset
            </p>
            {PERIOD_OPTIONS.map((opt) => {
              const isSelected = current === opt.value
              return (
                <button
                  key={opt.value ?? 'all'}
                  onClick={() => onSelect(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? 'bg-sapphire/8 text-sapphire font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isSelected && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sapphire mr-2 mb-0.5" />
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Kanan: Custom Range */}
          <div className="flex-1 p-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Rentang Kustom
            </p>
            <div>
              <label className="label">Dari Tanggal</label>
              <input
                type="date"
                className="input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Sampai Tanggal</label>
              <input
                type="date"
                className="input"
                value={customEnd}
                min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
              className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}