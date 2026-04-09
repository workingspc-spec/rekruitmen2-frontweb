// src/pages/DashboardPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/services'
import { formatDate } from '../utils/helpers'
import { StatCard, AlertBanner, PageLoader, ErrorBox } from '../components/ui'
import { PeriodPickerModal } from '../components/PeriodPickerModal'  // ← shared
import {
  ClipboardList, CheckSquare, Activity, BarChart3, TrendingUp,
  ChevronRight, CheckCircle2, Calendar, ChevronDown,
} from 'lucide-react'

const PERIOD_OPTIONS = [
  { value: 'All Time',   label: 'Semua Waktu' },
  { value: 'Today',      label: 'Hari Ini' },
  { value: 'Yesterday',  label: 'Kemarin' },
  { value: 'This week',  label: 'Minggu Ini' },
  { value: 'Last week',  label: 'Minggu Lalu' },
  { value: 'This month', label: 'Bulan Ini' },
  { value: 'Last month', label: 'Bulan Lalu' },
  { value: 'This year',  label: 'Tahun Ini' },
  { value: 'Last year',  label: 'Tahun Lalu' },
]

function periodToLabel(period) {
  const match = PERIOD_OPTIONS.find(o => o.value === period)
  if (match) return match.label
  if (period && period.startsWith('Custom:')) {
    try {
      const rangeStr = period.replace('Custom:', '').trim()
      const parts = rangeStr.includes(',') ? rangeStr.split(',') : rangeStr.split(' - ')
      if (parts.length >= 2) {
        const fmtDate = (s) => new Date(s.trim() + 'T00:00:00')
          .toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        return `${fmtDate(parts[0])} – ${fmtDate(parts[1])}`
      }
    } catch { /* ignore */ }
    return 'Rentang Kustom'
  }
  return period || 'Semua Waktu'
}

function periodToApiParam(period) {
  if (!period || period === 'All Time') return undefined
  if (period.startsWith('Custom:')) {
    return period.replace('Custom:', '').trim().replace(' - ', ',')
  }
  return period
}

export default function DashboardPage() {
  const { user, isHrd } = useAuth()
  const navigate         = useNavigate()

  const [period, setPeriod]         = useState('All Time')
  const [showPicker, setShowPicker] = useState(false)

  const apiParam = periodToApiParam(period)
  const label    = periodToLabel(period)

  const statsQ   = useQuery({
    queryKey: ['dashboard-stats', apiParam],
    queryFn:  () => dashboardApi.stats(apiParam).then(r => r.data.data),
  })
  const summaryQ = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardApi.summary().then(r => r.data.data),
  })

  const stats   = statsQ.data
  const summary = summaryQ.data

  const navigateWithPeriod = (path) => {
    if (!period || period === 'All Time') {
      navigate(path)
    } else {
      navigate(`${path}?period=${encodeURIComponent(period)}`)
    }
  }

  // Adapter: PeriodPickerModal shared pakai value null untuk "Semua Waktu"
  // Dashboard pakai string 'All Time', jadi perlu konversi
  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  const pickerCurrent = period === 'All Time' ? null : period

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">Selamat datang,</p>
          <h1 className="page-title">{user?.nama ?? '–'}</h1>
          <p className="text-xs text-sapphire font-semibold mt-0.5">{user?.bagian ?? ''}</p>
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm hover:border-sapphire transition-colors"
        >
          <Calendar size={14} className="text-sapphire" />
          <span className="text-navy font-medium text-xs max-w-[100px] truncate">{label}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>

      {/* ── Alert Banners ── */}
      {summary?.needUserUpdate > 0 && (
        <AlertBanner
          type="warning"
          message={isHrd
            ? `${summary.needUserUpdate} permintaan perlu update tanggal dari peminta.`
            : 'HRD meminta Anda memperbarui tanggal target pada permintaan Anda.'}
          onAction={() => navigate(isHrd ? '/monitoring' : '/recruitment')}
          actionLabel="Lihat"
        />
      )}
      {summary?.overdueRequests > 0 && (
        <AlertBanner
          type="error"
          message={`${summary.overdueRequests} permintaan melewati target SLA.`}
          onAction={() => navigate('/monitoring')}
          actionLabel="Periksa"
        />
      )}

      {/* ── Stats Grid ── */}
      {statsQ.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card"><div className="skeleton h-16 w-full" /></div>)}
        </div>
      ) : statsQ.isError ? (
        <ErrorBox message="Gagal memuat statistik." onRetry={() => statsQ.refetch()} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Permintaan" value={stats?.totalPermintaan ?? 0}
            icon={ClipboardList} color="#0F52BA"
            onClick={() => navigateWithPeriod('/recruitment')} />
          <StatCard label="Pending Approval" value={stats?.pendingApproval ?? 0}
            icon={CheckSquare} color="#F57C00" alert={stats?.pendingApproval > 0}
            onClick={() => navigateWithPeriod('/approval')} />
          <StatCard label="SLA Aktif" value={summary?.activeRequests ?? 0}
            icon={Activity} color="#0F52BA"
            onClick={() => navigate('/monitoring')} />
          <StatCard label="Selesai Bulan Ini" value={summary?.completedThisMonth ?? 0}
            icon={CheckCircle2} color="#2E7D32"
            onClick={() => navigate('/monitoring')} />
        </div>
      )}

      {/* ── SLA Summary Cards ── */}
      {summary && (
        <div>
          <p className="section-title">SLA Monitoring</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Aktif',        val: summary.activeRequests,  color: '#0F52BA' },
              { label: 'Terlambat',    val: summary.overdueRequests, color: '#D32F2F' },
              { label: 'Perlu Update', val: summary.needUserUpdate,  color: '#F57C00' },
            ].map(({ label, val, color }) => (
              <button key={label} onClick={() => navigate('/monitoring')}
                className="card text-center hover:shadow-card-hover transition-shadow">
                <p className="text-2xl font-display font-black" style={{ color }}>{val}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Menu ── */}
      <div>
        <p className="section-title">Menu Utama</p>
        <div className="space-y-2">
          {[
            { to: '/recruitment', label: 'Permintaan Rekruitmen', sub: 'Buat & kelola permintaan', Icon: ClipboardList },
            { to: '/approval',    label: 'Approval',              sub: 'Setujui permintaan bawahan', Icon: CheckSquare },
            { to: '/monitoring',  label: 'SLA Monitoring',        sub: 'Pantau progress rekruitmen', Icon: Activity },
            isHrd
              ? { to: '/kpi-hrd',      label: 'KPI HRD',      sub: 'Laporan performa rekruitmen', Icon: BarChart3 }
              : { to: '/kpi-approver', label: 'KPI Approval', sub: 'Rekap kecepatan approval',    Icon: TrendingUp },
          ].map(({ to, label, sub, Icon }) => (
            <button key={to} onClick={() => navigate(to)}
              className="card w-full text-left flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center shrink-0">
                <Icon size={20} className="text-sapphire" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-navy text-sm">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Period Picker Modal (shared, createPortal, centered) ── */}
      {showPicker && (
        <PeriodPickerModal
          current={pickerCurrent}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}