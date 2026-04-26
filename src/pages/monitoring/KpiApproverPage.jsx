// src/pages/monitoring/KpiApproverPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringApi } from '../../api/services'
import { formatDate, getPerformanceMeta } from '../../utils/helpers'
import { ErrorBox, EmptyState, ProgressBar, KpiDistributionSkeleton, KpiItemCardSkeleton } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import { periodToLabel, periodToApiParam } from '../../utils/periodFilter'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import { Gauge, Calendar, ChevronDown, ChevronRight, Clock, Trophy, X } from 'lucide-react'

// IMPORT ANIMATED ICON
import { AnimatedIcon } from '../../components/AnimatedIcon'

const ITEMS_PER_PAGE = 10

function getDelayColor(days) {
  if (days <= 1) return '#00C853'
  if (days <= 3) return '#2E7D32'
  if (days <= 5) return '#F57C00'
  return '#D32F2F'
}

// ── Full-page skeleton matching KpiApproverPage layout ─────────────────────
function KpiApproverSkeleton() {
  return (
    <div className="space-y-5">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
        <div className="page-header mb-4">
          <div className="space-y-2">
            <div className="skeleton h-8 w-44 rounded" />
            <div className="skeleton h-4 w-52 rounded" />
          </div>
        </div>
        <div className="flex flex-col xl:flex-row gap-8 items-stretch w-full pl-5">
          {/* Stats strip: TOTAL, FAST RATE, AVG DELAY */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center py-1 px-2">
              <div className="skeleton h-8 w-10 mx-auto rounded mb-1.5" />
              <div className="skeleton h-3 w-12 mx-auto rounded" />
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center py-1 px-2">
              <div className="skeleton h-8 w-16 mx-auto rounded mb-1.5" />
              <div className="skeleton h-3 w-16 mx-auto rounded" />
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center py-1 px-2">
              <div className="skeleton h-8 w-12 mx-auto rounded mb-1.5" />
              <div className="skeleton h-3 w-16 mx-auto rounded" />
            </div>
          </div>
          {/* Target Ideal */}
          <div className="flex-1 flex items-center gap-3">
            <div className="skeleton w-5 h-5 rounded shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-full max-w-xs rounded" />
            </div>
          </div>
          {/* Calendar filter */}
          <div className="flex items-center shrink-0 justify-end">
            <div className="skeleton h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Distribution card skeleton */}
      <KpiDistributionSkeleton bars={3} />

      {/* Approval log items skeleton */}
      <div className="space-y-3 mt-4">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
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

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
    usePagination(items, ITEMS_PER_PAGE)

  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  if (isLoading) return <KpiApproverSkeleton />
  if (isError)   return <ErrorBox message="Gagal memuat KPI Approver." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">
      
      {/* ── STICKY HEADER: JUDUL, SUMMARY & FILTER ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
        
        {/* Title Section */}
        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">Rekap Approval</h1>
            <p className="text-sm text-slate-500 mt-0.5">Approval Performance — {periodToLabel(period)}</p>
          </div>
        </div>

        {/* ── SATU BARIS MENYAMPING: STATS, TARGET IDEAL, FILTER ── */}
        <div className="flex flex-col xl:flex-row gap-8 items-stretch w-full pl-5">
          
          {/* KIRI: Total, Fast Rate, Avg Delay (Datar) */}
          <div className="flex items-center gap-6 shrink-0">
            <CompactStat label="TOTAL" value={total.toString()} color="text-sapphire" />
            <div className="w-px h-8 bg-slate-200" />
            <CompactStat
              label="FAST RATE"
              value={`${summary.fast_approval_rate ?? 0}%`}
              color={(summary.fast_approval_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}
            />
            <div className="w-px h-8 bg-slate-200" />
            <CompactStat
              label="AVG DELAY"
              value={`${Math.round(summary.avg_approval_delay_days ?? 0)}d`}
              color={(summary.avg_approval_delay_days ?? 0) <= 3 ? 'text-green-600' : 'text-red-500'}
            />
          </div>

          {/* TENGAH: Insight / Target Ideal */}
          <div className="flex-1 flex items-center gap-3">
            <AnimatedIcon variant="wiggle">
              <Trophy size={20} className="text-sapphire shrink-0" />
            </AnimatedIcon>
            <div>
              <p className="text-xs font-bold text-sapphire mb-0.5">Target Ideal</p>
              <p className="text-[11px] text-slate-600 leading-snug">
                Approval permintaan karyawan dalam <strong className="text-navy">≤3 hari kerja</strong> untuk memastikan proses rekrutmen berjalan lancar.
              </p>
            </div>
          </div>

          {/* KANAN: Filter Kalender (Dibungkus div items-center agar tidak strech) */}
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

      {/* ── Items dengan Pagination ── */}
      {items.length === 0 ? (
        <EmptyState message="Belum ada data approval pada periode ini." />
      ) : (
        <div className="space-y-3 mt-4">
          <p className="font-display font-bold text-navy text-sm">
            Approval Log ({totalItems})
          </p>
          <div className="space-y-4">
            {paginatedData.map(item => (
              <ApprovalItemCard key={`${item.tpk_nomor}-${item.approver_nik}`} item={item} />
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
    <div className="text-center py-1 px-2">
      <p className={`text-2xl font-display font-black leading-none mb-1.5 ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function ApprovalItemCard({ item }) {
  const meta       = getPerformanceMeta(item.approval_performance)
  const delayColor = getDelayColor(item.sla_approval_delay_days)

  return (
    <div className="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy group-hover:text-sapphire transition-colors">{item.approver_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{item.jab_nama}</p>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full transition-colors"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label}
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between mb-3">
        <DateBlock label="REQUESTED" date={item.request_date} />
        <AnimatedIcon variant="slideRight">
          <ChevronRight size={16} className="text-slate-300" />
        </AnimatedIcon>
        <DateBlock label="APPROVED" date={item.approved_date} color="text-green-600" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <AnimatedIcon variant="spin">
            <Clock size={14} style={{ color: delayColor }} />
          </AnimatedIcon>
          <span className="text-xs font-bold" style={{ color: delayColor }}>
            Duration: {item.sla_approval_delay_days} days
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.tpk_bagian}</span>
      </div>
    </div>
  )
}

function DateBlock({ label, date, color = 'text-slate-700' }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-xs font-bold mt-1 ${color}`}>{formatDate(date)}</p>
    </div>
  )
}