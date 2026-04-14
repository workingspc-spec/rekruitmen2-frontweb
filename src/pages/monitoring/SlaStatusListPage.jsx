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
  PERIOD_OPTIONS,
} from '../../src/utils/periodFilter'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import {
  Activity, Calendar, Users, ChevronRight,
  Edit2, AlertTriangle, Clock, X, ChevronDown,
} from 'lucide-react'

// ── FILTER DEFINITIONS ─────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'ALL',              label: 'Semua' },
  { key: 'NEED_USER_UPDATE', label: 'Perlu Update' },
  { key: 'OVERDUE',          label: 'Terlambat' },
  { key: 'CRITICAL',         label: 'Kritis' },
  { key: 'WARNING',          label: 'Warning' },
  { key: 'ON_PROGRESS',      label: 'Normal' },
  { key: 'APPROVAL_DELAYED', label: 'Approval Terlambat' },
  { key: 'COMPLETED',        label: 'Selesai' },
]

/**
 * Cocokkan SlaStatusItem dengan period filter.
 *
 * Untuk item COMPLETED, gunakan sla_completed_at sebagai referensi tanggal
 * agar filter "Bulan Ini" menampilkan rekrutmen yang SELESAI bulan ini
 * (bukan yang DIBUAT bulan ini). Untuk status lain, gunakan tpk_tanggal.
 *
 * Catatan desain: monitoringApi.slaStatus() dipanggil TANPA parameter period
 * karena backend selalu mengembalikan semua data aktif dan semua yang sudah
 * COMPLETED. Filter period dilakukan sepenuhnya di sisi client (browser).
 * Ini disengaja agar:
 *   1. Summary stats (needUpdate, overdue, dll.) selalu akurat terhadap
 *      keseluruhan data, bukan subset yang sudah difilter.
 *   2. User bisa bebas mengganti filter period tanpa refetch ke server.
 * Trade-off: jika data sangat besar (ribuan baris), pertimbangkan server-side
 * filtering dengan menambah param ke endpoint.
 */
