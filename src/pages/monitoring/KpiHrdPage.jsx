// src/pages/monitoring/KpiHrdPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import { periodToLabel, periodToApiParam } from '../../utils/periodFilter'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import { BarChart3, Calendar, ChevronDown, Users, Info, Shield, X } from 'lucide-react'

// IMPORT ANIMATED ICON
import { AnimatedIcon } from '../../components/AnimatedIcon'

const ITEMS_PER_PAGE = 10

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

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
    usePagination(items, ITEMS_PER_PAGE)

  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat KPI HRD." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">
      
      {/* ── STICKY HEADER: JUDUL, SUMMARY & FILTER ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
        
        {/* Title Section */}
        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">KPI Rekrutmen HRD</h1>
            <p className="text-sm text-slate-500 mt-0.5">Executive Summary — {periodToLabel(period)}</p>
          </div>
        </div>

        {/* ── SATU BARIS MENYAMPING: STATS, CATATAN, FILTER ── */}
        <div className="flex flex-col xl:flex-row gap-3 items-stretch w-full pl-5">
          
        {/* KIRI: Total & Success Rate */}
        {/* Class bg, border, shadow dihapus. Jarak diatur menggunakan gap */}
        <div className="flex items-center gap-6 shrink-0 xl:min-w-[200px]">
          <CompactStat label="TOTAL" value={total.toString()} color="text-sapphire" />
          {/* Garis pemisah vertikal opsional, jika ingin benar-benar polos, hapus saja <div> garis pemisah ini */}
          <div className="w-px h-8 bg-slate-200" /> 
          <CompactStat
            label="SUCCESS RATE"
            value={`${summary.success_rate ?? 0}%`}
            color={(summary.success_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}
          />
        </div>

        {/* TENGAH: Catatan Performa */}
        {/* Class bg, border, p-3, shadow dihapus */}
        <div className="flex-1 flex items-center gap-3">
          <AnimatedIcon variant="wiggle">
            <Shield size={20} className="text-sapphire shrink-0" />
          </AnimatedIcon>
          <div>
            <p className="text-xs font-bold text-sapphire mb-0.5">Catatan Performa</p>
            <p className="text-[11px] text-slate-600 leading-snug">
              Tingkat sukses rekrutmen mencapai <strong className="text-navy">{summary.success_rate ?? 0}%</strong> dengan rata-rata waktu penyelesaian <strong className="text-navy">{Math.round(summary.avg_net_duration ?? 0)} hari kerja</strong>.
            </p>
          </div>
        </div>

          {/* KANAN: Filter Kalender (Sama persis dengan KpiApproverPage) */}
          <div className="flex items-center shrink-0 justify-end">
            <button
              onClick={() => setShowPicker(true)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 whitespace-nowrap ${
                period !== 'All Time'
                  ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'
              }`}
            >
              <AnimatedIcon variant="scale">
                <Calendar size={13} className={period !== 'All Time' ? 'text-sapphire' : 'text-slate-400'} />
              </AnimatedIcon>
              
              <span className="max-w-[120px] truncate text-left">
                {periodToLabel(period)}
              </span>
              
              {period !== 'All Time' ? (
                <X
                  size={12}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  onClick={(e) => { e.stopPropagation(); setPeriod('All Time') }}
                />
              ) : (
                <ChevronDown size={13} className="text-slate-400 ml-0.5" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── Distribution ── */}
      <div className="card border border-slate-100 shadow-sm mt-2">
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

      {/* ── Items dengan Pagination ── */}
      {items.length === 0 ? (
        <EmptyState message="Tidak ada data pada periode ini." icon={BarChart3} />
      ) : (
        <div className="space-y-3 mt-4">
          <p className="font-display font-bold text-navy text-sm">
            Riwayat Penempatan ({totalItems})
          </p>
          <div className="space-y-4">
            {paginatedData.map(item => (
              <KpiItemCard key={item.sla_tpk_nomor} item={item} />
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

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

// Data Ringkas dengan text-2xl
function CompactStat({ label, value, color }) {
  return (
    <div className="text-center py-1">
      <p className={`text-2xl font-display font-black leading-none mb-1.5 ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function KpiItemCard({ item }) {
  const meta       = getPerformanceMeta(item.performance_label)
  const bufferDays = item.gross_duration_days - item.net_duration_days
  const hasBuffer  = bufferDays > 0

  return (
    <div className="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy group-hover:text-sapphire transition-colors">{item.position}</p>
          <p className="text-xs text-slate-400 mt-0.5">{item.department} · {item.sla_tpk_nomor}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full transition-colors" style={{ background: meta.bg, color: meta.text }}>
          {meta.label}
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-evenly mb-3">
        {hasBuffer ? (
          <>
            <Metric label="AKTUAL"    value={`${item.gross_duration_days}h`} color="text-amber-500" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="WAKTU KPI" value={`${item.net_duration_days}h`}   color="text-green-600" />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="MIN SLA"   value={`${item.standard_lead_time}h`}  color="text-slate-500" />
          </>
        ) : (
          <>
            <Metric
              label="DISELESAIKAN"
              value={`${item.net_duration_days}h`}
              color={item.net_duration_days <= item.standard_lead_time ? 'text-green-600' : 'text-red-500'}
            />
            <div className="w-px h-6 bg-slate-200" />
            <Metric label="MIN SLA" value={`${item.standard_lead_time}h`} color="text-slate-500" />
          </>
        )}
      </div>

      {hasBuffer && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
          <AnimatedIcon variant="wiggle">
            <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
          </AnimatedIcon>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            Toleransi kandidat batal: -{bufferDays} hari — tidak dinilai sebagai keterlambatan HRD.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 bg-green-50/50 border border-green-100 rounded-xl px-3 py-2 w-fit">
        <AnimatedIcon variant="scale">
          <Users size={14} className="text-green-600" />
        </AnimatedIcon>
        <span className="text-[11px] font-bold text-green-700 uppercase tracking-wide">Hired: {item.hired_count}/{item.target_count}</span>
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-display font-black mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}