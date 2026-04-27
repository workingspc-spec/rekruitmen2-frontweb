// src/pages/monitoring/SlaStatusListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { monitoringApi } from '../../api/services'
import { formatDate, getSlaStatusMeta, getDaysColor } from '../../utils/helpers'
import {
  matchesPeriodFilter,
  periodToLabel,
} from '../../utils/periodFilter'
import { ErrorBox, EmptyState, ProgressBar, SlaCardSkeleton, SlaStatsSkeleton } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import {
  Activity, Calendar, Users, Edit2, Clock, X, ChevronDown,
} from 'lucide-react'
import { AnimatedIcon } from '../../components/AnimatedIcon'

const ITEMS_PER_PAGE = 12

const FILTERS = [
  { key: 'ALL',              label: 'Semua',             color: 'sapphire' },
  { key: 'NEED_USER_UPDATE', label: 'Perlu Update',      color: 'orange' },
  { key: 'OVERDUE',          label: 'Terlambat',         color: 'red' },
  { key: 'CRITICAL',         label: 'Kritis',            color: 'red' },
  { key: 'WARNING',          label: 'Warning',           color: 'amber' },
  { key: 'ON_PROGRESS',      label: 'Normal',            color: 'sapphire' },
  { key: 'APPROVAL_DELAYED', label: 'Approval Tertunda', color: 'amber' },
  { key: 'COMPLETED',        label: 'Selesai',           color: 'green' },
]

const getFilterClasses = (color, isActive) => {
  if (isActive) {
    const map = {
      sapphire: 'bg-white shadow text-sapphire',
      orange:   'bg-white shadow text-orange-600',
      red:      'bg-white shadow text-red-600',
      amber:    'bg-white shadow text-amber-600',
      green:    'bg-white shadow text-green-600',
    }
    return map[color] || 'bg-white shadow text-sapphire'
  }
  return 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
}

const getBadgeClasses = (color) => {
  const map = {
    sapphire: 'bg-sapphire/10 text-sapphire',
    orange:   'bg-orange-100 text-orange-700',
    red:      'bg-red-100 text-red-700',
    amber:    'bg-amber-100 text-amber-700',
    green:    'bg-green-100 text-green-700',
  }
  return map[color] || 'bg-sapphire/10 text-sapphire'
}

function matchesSlaItemPeriod(item, period) {
  const dateStr = item.ui_status_tag === 'COMPLETED' ? (item.sla_completed_at || item.tpk_tanggal) : item.tpk_tanggal
  return matchesPeriodFilter(dateStr, period)
}

