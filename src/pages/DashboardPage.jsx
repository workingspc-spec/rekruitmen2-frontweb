// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { dashboardApi, recruitmentApi } from '../api/services'
import { formatDate } from '../utils/helpers'
import { StatCard, PageLoader, ErrorBox } from '../components/ui'
import { PeriodPickerModal } from '../components/PeriodPickerModal'
import {
  ClipboardList, CheckSquare, Activity, BarChart3, TrendingUp,
  ChevronRight, CheckCircle2, Calendar, ChevronDown,
  Building2, ShieldCheck, Edit2, AlertTriangle
} from 'lucide-react'
import { useRef } from 'react' // Tambahkan ini
// Import 4 Icon Animasi Baru
import { DashboardIcon } from '../components/icons/DashboardIcon'
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon'
import { CheckSquareIcon } from '../components/icons/CheckSquareIcon'
import { ActivityIcon } from '../components/icons/ActivityIcon'

import { BarChart3Icon } from '../components/icons/BarChart3Icon' // (Pakai '../components/icons/...' di DashboardPage)
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon'

import { AnimatedIcon } from '../components/AnimatedIcon'

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

// ── Shimmer skeleton for a single StatCard ────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="card relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

// ── Shimmer skeleton for a single Quick Menu item ─────────────────────────────
function MenuItemSkeleton() {
  return (
    <div className="w-full flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
      <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-3 w-56 rounded" />
      </div>
      <div className="skeleton w-5 h-5 rounded shrink-0" />
    </div>
  )
}

function QuickMenuButton({ label, sub, Icon, onClick }) {
  const iconRef = useRef(null)
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
      className="w-full text-left flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
        {/* Render icon dengan ref, hapus efek paksa warna dari Lucide agar tidak menghilang */}
        <Icon ref={iconRef} size={22} className="text-slate-400 group-hover:text-sapphire transition-colors" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-[15px]">{label}</p>
        <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={20} className="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
    </button>
  )
}

