import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { Speed, Calendar, ChevronDown, Clock, ArrowRight, Trophy, ChevronRight } from 'lucide-react'

const PERIOD_OPTS = [
  { value: '',        label: 'Semua Waktu' },
  { value: 'month',   label: 'Bulan Ini' },
  { value: 'quarter', label: 'Kuartal Ini' },
  { value: 'year',    label: 'Tahun Ini' },
]

function getDelayColor(days) {
  if (days <= 1) return '#00C853'
  if (days <= 3) return '#2E7D32'
  if (days <= 5) return '#F57C00'
  return '#D32F2F'
}

export default function KpiApproverPage() {
  const [period, setPeriod] = useState('')
  const [showPeriod, setShowPeriod] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kpi-approver', period],
    queryFn: () => monitoringApi.kpiApprover(period || undefined).then(r => r.data),
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}
  const dist    = summary.performance_distribution ?? {}

  const periodLabel = PERIOD_OPTS.find(o => o.value === period)?.label ?? 'Semua Waktu'
  const total = summary.total_approvals ?? 0

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat KPI Approver." onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekap Approval</h1>
          <p className="text-sm text-slate-500 mt-0.5">Approval Performance — {periodLabel}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPeriod(p => !p)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm hover:border-sapphire transition-colors"
          >
            <Calendar size={15} className="text-sapphire" />
            <span className="text-navy font-medium">{periodLabel}</span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
          {showPeriod && (
            <div className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44">
              {PERIOD_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => { setPeriod(o.value); setShowPeriod(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${period === o.value ? 'bg-sapphire/10 text-sapphire font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <BigStat label="TOTAL"    value={total.toString()}          color="text-sapphire" />
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

      {/* Distribution */}
      <div className="card">
        <p className="font-display font-bold text-navy text-sm mb-4">SLA Velocity Distribution</p>
        <div className="space-y-4">
          {[
            { key: 'fast_track_count',      label: 'Fast Track (≤2 hari)',      color: '#00C853' },
            { key: 'standard_review_count', label: 'Standard Review (3-5 hari)', color: '#0F52BA' },
            { key: 'extended_review_count', label: 'Extended Review (>5 hari)',  color: '#F57C00' },
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

      {/* Target insight */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <Trophy size={18} className="text-sapphire shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-sapphire">Target Ideal</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Approval permintaan karyawan dalam ≤3 hari kerja untuk memastikan proses rekrutmen berjalan lancar.
          </p>
        </div>
      </div>

      {/* Approval Log */}
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
    </div>
  )
}

function BigStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className={`text-4xl font-display font-black ${color}`}>{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function ApprovalItemCard({ item }) {
  const meta      = getPerformanceMeta(item.approval_performance)
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

      {/* Delay & dept */}
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