import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { BarChart3, Calendar, ChevronDown, Users, Clock, Shield, Info } from 'lucide-react'

const PERIOD_OPTS = [
  { value: '',        label: 'Semua Waktu' },
  { value: 'month',   label: 'Bulan Ini' },
  { value: 'quarter', label: 'Kuartal Ini' },
  { value: 'year',    label: 'Tahun Ini' },
]

export default function KpiHrdPage() {
  const [period, setPeriod] = useState('')
  const [showPeriod, setShowPeriod] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kpi-hrd', period],
    queryFn: () => monitoringApi.kpiHrd(period || undefined).then(r => r.data),
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}
  const dist    = summary.performance_distribution ?? {}

  const periodLabel = PERIOD_OPTS.find(o => o.value === period)?.label ?? 'Semua Waktu'

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat KPI HRD." onRetry={refetch} />

  const total = summary.total_completed ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">KPI Rekrutmen HRD</h1>
          <p className="text-sm text-slate-500 mt-0.5">Executive Summary — {periodLabel}</p>
        </div>
        {/* Period selector */}
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

      {/* Summary Cards */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <BigStat label="TOTAL" value={total.toString()} color="text-sapphire" />
          <div className="w-px h-10 bg-slate-100" />
          <BigStat
            label="SUCCESS RATE"
            value={`${summary.success_rate ?? 0}%`}
            color={(summary.success_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DurationCard
          title="Rata-rata Aktual"
          days={summary.avg_gross_duration ?? 0}
          sub="Total hari kerja"
          color="text-amber-600 bg-amber-50"
        />
        <DurationCard
          title="Rata-rata KPI"
          days={summary.avg_net_duration ?? 0}
          sub="Setelah potong toleransi"
          color="text-green-700 bg-green-50"
        />
      </div>

      {/* Distribution */}
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

      {/* Insight Box */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <Shield size={18} className="text-sapphire shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-sapphire">Catatan Performa</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Waktu Aktual ({Math.round(summary.avg_gross_duration ?? 0)} hari) → Waktu KPI ({Math.round(summary.avg_net_duration ?? 0)} hari) | Tingkat Sukses {summary.success_rate ?? 0}%
          </p>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <EmptyState message="Tidak ada data pada periode ini." icon={BarChart3} />
      ) : (
        <div className="space-y-4">
          <p className="font-display font-bold text-navy text-sm">Riwayat Penempatan ({items.length})</p>
          {items.map(item => (
            <KpiItemCard key={item.sla_tpk_nomor} item={item} />
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

function DurationCard({ title, days, sub, color }) {
  const [bg, text] = color.split(' ')
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <p className="text-xs font-bold text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-display font-black ${text}`}>{Math.round(days)}</span>
        <span className={`text-sm ${text}`}>hari</span>
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
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-evenly mb-3">
        {hasBuffer ? (
          <>
            <Metric label="AKTUAL" value={`${item.gross_duration_days} hr`} color="text-amber-500" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="WAKTU KPI" value={`${item.net_duration_days} hr`} color="text-green-600" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="MIN SLA" value={`${item.standard_lead_time} hr`} color="text-slate-500" />
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

      {/* Buffer note */}
      {hasBuffer && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
          <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Toleransi kandidat batal: -{bufferDays} hari — tidak dinilai sebagai keterlambatan HRD.
          </p>
        </div>
      )}

      {/* Progress */}
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