function matchesSlaItemPeriod(item, period) {
  const dateStr =
    item.ui_status_tag === 'COMPLETED'
      ? item.sla_completed_at || item.tpk_tanggal
      : item.tpk_tanggal
  return matchesPeriodFilter(dateStr, period)
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
/**
 * @param {string}  [initialStatusFilter]  - Filter status awal dari URL (mis. 'COMPLETED', 'OVERDUE')
 * @param {string}  [initialPeriodFilter]  - Filter period awal dari URL (mis. 'This month')
 *
 * Kedua prop ini diisi oleh MonitoringListWrapper di App.jsx yang membaca
 * query param ?status= dan ?period= dari URL — navigasi dari DashboardPage.
 */
export default function SlaStatusListPage({ initialStatusFilter, initialPeriodFilter }) {
  const { isHrd }  = useAuth()
  const navigate   = useNavigate()

  const [filter, setFilter]                    = useState(initialStatusFilter || 'ALL')
  const [activePeriodFilter, setActivePeriod]  = useState(initialPeriodFilter || null)
  const [showPeriodPicker, setShowPeriodPicker] = useState(false)

  /**
   * slaStatus() dipanggil tanpa argumen period — lihat komentar desain di atas.
   * refetchInterval 60s menjaga data tetap segar tanpa membebani server.
   */
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sla-status'],
    queryFn:  () => monitoringApi.slaStatus().then(r => r.data),
    refetchInterval: 60_000,
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}

  const filtered = useMemo(() => {
    // Step 1: filter status
    let result
    if      (filter === 'ALL')               result = items
    else if (filter === 'NEED_USER_UPDATE')  result = items.filter(i => i.sla_is_editable === 1)
    else if (filter === 'APPROVAL_DELAYED')  result = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED')
    else                                     result = items.filter(i => i.ui_status_tag === filter)

    // Step 2: filter period (client-side)
    if (activePeriodFilter) {
      result = result.filter(i => matchesSlaItemPeriod(i, activePeriodFilter))
    }

    return result
  }, [items, filter, activePeriodFilter])

  const approvalDelayedCount = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED').length

  const isFromDashboard =
    (initialStatusFilter || initialPeriodFilter) &&
    (filter === initialStatusFilter || activePeriodFilter === initialPeriodFilter)

  const clearAllFilters = () => {
    setFilter('ALL')
    setActivePeriod(null)
  }

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat data monitoring." onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Monitoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">{summary.total_active ?? 0} permintaan aktif</p>
        </div>

        <button
          onClick={() => setShowPeriodPicker(true)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border transition-all hover:shadow-sm hover:-translate-y-0.5 ${
            activePeriodFilter
              ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
              : 'bg-white text-slate-700 border-slate-200 hover:border-sapphire'
          }`}
        >
          <Calendar size={16} className="text-sapphire" />
          <span className="font-semibold text-xs max-w-[130px] truncate">
            {periodToLabel(activePeriodFilter)}
          </span>
          {activePeriodFilter ? (
            <X
              size={14}
              className="text-slate-400 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); setActivePeriod(null) }}
            />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* ── Banner filter aktif ── */}
      {(activePeriodFilter || filter !== 'ALL') && (
        <div className="flex items-center justify-between bg-sapphire/5 border border-sapphire/20 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-sapphire" />
            <span className="text-sm font-semibold text-sapphire">
              {filter !== 'ALL' && (
                <span>{FILTERS.find(f => f.key === filter)?.label ?? filter}</span>
              )}
              {filter !== 'ALL' && activePeriodFilter && (
                <span className="text-slate-400 font-normal"> · </span>
              )}
              {activePeriodFilter && <span>{periodToLabel(activePeriodFilter)}</span>}
              {isFromDashboard && (
                <span className="text-xs text-slate-400 font-normal ml-1">· dari Dashboard</span>
              )}
            </span>
          </div>
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
          >
            <X size={13} /> Hapus Filter
          </button>
        </div>
      )}

      {/* ── Alert Cards ── */}
      <div className="space-y-3">
        {(summary.need_update ?? 0) > 0 && (
          <AlertCard
            icon={<Edit2 size={20} />}
            color="orange"
            title={isHrd ? 'Perlu Update Tanggal' : 'HRD Minta Update Tanggal'}
            count={summary.need_update}
            onClick={() => { setFilter('NEED_USER_UPDATE'); setActivePeriod(null) }}
          />
        )}
        {(summary.overdue ?? 0) > 0 && (
          <AlertCard
            icon={<AlertTriangle size={20} />}
            color="red"
            title="Target Terlambat"
            count={summary.overdue}
            onClick={() => { setFilter('OVERDUE'); setActivePeriod(null) }}
          />
        )}
        {approvalDelayedCount > 0 && isHrd && (
          <AlertCard
            icon={<Clock size={20} />}
            color="amber"
            title="Approval Tertunda >5 Hari"
            count={approvalDelayedCount}
            onClick={() => { setFilter('APPROVAL_DELAYED'); setActivePeriod(null) }}
          />
        )}
      </div>

      {/* ── Banner monitoring bawahan untuk non-HRD ── */}
      {!isHrd && summary.monitoring_bawahan != null && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <Activity size={18} className="text-sapphire shrink-0" />
          <p className="text-sm font-medium text-sapphire">
            Monitoring {summary.monitoring_bawahan} permintaan bawahan
          </p>
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Aktif"
          value={summary.total_active ?? 0}
          color="text-sapphire"
          onClick={() => { setFilter('ALL'); setActivePeriod(null) }}
          active={filter === 'ALL' && !activePeriodFilter}
        />
        <StatCard
          label="Kritis"
          value={summary.critical ?? 0}
          color="text-red-500"
          onClick={() => { setFilter('CRITICAL'); setActivePeriod(null) }}
          active={filter === 'CRITICAL'}
        />
        <StatCard
          label="Warning"
          value={summary.warning ?? 0}
          color="text-amber-500"
          onClick={() => { setFilter('WARNING'); setActivePeriod(null) }}
          active={filter === 'WARNING'}
        />
      </div>

      {/* ── Progress Card ── */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <ProgressStat label="Hired"  value={summary.total_hired ?? 0}  color="text-green-600" />
          <div className="w-px h-10 bg-slate-100" />
          <ProgressStat label="Target" value={summary.total_target ?? 0} color="text-sapphire" />
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const count =
            f.key === 'ALL'               ? items.length
            : f.key === 'NEED_USER_UPDATE' ? (summary.need_update ?? 0)
            : f.key === 'APPROVAL_DELAYED' ? approvalDelayedCount
            : items.filter(i => i.ui_status_tag === f.key).length
          if (count === 0 && f.key !== 'ALL') return null
          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setActivePeriod(null) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f.key
                  ? 'bg-sapphire text-white border-sapphire'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sapphire'
              }`}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ── List ── */}
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
        <div className="space-y-4">
          {filtered.map(item => (
            <SlaCard
              key={item.tpk_nomor}
              item={item}
              isHrd={isHrd}
              onClick={() => navigate(`/monitoring/${encodeURIComponent(item.tpk_nomor)}`)}
              onEdit={() => navigate(`/recruitment/edit/${encodeURIComponent(item.tpk_nomor)}`)}
            />
          ))}
        </div>
      )}

      {/* ── Period Picker Modal ── */}
      {showPeriodPicker && (
        <PeriodPickerModal
          current={activePeriodFilter}
          onSelect={(val) => { setActivePeriod(val); setShowPeriodPicker(false) }}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}
    </div>
  )
}