export default function SlaStatusListPage({ initialStatusFilter, initialPeriodFilter }) {
  const { isHrd }  = useAuth()
  const navigate   = useNavigate()

  const [filter, setFilter]                    = useState(initialStatusFilter || 'ALL')
  const [activePeriodFilter, setActivePeriod]  = useState(initialPeriodFilter || null)
  const [showPeriodPicker, setShowPeriodPicker] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sla-status'],
    queryFn:  () => monitoringApi.slaStatus().then(r => r.data),
    refetchInterval: 60_000,
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}

  const filtered = useMemo(() => {
    let result
    if      (filter === 'ALL')               result = items
    else if (filter === 'ACTIVE')            result = items.filter(i => i.sla_status === 'CALCULATED') // <-- TAMBAHAN BARU
    else if (filter === 'NEED_USER_UPDATE')  result = items.filter(i => i.sla_is_editable === 1)
    else if (filter === 'APPROVAL_DELAYED')  result = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED')
    else                                     result = items.filter(i => i.ui_status_tag === filter)

    if (activePeriodFilter) {
      result = result.filter(i => matchesSlaItemPeriod(i, activePeriodFilter))
    }

    return result
  }, [items, filter, activePeriodFilter])

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } = usePagination(filtered, ITEMS_PER_PAGE)

  const approvalDelayedCount = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED').length
  const isFromDashboard = (initialStatusFilter || initialPeriodFilter) && (filter === initialStatusFilter || activePeriodFilter === initialPeriodFilter)

  const clearAllFilters = () => {
    setFilter('ALL')
    setActivePeriod(null)
  }

  const progressPercentage = ((summary.total_hired ?? 0) / (summary.total_target || 1)) * 100

  return (
    <div className="space-y-5 relative">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">SLA Monitoring</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoading ? (
                <span className="skeleton inline-block h-3.5 w-32 rounded" />
              ) : (
                `${summary.total_active ?? 0} permintaan aktif`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between w-full pl-6">

          {/* Progress stats */}
          {isLoading ? (
            <div className="flex items-center gap-4 shrink-0">
              <div className="skeleton h-6 w-16 rounded" />
              <div className="w-px h-6 bg-slate-200" />
              <div className="skeleton h-6 w-16 rounded" />
              <div className="hidden sm:block skeleton h-2 w-24 rounded-full ml-2" />
            </div>
          ) : (
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hired</span>
                <span className="text-lg font-black text-green-600 leading-none">{summary.total_hired ?? 0}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
                <span className="text-lg font-black text-sapphire leading-none">{summary.total_target ?? 0}</span>
              </div>
              <div className="hidden sm:block w-24 ml-2">
                <ProgressBar value={progressPercentage} color="#0F52BA" />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
              {FILTERS.map(f => {
                const count =
                  f.key === 'ALL'                ? items.length
                  : f.key === 'NEED_USER_UPDATE' ? (summary.need_update ?? 0)
                  : f.key === 'APPROVAL_DELAYED' ? approvalDelayedCount
                  : items.filter(i => i.ui_status_tag === f.key).length

                if (count === 0 && f.key !== 'ALL') return null
                const isActive = filter === f.key

                return (
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); setActivePeriod(null) }}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${getFilterClasses(f.color, isActive)}`}
                  >
                    {f.label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold transition-colors ${getBadgeClasses(f.color)}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowPeriodPicker(true)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 whitespace-nowrap ${
                activePeriodFilter
                  ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'
              }`}
            >
              <Calendar size={13} className={activePeriodFilter ? 'text-sapphire' : 'text-slate-400'} />
              <span className="max-w-[100px] truncate">{periodToLabel(activePeriodFilter)}</span>
              {activePeriodFilter ? (
                <X size={12} className="hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); setActivePeriod(null) }} />
              ) : (
                <ChevronDown size={13} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {(activePeriodFilter || (filter !== 'ALL' && !isFromDashboard)) && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-[#A6C5D7] font-medium">
              {isFromDashboard ? 'Difilter dari Dashboard · Tap tanggal untuk ubah' : 'Filter kustom aktif'}
            </span>
            {!isFromDashboard && (
              <button onClick={clearAllFilters} className="text-xs text-red-500 hover:underline font-semibold flex items-center gap-1">
                <X size={12} /> Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      {isError ? (
        <ErrorBox message="Gagal memuat data monitoring." onRetry={refetch} />
      ) : isLoading ? (
        <>
          <SlaStatsSkeleton />
          <div className="space-y-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SlaCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          {!isHrd && summary.monitoring_bawahan != null && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
              <Activity size={18} className="text-sapphire shrink-0" />
              <p className="text-sm font-medium text-sapphire">
                Monitoring {summary.monitoring_bawahan} permintaan bawahan
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <StatCard 
              label="Total Aktif" 
              value={summary.total_active ?? 0} 
              color="text-sapphire" 
              onClick={() => { setFilter('ACTIVE'); setActivePeriod(null) }} // <-- UBAH KE ACTIVE
              active={filter === 'ACTIVE' && !activePeriodFilter}            // <-- UBAH KE ACTIVE
            />
            <StatCard label="Kritis" value={summary.critical ?? 0} color="text-red-500" onClick={() => { setFilter('CRITICAL'); setActivePeriod(null) }} active={filter === 'CRITICAL'} />
            <StatCard label="Warning" value={summary.warning ?? 0} color="text-amber-500" onClick={() => { setFilter('WARNING'); setActivePeriod(null) }} active={filter === 'WARNING'} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              message={
                activePeriodFilter
                  ? `Tidak ada data "${FILTERS.find(f => f.key === filter)?.label ?? filter}" pada periode ${periodToLabel(activePeriodFilter)}.`
                  : 'Tidak ada data dengan filter ini.'
              }
              icon={Activity}
            />
          ) : (
            <div className="space-y-3 mt-4">
              <div className="space-y-4">
                {paginatedData.map(item => (
                  <SlaCard
                    key={item.tpk_nomor}
                    item={item}
                    isHrd={isHrd}
                    onClick={() => navigate(`/monitoring/${encodeURIComponent(item.tpk_nomor)}`)}
                    onEdit={() => navigate(`/recruitment/edit/${encodeURIComponent(item.tpk_nomor)}`)}
                  />
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
        </>
      )}

      {showPeriodPicker && (
        <PeriodPickerModal current={activePeriodFilter} onSelect={(val) => { setActivePeriod(val); setShowPeriodPicker(false) }} onClose={() => setShowPeriodPicker(false)} />
      )}
    </div>
  )
}

// ── Sub Components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`card py-3 px-2 text-center transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7] ${
        active ? 'ring-2 ring-sapphire border-transparent shadow-sm' : ''
      }`}
    >
      <p className={`text-xl font-display font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">{label}</p>
    </button>
  )
}

function SlaCard({ item, isHrd, onClick, onEdit }) {
  const meta      = getSlaStatusMeta(item.ui_status_tag)
  const daysColor = getDaysColor(item.days_remaining)
  const isCompleted = item.ui_status_tag === 'COMPLETED'
  const canEdit   = !isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1

  return (
    <div
      className="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label}
        </span>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!isCompleted && item.sla_is_editable === 1 && (
            item.is_bawahan === 1 ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-full px-2.5 py-1">
                <AnimatedIcon variant="wiggle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </AnimatedIcon>
                <span className="text-[10px] font-bold text-amber-700">
                  Ingatkan {item.nama_peminta?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <button
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                  canEdit
                    ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                    : 'bg-orange-50 text-orange-500 border-orange-200 cursor-default'
                }`}
                onClick={canEdit ? onEdit : undefined}
              >
                {canEdit && (
                  <AnimatedIcon variant="scale">
                    <Edit2 size={10} />
                  </AnimatedIcon>
                )}
                {!canEdit && <Edit2 size={10} />}
                {canEdit ? 'Update Tgl' : 'Menunggu Update'}
              </button>
            )
          )}

          {!isCompleted && item.sla_is_editable !== 1 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 border border-slate-100" style={{ color: daysColor }}>
              {item.days_remaining < 0
                ? `Terlambat ${-item.days_remaining}h`
                : item.days_remaining === 0 ? 'Hari ini!'
                : `${item.days_remaining}h lagi`}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-display font-bold text-navy text-base group-hover:text-sapphire transition-colors">{item.jab_nama}</p>
        <p className="text-xs text-slate-400 mt-0.5">{item.tpk_bagian} • {item.tpk_nomor}</p>

        <div className="flex items-center gap-1.5 mt-2">
          <Users size={12} className="text-slate-400" />
          <span className="text-xs text-slate-500">{item.nama_peminta}</span>
          {item.is_bawahan === 1 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-sapphire uppercase tracking-wide">Bawahan</span>
          )}
        </div>
      </div>

      {!isCompleted && item.sla_is_editable === 1 && item.is_bawahan === 1 && (
        <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Minta Update Tanggal</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-snug">
              Ingatkan <strong>{item.nama_peminta}</strong> memperbarui tanggal target.
            </p>
          </div>
        </div>
      )}

      {item.approval_flag === 'APPROVAL_DELAYED' && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <Clock size={13} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Approval tertunda {item.sla_approval_delay_days} hari
            {item.approver_name ? ` · Atasan: ${item.approver_name}` : ''}
          </p>
        </div>
      )}

      <div className="pt-3 border-t border-slate-50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Progress: {item.sla_hired_count}/{item.target_count}
          </span>
          <span className="text-xs font-bold text-sapphire">{item.progress_percentage}%</span>
        </div>
        <ProgressBar
          value={item.progress_percentage ?? 0}
          color={isCompleted ? '#2E7D32' : '#0F52BA'}
        />
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <Calendar size={12} className="text-slate-400" />
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Target: {formatDate(item.sla_final_target_date)}</span>
        {isCompleted && item.sla_completed_at && (
          <span className="text-[10px] text-green-600 font-bold ml-auto bg-green-50 px-2 py-0.5 rounded-md">
            ✓ Selesai {formatDate(item.sla_completed_at)}
          </span>
        )}
      </div>
    </div>
  )
}