export default function DashboardPage() {
  const { user, isHrd } = useAuth()
  const navigate        = useNavigate()

  const [period, setPeriod]         = useState('All Time')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    recruitmentApi.syncManual().catch(err => console.warn('Sync failed:', err))
  }, [period])

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

  const navigateToMonitoring = (statusFilter = null, periodFilter = null) => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (periodFilter) params.set('period', periodFilter)
    const query = params.toString()
    navigate(query ? `/monitoring?${query}` : '/monitoring')
  }

  const handlePickerSelect = (val) => {
    setPeriod(val === null ? 'All Time' : val)
    setShowPicker(false)
  }

  const pickerCurrent = period === 'All Time' ? null : period

  const menuItem = (to, label, sub, Icon) => (
    <button
      key={to}
      onClick={() => navigate(to)}
      className="w-full text-left flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-sapphire transition-colors">
        <Icon size={22} className="text-slate-400 group-hover:text-sapphire transition-colors" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-[15px]">{label}</p>
        <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={20} className="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
    </button>
  )

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium">Selamat datang,</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{user?.nama ?? '–'}</h1>
          <p className="text-xs text-sapphire font-bold mt-1.5 uppercase tracking-wider">{user?.bagian ?? ''}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          {/* ALERT 1: Perlu Update */}
          {summaryQ.isLoading ? (
            <div className="skeleton h-9 w-36 rounded-xl" />
          ) : summary?.needUserUpdate > 0 ? (
            <button
              onClick={() => navigateToMonitoring('NEED_USER_UPDATE')}
              className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <AnimatedIcon variant="wiggle"><Edit2 size={14} /></AnimatedIcon>
              <span>{summary.needUserUpdate} Perlu Update</span>
            </button>
          ) : null}

          {/* ALERT 2: Overdue */}
          {!summaryQ.isLoading && summary?.overdueRequests > 0 && (
            <button
              onClick={() => navigateToMonitoring('OVERDUE')}
              className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <AnimatedIcon variant="wiggle"><AlertTriangle size={14} /></AnimatedIcon>
              <span>{summary.overdueRequests} Terlambat</span>
            </button>
          )}

          {/* FILTER KALENDER */}
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm hover:border-sapphire hover:shadow-sm hover:-translate-y-0.5 transition-all ml-auto md:ml-2"
          >
            <Calendar size={15} className="text-sapphire" />
            <span className="text-slate-700 font-semibold text-xs max-w-[120px] truncate">{label}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {statsQ.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : statsQ.isError ? (
        <ErrorBox message="Gagal memuat statistik." onRetry={() => statsQ.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Permintaan"
              value={stats?.totalPermintaan ?? 0}
              icon={ClipboardList}
              color="#0F52BA"
              onClick={() => navigateWithPeriod('/recruitment')}
            />
            <StatCard
              label="Pending Approval"
              value={stats?.pendingApproval ?? 0}
              icon={CheckSquare}
              color="#F57C00"
              alert={stats?.pendingApproval > 0}
              onClick={() => navigateWithPeriod('/approval')}
            />
            <StatCard
              label="SLA Aktif"
              value={summaryQ.isLoading ? '–' : (summary?.activeRequests ?? 0)}
              icon={Activity}
              color="#0F52BA"
              onClick={() => navigate('/monitoring')}
            />
            <StatCard
              label="Selesai Bulan Ini"
              value={summaryQ.isLoading ? '–' : (summary?.completedThisMonth ?? 0)}
              icon={CheckCircle2}
              color="#2E7D32"
              onClick={() => navigateToMonitoring('COMPLETED', 'This month')}
            />
          </div>

          {stats?.legacyCount > 0 && (
            <p className="text-xs text-slate-400 mt-2 px-1">
              * Termasuk <span className="font-semibold">{stats.legacyCount}</span> data dari sistem lama (read-only)
            </p>
          )}
        </>
      )}

      {/* ── Quick Menu ── */}
      <div>
        <p className="text-lg font-bold text-slate-800 mb-3">Menu Utama</p>
        <div className="space-y-3">
          {statsQ.isLoading ? (
            [1, 2, 3, 4].map(i => <MenuItemSkeleton key={i} />)
          ) : (
            [
              { to: '/recruitment', label: 'Permintaan Rekruitmen', sub: 'Buat & kelola permintaan', Icon: ClipboardList },
              { to: '/approval',    label: 'Approval',              sub: 'Setujui permintaan bawahan', Icon: CheckSquare },
              { to: '/monitoring',  label: 'SLA Monitoring',        sub: 'Pantau progress rekruitmen', Icon: Activity },
              isHrd
                ? { to: '/kpi-hrd',      label: 'KPI HRD',      sub: 'Laporan performa rekruitmen', Icon: BarChart3 }
                : { to: '/kpi-approver', label: 'KPI Approval', sub: 'Rekap kecepatan approval',    Icon: TrendingUp },
            ].map(({ to, label, sub, Icon }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full text-left flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-sapphire transition-colors">
                  {/* 👇 BUNGKUS DENGAN ANIMATED ICON 👇 */}
                  <AnimatedIcon variant="scale">
                    <Icon size={22} className="text-slate-400 group-hover:text-sapphire transition-colors" />
                  </AnimatedIcon>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-[15px]">{label}</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Master Data Management — HRD only */}
      {isHrd && (
        <div>
          <p className="text-lg font-bold text-slate-800 mb-3">Manajemen Master Data</p>
          <div className="space-y-3">
            {menuItem('/master/bagian',       'Kelola Bagian / Departemen', 'Tambah, ubah, aktifkan bagian',      Building2)}
            {menuItem('/master/bypass-users', 'Kelola Bypass Users',        'Daftarkan pengguna bypass approval', ShieldCheck)}
          </div>
        </div>
      )}

      {/* ── Period Picker Modal ── */}
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