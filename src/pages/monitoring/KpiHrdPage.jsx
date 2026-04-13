// src/pages/monitoring/KpiHrdPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import { BarChart3, Calendar, ChevronDown, Users, Info, Shield, X } from 'lucide-react'

// ─── Helper: konversi period ke param API ─────────────────────────────────────
function periodToApiParam(period) {
  if (!period || period === 'All Time') return undefined
  if (period.startsWith('Custom:')) {
    return period.replace('Custom:', '').trim().replace(' - ', ',')
  }
  return period
}

// ─── Helper: label display ────────────────────────────────────────────────────
const PRESET_LABELS = {
  'All Time':   'Semua Waktu',
  'Today':      'Hari Ini',
  'Yesterday':  'Kemarin',
  'This week':  'Minggu Ini',
  'Last week':  'Minggu Lalu',
  'This month': 'Bulan Ini',
  'Last month': 'Bulan Lalu',
  'This year':  'Tahun Ini',
  'Last year':  'Tahun Lalu',
}

function periodToLabel(period) {
  if (!period || period === 'All Time') return 'Semua Waktu'
  if (PRESET_LABELS[period]) return PRESET_LABELS[period]
  if (period.startsWith('Custom:')) {
    try {
      const rangeStr = period.replace('Custom:', '').trim()
      const parts = rangeStr.includes(',') ? rangeStr.split(',') : rangeStr.split(' - ')
      if (parts.length >= 2) {
        const fmt = (s) => new Date(s.trim() + 'T00:00:00')
          .toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        return `${fmt(parts[0])} – ${fmt(parts[1])}`
      }
    } catch { return 'Rentang Kustom' }
  }
  return period
}

export default function KpiHrdPage() {
  const [period, setPeriod]         = useState('All Time')
  const [showPicker, setShowPicker] = useState(false)

  const apiParam = periodToApiParam(period)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kpi-hrd', apiParam],
    queryFn:  () => monitoringApi.kpiHrd(apiParam).then(r => r.data),
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}
  const dist    = summary.performance_distribution ?? {}
  const total   = summary.total_completed ?? 0

  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat KPI HRD." onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">KPI Rekrutmen HRD</h1>
          <p className="text-sm text-slate-500 mt-0.5">Executive Summary — {periodToLabel(period)}</p>
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm hover:border-sapphire hover:shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <Calendar size={16} className="text-sapphire" />
          <span className="text-slate-700 font-semibold text-xs max-w-[130px] truncate">
            {periodToLabel(period)}
          </span>
          {period !== 'All Time' ? (
            <X
              size={14}
              className="text-slate-400 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); setPeriod('All Time') }}
            />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <BigStat label="TOTAL"   value={total.toString()} color="text-sapphire" />
          <div className="w-px h-10 bg-slate-100" />
          <BigStat
            label="SUCCESS RATE"
            value={`${summary.success_rate ?? 0}%`}
            color={(summary.success_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}
          />
        </div>
      </div>

      {/*
       * FIX #3: Rata-rata Penyelesaian + Catatan Performa side-by-side
       * Sebelumnya keduanya full-width dan berdiri sendiri.
       * Sekarang dibungkus dalam flex row agar sejajar.
       */}
      <div className="flex gap-3 items-stretch">
        {/* Rata-rata Penyelesaian */}
        <div className="flex-1">
          <DurationCard
            title="Rata-rata Penyelesaian"
            days={summary.avg_net_duration ?? 0}
            sub="Rata-rata hari kerja per rekrutmen"
            color="text-sapphire bg-blue-50"
          />
        </div>

        {/* Catatan Performa — sejajar di sebelah kanan */}
        <div className="flex-1 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <Shield size={18} className="text-sapphire shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-sapphire">Catatan Performa</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tingkat sukses rekrutmen mencapai <strong>{summary.success_rate ?? 0}%</strong> dengan
              rata-rata waktu penyelesaian <strong>{Math.round(summary.avg_net_duration ?? 0)} hari kerja</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Distribution ── */}
      <div className="card">
        <p className="font-display font-bold text-navy text-sm mb-4">Distribusi Kualitas Penempatan</p>
        <div className="space-y-4">
          {[
            { key: 'excellent',  label: 'Excellent',  color: '#00C853' },
            { key: 'good',       label: 'Good',       color: '#2E7D32' },
            { key: 'acceptable', label: 'Acceptable', color: '#F57C00' },
            { key: 'delay',      label: 'Delay',      color: '#D32F2F' },
          ].map(({ key, label, color }) => {
            const count = dist[key] ?? 0
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                  <span className="text-xs font-bold" style={{ color }}>{count} ({pct}%)</span>
                </div>
                <ProgressBar value={pct} color={color} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Items ── */}
      {items.length === 0 ? (
        <EmptyState message="Tidak ada data pada periode ini." icon={BarChart3} />
      ) : (
        <div className="space-y-4">
          <p className="font-display font-bold text-navy text-sm">Riwayat Penempatan ({items.length})</p>
          {items.map(item => <KpiItemCard key={item.sla_tpk_nomor} item={item} />)}
        </div>
      )}

      {/* ── Period Picker Modal ── */}
      {showPicker && (
        <PeriodPickerModal
          current={period === 'All Time' ? null : period}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

// ── Sub Components ─────────────────────────────────────────────────────────────

function BigStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className={`text-4xl font-display font-black ${color}`}>{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

// DurationCard menerima optional className untuk fleksibilitas layout
function DurationCard({ title, days, sub, color, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 h-full ${color} ${className}`}>
      <p className="text-xs font-bold text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-display font-black text-sapphire">{Math.round(days)}</span>
        <span className="text-base text-sapphire">hari</span>
      </div>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function KpiItemCard({ item }) {
  const meta       = getPerformanceMeta(item.performance_label)
  const bufferDays = item.gross_duration_days - item.net_duration_days
  const hasBuffer  = bufferDays > 0

  return (
    <div className="card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy">{item.position}</p>
          <p className="text-xs text-slate-400 mt-0.5">{item.department} · {item.sla_tpk_nomor}</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.text }}>
          {meta.label}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-evenly mb-3">
        {hasBuffer ? (
          <>
            <Metric label="AKTUAL"    value={`${item.gross_duration_days} hr`} color="text-amber-500" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="WAKTU KPI" value={`${item.net_duration_days} hr`}   color="text-green-600" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="MIN SLA"   value={`${item.standard_lead_time} hr`}  color="text-slate-500" />
          </>
        ) : (
          <>
            <Metric
              label="DISELESAIKAN"
              value={`${item.net_duration_days} hr`}
              color={item.net_duration_days <= item.standard_lead_time ? 'text-green-600' : 'text-red-500'}
            />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="MIN SLA" value={`${item.standard_lead_time} hr`} color="text-slate-500" />
          </>
        )}
      </div>

      {hasBuffer && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
          <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Toleransi kandidat batal: -{bufferDays} hari — tidak dinilai sebagai keterlambatan HRD.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
        <Users size={14} className="text-green-600" />
        <span className="text-xs font-bold text-green-700">Hired: {item.hired_count}/{item.target_count}</span>
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-display font-black ${color}`}>{value}</p>
    </div>
  )
}