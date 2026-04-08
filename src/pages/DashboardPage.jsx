// src/pages/DashboardPage.jsx
import React, { useState } from 'react'  // ← PINDAHKAN KE ATAS
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/services'
import { formatDate } from '../utils/helpers'
import { StatCard, AlertBanner, PageLoader, ErrorBox, CardSkeleton } from '../components/ui'
import {
  ClipboardList, CheckSquare, Activity, BarChart3, TrendingUp,
  AlertTriangle, Edit3, ChevronRight, Users, CheckCircle2,
} from 'lucide-react'

function PeriodSelector({ value, onChange }) {
  const opts = [
    { value: 'All Time',    label: 'Semua Waktu' },
    { value: 'This month',  label: 'Bulan Ini' },
    { value: 'Last month',  label: 'Bulan Lalu' },
    { value: 'This year',   label: 'Tahun Ini' },
  ]
  return (
    <select className="input text-xs py-1.5 pr-8 w-auto" value={value} onChange={e => onChange(e.target.value)}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export default function DashboardPage() {
  const { user, isHrd } = useAuth()
  const navigate        = useNavigate()

  const [period, setPeriod] = React.useState('All Time')

  const statsQ   = useQuery({ queryKey: ['dashboard-stats', period], queryFn: () => dashboardApi.stats(period).then(r => r.data.data) })
  const summaryQ = useQuery({ queryKey: ['dashboard-summary'], queryFn: () => dashboardApi.summary().then(r => r.data.data) })

  const stats   = statsQ.data
  const summary = summaryQ.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">Selamat datang,</p>
          <h1 className="page-title">{user?.nama ?? '–'}</h1>
          <p className="text-xs text-sapphire font-semibold mt-0.5">{user?.bagian ?? ''}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Alert banners */}
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

      {/* Stats grid */}
      {statsQ.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card"><div className="skeleton h-16 w-full" /></div>)}
        </div>
      ) : statsQ.isError ? (
        <ErrorBox message="Gagal memuat statistik." onRetry={() => statsQ.refetch()} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Permintaan"
            value={stats?.totalPermintaan ?? 0}
            icon={ClipboardList}
            color="#0F52BA"
            onClick={() => navigate('/recruitment')}
          />
          <StatCard
            label="Pending Approval"
            value={stats?.pendingApproval ?? 0}
            icon={CheckSquare}
            color="#F57C00"
            alert={stats?.pendingApproval > 0}
            onClick={() => navigate('/approval')}
          />
          <StatCard
            label="SLA Aktif"
            value={summary?.activeRequests ?? 0}
            icon={Activity}
            color="#0F52BA"
            onClick={() => navigate('/monitoring')}
          />
          <StatCard
            label="Selesai Bulan Ini"
            value={summary?.completedThisMonth ?? 0}
            icon={CheckCircle2}
            color="#2E7D32"
            onClick={() => navigate('/monitoring')}
          />
        </div>
      )}

      {/* SLA Summary Cards */}
      {summaryQ.data && (
        <div>
          <p className="section-title">SLA Monitoring</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Aktif',       val: summary.activeRequests,    color: '#0F52BA' },
              { label: 'Terlambat',   val: summary.overdueRequests,   color: '#D32F2F' },
              { label: 'Perlu Update',val: summary.needUserUpdate,    color: '#F57C00' },
            ].map(({ label, val, color }) => (
              <button
                key={label}
                onClick={() => navigate('/monitoring')}
                className="card text-center hover:shadow-card-hover transition-shadow"
              >
                <p className="text-2xl font-display font-black" style={{ color }}>{val}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick menus */}
      <div>
        <p className="section-title">Menu Utama</p>
        <div className="space-y-2">
          {[
            { to: '/recruitment', label: 'Permintaan Rekruitmen', sub: 'Buat & kelola permintaan', Icon: ClipboardList },
            { to: '/approval',    label: 'Approval',              sub: 'Setujui permintaan bawahan', Icon: CheckSquare },
            { to: '/monitoring',  label: 'SLA Monitoring',        sub: 'Pantau progress rekruitmen', Icon: Activity },
            isHrd
              ? { to: '/kpi-hrd',      label: 'KPI HRD',        sub: 'Laporan performa rekruitmen', Icon: BarChart3 }
              : { to: '/kpi-approver', label: 'KPI Approval',   sub: 'Rekap kecepatan approval',    Icon: TrendingUp },
          ].map(({ to, label, sub, Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="card w-full text-left flex items-center gap-4 hover:shadow-card-hover transition-shadow"
            >
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
    </div>
  )
}

