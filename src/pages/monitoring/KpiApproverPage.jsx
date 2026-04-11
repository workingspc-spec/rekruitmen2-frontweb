// src/pages/monitoring/KpiApproverPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import { Gauge, Calendar, ChevronDown, ChevronRight, Clock, Trophy, X } from 'lucide-react'

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

function getDelayColor(days) {
  if (days <= 1) return '#00C853'
  if (days <= 3) return '#2E7D32'
  if (days <= 5) return '#F57C00'
  return '#D32F2F'
}

export default function KpiApproverPage() {
  const [period, setPeriod]         = useState('All Time')
  const [showPicker, setShowPicker] = useState(false)

  const apiParam = periodToApiParam(period)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kpi-approver', apiParam],
    queryFn:  () => monitoringApi.kpiApprover(apiParam).then(r => r.data),
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}
  const dist    = summary.performance_distribution ?? {}
  const total   = summary.total_approvals ?? 0

  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat KPI Approver." onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekap Approval</h1>
          <p className="text-sm text-slate-500 mt-0.5">Approval Performance — {periodToLabel(period)}</p>
        </div>

        {/* ── Period Button (sama persis dengan DashboardPage & KpiHrdPage) ── */}
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

      {/* ── Summary ── */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <BigStat label="TOTAL"     value={total.toString()} color="text-sapphire" />
          <div className="w-px h-10 bg-slate-100" />
          <BigStat
            label="FAST RATE"
            value={`${summary.fast_approval_rate ?? 0}%`}
            color={(summary.fast_approval_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}
          />
          <div className="w-px h-10 bg-slate-100" />
          <BigStat
            label="AVG DELAY"
            value={`${Math.round(summary.avg_approval_delay_days ?? 0)}d`}
            color={(summary.avg_approval_delay_days ?? 0) <= 3 ? 'text-green-600' : 'text-red-500'}
          />
        </div>
      </div>

      {/* ── Distribution ── */}
      <div className="card">
        <p className="font-display font-bold text-navy text-sm mb-4">SLA Velocity Distribution</p>
        <div className="space-y-4">
          {[
            { key: 'fast_track_count',      label: 'Fast Track (≤2 hari)',       color: '#00C853' },
            { key: 'standard_review_count', label: 'Standard Review (3–5 hari)', color: '#0F52BA' },
            { key: 'extended_review_count', label: 'Extended Review (>5 hari)',   color: '#F57C00' },
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

      {/* ── Insight ── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <Trophy size={18} className="text-sapphire shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-sapphire">Target Ideal</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Approval permintaan karyawan dalam ≤3 hari kerja untuk memastikan proses rekrutmen berjalan lancar.
          </p>
        </div>
      </div>

      {/* ── Items ── */}
      {items.length === 0 ? (
        <EmptyState message="Belum ada data approval pada periode ini." />
      ) : (
        <div className="space-y-4">
          <p className="font-display font-bold text-navy text-sm">Approval Log ({items.length})</p>
          {items.map(item => (
            <ApprovalItemCard key={`${item.tpk_nomor}-${item.approver_nik}`} item={item} />
          ))}
        </div>
      )}

      {/* ── Period Picker Modal (sama dengan halaman lain) ── */}
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

function ApprovalItemCard({ item }) {
  const meta       = getPerformanceMeta(item.approval_performance)
  const delayColor = getDelayColor(item.sla_approval_delay_days)

  return (
    <div className="card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy">{item.approver_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{item.jab_nama}</p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label}
        </span>
      </div>

      {/* Date flow */}
      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-3">
        <DateBlock label="REQUESTED" date={item.request_date} />
        <ChevronRight size={16} className="text-slate-300" />
        <DateBlock label="APPROVED" date={item.approved_date} color="text-green-600" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={14} style={{ color: delayColor }} />
          <span className="text-xs font-bold" style={{ color: delayColor }}>
            Duration: {item.sla_approval_delay_days} days
          </span>
        </div>
        <span className="text-xs text-slate-400">{item.tpk_bagian}</span>
      </div>
    </div>
  )
}

function DateBlock({ label, date, color = 'text-slate-700' }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${color}`}>{formatDate(date)}</p>
    </div>
  )
}