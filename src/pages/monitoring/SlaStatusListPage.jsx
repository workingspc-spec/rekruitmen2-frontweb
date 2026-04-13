// src/pages/monitoring/SlaStatusListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { monitoringApi } from '../../api/services'
import { formatDate, getSlaStatusMeta, getDaysColor } from '../../utils/helpers'
import { PageLoader, ErrorBox, EmptyState, ProgressBar } from '../../components/ui'
import {
  Activity, Calendar, Users, ChevronRight,
  Edit2, AlertTriangle, Clock, X,
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

// ── PERIOD HELPERS ─────────────────────────────────────────────────────────────
/**
 * Cocokkan item dengan period filter.
 * Untuk COMPLETED: filter berdasarkan sla_completed_at.
 * Untuk lainnya: filter berdasarkan tpk_tanggal.
 */
function matchesPeriodFilter(item, period) {
  if (!period) return true

  // Pilih field tanggal yang relevan:
  // - Item COMPLETED → gunakan sla_completed_at (kapan tiket benar-benar selesai)
  // - Item lain      → gunakan tpk_tanggal (tanggal permintaan dibuat)
  const rawDate = item.ui_status_tag === 'COMPLETED'
    ? (item.sla_completed_at || item.tpk_tanggal)
    : item.tpk_tanggal

  if (!rawDate) return true

  try {
    const itemDate = new Date(rawDate.substring(0, 10) + 'T00:00:00')
    const today    = new Date(); today.setHours(0, 0, 0, 0)

    switch (period.toLowerCase()) {
      case 'today':
        return itemDate.toDateString() === today.toDateString()
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1)
        return itemDate.toDateString() === y.toDateString()
      }
      case 'this week':
      case 'this+week': {
        const mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() || 7) + 1)
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return itemDate >= mon && itemDate <= sun
      }
      case 'last week': {
        const mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() || 7) - 6)
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return itemDate >= mon && itemDate <= sun
      }
      case 'this month':
      case 'this+month':
        return itemDate.getMonth() === today.getMonth() &&
               itemDate.getFullYear() === today.getFullYear()
      case 'last month': {
        const lm = new Date(today); lm.setMonth(lm.getMonth() - 1)
        return itemDate.getMonth() === lm.getMonth() &&
               itemDate.getFullYear() === lm.getFullYear()
      }
      case 'this year':
        return itemDate.getFullYear() === today.getFullYear()
      case 'last year':
        return itemDate.getFullYear() === today.getFullYear() - 1
      default: {
        if (period.toLowerCase().startsWith('custom:')) {
          const rangeStr = period.replace(/custom:/i, '').trim()
          const parts = rangeStr.includes(',') ? rangeStr.split(',') : rangeStr.split(' - ')
          if (parts.length === 2) {
            const start = new Date(parts[0].trim() + 'T00:00:00')
            const end   = new Date(parts[1].trim() + 'T00:00:00')
            return itemDate >= start && itemDate <= end
          }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
          return itemDate.toDateString() === new Date(period + 'T00:00:00').toDateString()
        }
        return true
      }
    }
  } catch { return true }
}

/**
 * Ubah nilai period ke label yang mudah dibaca.
 */