// ── Sub Components (tidak berubah dari versi sebelumnya) ───────────────────────

function AlertCard({ icon, color, title, count, onClick }) {
  const cls = {
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red:    'bg-red-50   border-red-200   text-red-700',
    amber:  'bg-amber-50  border-amber-200  text-amber-700',
  }[color]

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 border rounded-2xl p-4 text-left transition-shadow hover:shadow-card-hover ${cls}`}
    >
      {icon}
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-70">{count} permintaan</p>
      </div>
      <ChevronRight size={18} />
    </button>
  )
}

function StatCard({ label, value, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`card text-center transition-all hover:shadow-card-hover ${active ? 'ring-2 ring-sapphire' : ''}`}
    >
      <p className={`text-2xl font-display font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
    </button>
  )
}

function ProgressStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-display font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function SlaCard({ item, isHrd, onClick, onEdit }) {
  const meta      = getSlaStatusMeta(item.ui_status_tag)
  const daysColor = getDaysColor(item.days_remaining)
  const isCompleted = item.ui_status_tag === 'COMPLETED'
  const canEdit   = !isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1

  return (
    <div
      className="card hover:shadow-card-hover transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label}
        </span>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!isCompleted && item.sla_is_editable === 1 && (
            <button
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                canEdit
                  ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  : 'bg-orange-50 text-orange-500 border-orange-200 cursor-default'
              }`}
              onClick={canEdit ? onEdit : undefined}
            >
              <Edit2 size={12} />
              {canEdit ? 'Tap untuk Update' : 'Update Required'}
            </button>
          )}
          {!isCompleted && item.sla_is_editable !== 1 && (
            <span className="text-xs font-bold" style={{ color: daysColor }}>
              {item.days_remaining < 0
                ? `Terlambat ${-item.days_remaining} hari`
                : item.days_remaining === 0 ? 'Hari ini!'
                : `${item.days_remaining} hari lagi`}
            </span>
          )}
        </div>
      </div>

      <p className="font-display font-bold text-navy">{item.jab_nama}</p>
      <p className="text-xs text-slate-400 mt-0.5">{item.tpk_bagian} • {item.tpk_nomor}</p>

      <div className="flex items-center gap-1.5 mt-2">
        <Users size={13} className="text-slate-400" />
        <span className="text-xs text-slate-400">{item.nama_peminta}</span>
        {item.is_bawahan === 1 && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-sapphire">Bawahan</span>
        )}
      </div>

      {item.approval_flag === 'APPROVAL_DELAYED' && (
        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <Clock size={13} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Approval tertunda {item.sla_approval_delay_days} hari
            {item.approver_name ? ` · Atasan: ${item.approver_name}` : ''}
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-600">
            Progress: {item.sla_hired_count}/{item.target_count}
          </span>
          <span className="text-xs font-bold text-sapphire">{item.progress_percentage}%</span>
        </div>
        <ProgressBar
          value={item.progress_percentage ?? 0}
          color={isCompleted ? '#2E7D32' : '#0F52BA'}
        />
      </div>

      {/* Target date */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
        <Calendar size={13} className="text-slate-400" />
        <span className="text-xs text-slate-400">Target: {formatDate(item.sla_final_target_date)}</span>
        {isCompleted && item.sla_completed_at && (
          <span className="text-xs text-green-600 font-semibold ml-2">
            · Selesai: {formatDate(item.sla_completed_at)}
          </span>
        )}
      </div>
    </div>
  )
}