// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { dashboardApi, recruitmentApi } from '../api/services'
import { formatDate } from '../utils/helpers'
import { StatCard, AlertBanner, PageLoader, ErrorBox } from '../components/ui'
import { PeriodPickerModal } from '../components/PeriodPickerModal'
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
  const navigate        = useNavigate()

  const [period, setPeriod]         = useState('All Time')
  const [showPicker, setShowPicker] = useState(false)

  // 👇 --- TAMBAHKAN KODE INI DI SINI --- 👇
  useEffect(() => {
      // Sync saat dashboard dibuka dan saat period berubah
      // shadow table mungkin stale dari legacy app
      recruitmentApi.syncManual().catch(err => console.warn('Sync failed:', err))
  }, [period]) // ← Masukkan 'period' agar trigger saat dropdown waktu diubah
  // 👆 --------------------------------- 👆

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

  /**
   * Navigate ke halaman dengan meneruskan period filter via query param.
   */
  const navigateWithPeriod = (path) => {
    if (!period || period === 'All Time') {
      navigate(path)
    } else {
      navigate(`${path}?period=${encodeURIComponent(period)}`)
    }
  }

  /**
   * Navigate ke SLA Monitoring dengan filter status + period opsional.
   * Digunakan untuk kartu yang spesifik menampilkan subset data monitoring.
   */
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

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">Selamat datang,</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{user?.nama ?? '–'}</h1>
          <p className="text-xs text-sapphire font-bold mt-1.5 uppercase tracking-wider">{user?.bagian ?? ''}</p>
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm hover:border-sapphire hover:shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <Calendar size={16} className="text-sapphire" />
          <span className="text-slate-700 font-semibold text-xs max-w-[120px] truncate">{label}</span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>

      {/* ── Alert Banners ── */}
      {summary?.needUserUpdate > 0 && (
        <AlertBanner
          type="warning"
          message={
            isHrd
              ? `${summary.needUserUpdate} permintaan perlu update tanggal dari peminta.`
              // ✅ PERUBAHAN: pesan lebih netral dan supervisory untuk non-HRD (bisa Peminta atau Atasan)
              : `${summary.needUserUpdate} permintaan perlu update tanggal target. Pastikan peminta segera memperbarui.`
          }
          // ✅ PERUBAHAN: non-HRD sekarang juga ke monitoring agar Atasan bisa pantau bawahan
          onAction={() => navigate('/monitoring')}
          actionLabel={isHrd ? 'Lihat' : 'Pantau'}
        />
      )}
      {summary?.overdueRequests > 0 && (
        <AlertBanner
          type="error"
          message={`${summary.overdueRequests} permintaan melewati target SLA.`}
          onAction={() => navigateToMonitoring('OVERDUE')}
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
          {/* Kartu Permintaan */}
          <StatCard
            label="Permintaan"
            value={stats?.totalPermintaan ?? 0}
            icon={ClipboardList}
            color="#0F52BA"
            onClick={() => navigateWithPeriod('/recruitment')}
          />
          {/* Kartu Persetujuan */}
          <StatCard
            label="Pending Approval"
            value={stats?.pendingApproval ?? 0}
            icon={CheckSquare}
            color="#F57C00"
            alert={stats?.pendingApproval > 0}
            onClick={() => navigateWithPeriod('/approval')}
          />
          {/* Kartu SLA Aktif — navigasi ke monitoring tanpa filter khusus */}
          <StatCard
            label="SLA Aktif"
            value={summary?.activeRequests ?? 0}
            icon={Activity}
            color="#0F52BA"
            onClick={() => navigate('/monitoring')}
          />
          {/*
           * ✅ FIX: Kartu "Selesai Bulan Ini" harus menavigasi ke monitoring
           * dengan filter status=COMPLETED dan period=This month agar
           * jumlah yang ditampilkan selaras dengan data yang difilter.
           * Identik Android: navigate ke SlaStatusList dengan filter COMPLETED + This month.
           */}
          <StatCard
            label="Selesai Bulan Ini"
            value={summary?.completedThisMonth ?? 0}
            icon={CheckCircle2}
            color="#2E7D32"
            onClick={() => navigateToMonitoring('COMPLETED', 'This month')}
          />
        </div>
      )}

      {/* ── SLA Summary Cards ── */}
      {summary && (
        <div>
          <p className="text-lg font-bold text-slate-800 mb-3">SLA Monitoring</p>
          <div className="grid grid-cols-3 gap-5">
            {[
              {
                label: 'Aktif',
                val: summary.activeRequests,
                color: '#0F52BA',
                onClick: () => navigate('/monitoring'),
              },
              {
                label: 'Terlambat',
                val: summary.overdueRequests,
                color: '#DC2626',
                onClick: () => navigateToMonitoring('OVERDUE'),
              },
              {
                label: 'Perlu Update',
                val: summary.needUserUpdate,
                color: '#F97316',
                onClick: () => navigateToMonitoring('NEED_USER_UPDATE'),
              },
            ].map(({ label, val, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 transition-all duration-300"
              >
                <p className="text-4xl font-black mb-1.5" style={{ color }}>{val}</p>
                <p className="text-sm text-slate-500 font-semibold tracking-wide">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Menu ── */}
      <div>
        <p className="text-lg font-bold text-slate-800 mb-3">Menu Utama</p>
        <div className="space-y-3">
          {[
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
                <Icon size={22} className="text-slate-400 group-hover:text-sapphire transition-colors" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-[15px]">{label}</p>
                <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

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