function periodToLabel(period) {
  if (!period) return null
  const MAP = {
    'today':      'Hari Ini',
    'yesterday':  'Kemarin',
    'this week':  'Minggu Ini',
    'this+week':  'Minggu Ini',
    'last week':  'Minggu Lalu',
    'this month': 'Bulan Ini',
    'this+month': 'Bulan Ini',
    'last month': 'Bulan Lalu',
    'this year':  'Tahun Ini',
    'last year':  'Tahun Lalu',
  }
  return MAP[period.toLowerCase()] ?? period
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
/**
 * @param {string}  [initialStatusFilter]  - Status filter awal dari URL (mis. 'COMPLETED', 'OVERDUE')
 * @param {string}  [initialPeriodFilter]  - Period filter awal dari URL (mis. 'This month')
 */
export default function SlaStatusListPage({ initialStatusFilter, initialPeriodFilter }) {
  const { isHrd }  = useAuth()
  const navigate   = useNavigate()

  // ✅ FIX: Inisialisasi filter dari props (dikirim Dashboard via URL params)
  const [filter, setFilter]               = useState(initialStatusFilter || 'ALL')
  const [activePeriodFilter, setPeriod]   = useState(initialPeriodFilter || null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sla-status'],
    queryFn: () => monitoringApi.slaStatus().then(r => r.data),
    refetchInterval: 60_000,
  })

  const items   = data?.data    ?? []
  const summary = data?.summary ?? {}

  // ✅ FIX: useMemo sekarang juga menerapkan period filter di atas status filter
  const filtered = useMemo(() => {
    // Step 1: filter berdasarkan STATUS
    let result = items
    if (filter === 'ALL')               result = items
    else if (filter === 'NEED_USER_UPDATE') result = items.filter(i => i.sla_is_editable === 1)
    else if (filter === 'APPROVAL_DELAYED') result = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED')
    else                                    result = items.filter(i => i.ui_status_tag === filter)

    // Step 2: filter berdasarkan PERIOD (opsional, hanya jika ada period aktif)
    if (activePeriodFilter) {
      result = result.filter(i => matchesPeriodFilter(i, activePeriodFilter))
    }

    return result
  }, [items, filter, activePeriodFilter])

  const approvalDelayedCount = items.filter(i => i.approval_flag === 'APPROVAL_DELAYED').length

  // Label period yang ditampilkan di banner
  const periodLabel = periodToLabel(activePeriodFilter)

  if (isLoading) return <PageLoader />
  if (isError)   return <ErrorBox message="Gagal memuat data monitoring." onRetry={refetch} />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Monitoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">{summary.total_active ?? 0} permintaan aktif</p>
        </div>
      </div>

      {/* ✅ BARU: Banner filter aktif dari Dashboard (tampil jika ada period filter) */}
      {activePeriodFilter && (
        <div className="flex items-center justify-between bg-sapphire/5 border border-sapphire/20 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-sapphire" />
            <span className="text-sm font-semibold text-sapphire">
              Difilter: {FILTERS.find(f => f.key === filter)?.label ?? filter}
              {periodLabel ? ` · ${periodLabel}` : ''}
            </span>
            {initialStatusFilter && initialPeriodFilter && (
              <span className="text-xs text-slate-400 ml-1">· dari Dashboard</span>
            )}
          </div>
          <button
            onClick={() => { setFilter('ALL'); setPeriod(null) }}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
          >
            <X size={13} /> Hapus Filter
          </button>
        </div>
      )}

      {/* Alert Cards */}
      <div className="space-y-3">
        {(summary.need_update ?? 0) > 0 && (
          <AlertCard
            icon={<Edit2 size={20} />}
            color="orange"
            title={isHrd ? 'Perlu Update Tanggal' : 'HRD Minta Update Tanggal'}
            count={summary.need_update}
            onClick={() => { setFilter('NEED_USER_UPDATE'); setPeriod(null) }}
          />
        )}
        {(summary.overdue ?? 0) > 0 && (
          <AlertCard
            icon={<AlertTriangle size={20} />}
            color="red"
            title="Target Terlambat"
            count={summary.overdue}
            onClick={() => { setFilter('OVERDUE'); setPeriod(null) }}
          />
        )}
        {approvalDelayedCount > 0 && isHrd && (
          <AlertCard
            icon={<Clock size={20} />}
            color="amber"
            title="Approval Tertunda >5 Hari"
            count={approvalDelayedCount}
            onClick={() => { setFilter('APPROVAL_DELAYED'); setPeriod(null) }}
          />
        )}
      </div>

      {/* Banner monitoring bawahan untuk non-HRD */}
      {!isHrd && summary.monitoring_bawahan != null && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <Activity size={18} className="text-sapphire shrink-0" />
          <p className="text-sm font-medium text-sapphire">
            Monitoring {summary.monitoring_bawahan} permintaan bawahan
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Aktif"
          value={summary.total_active ?? 0}
          color="text-sapphire"
          onClick={() => { setFilter('ALL'); setPeriod(null) }}
          active={filter === 'ALL' && !activePeriodFilter}
        />
        <StatCard
          label="Kritis"
          value={summary.critical ?? 0}
          color="text-red-500"
          onClick={() => { setFilter('CRITICAL'); setPeriod(null) }}
          active={filter === 'CRITICAL'}
        />
        <StatCard
          label="Warning"
          value={summary.warning ?? 0}
          color="text-amber-500"
          onClick={() => { setFilter('WARNING'); setPeriod(null) }}
          active={filter === 'WARNING'}
        />
      </div>

      {/* Progress Card */}
      <div className="card">
        <div className="flex items-center justify-evenly">
          <ProgressStat label="Hired"  value={summary.total_hired ?? 0}  color="text-green-600" />
          <div className="w-px h-10 bg-slate-100" />
          <ProgressStat label="Target" value={summary.total_target ?? 0} color="text-sapphire" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const count = f.key === 'ALL'               ? items.length
            : f.key === 'NEED_USER_UPDATE'            ? (summary.need_update ?? 0)
            : f.key === 'APPROVAL_DELAYED'            ? approvalDelayedCount
            : items.filter(i => i.ui_status_tag === f.key).length
          if (count === 0 && f.key !== 'ALL') return null
          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPeriod(null) }}
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

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          message={
            activePeriodFilter
              ? `Tidak ada data "${FILTERS.find(f => f.key === filter)?.label}" pada periode ${periodLabel}.`
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
    </div>
  )
}

// ── Sub Components ─────────────────────────────────────────────────────────────

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

  // canEdit: hanya pemilik permintaan yang bukan bawahan dan izin dibuka
  const canEdit = !isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1

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

      {/* Job info */}
      <p className="font-display font-bold text-navy">{item.jab_nama}</p>
      <p className="text-xs text-slate-400 mt-0.5">{item.tpk_bagian} • {item.tpk_nomor}</p>

      {/* Requester */}
      <div className="flex items-center gap-1.5 mt-2">
        <Users size={13} className="text-slate-400" />
        <span className="text-xs text-slate-400">{item.nama_peminta}</span>
        {item.is_bawahan === 1 && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-sapphire">Bawahan</span>
        )}
      </div>

      {/* Approval delay banner */}
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
        {/* ✅ BARU: Tampilkan tanggal selesai aktual untuk item COMPLETED */}
        {isCompleted && item.sla_completed_at && (
          <span className="text-xs text-green-600 font-semibold ml-2">
            · Selesai: {formatDate(item.sla_completed_at)}
          </span>
        )}
      </div>
    </div>
  )
}