// src/components/Sidebar.jsx
import React, { useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/services'
import { LogOut, ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { DashboardIcon } from './icons/DashboardIcon'
import { ClipboardListIcon } from './icons/ClipboardListIcon'
import { CheckSquareIcon } from './icons/CheckSquareIcon'
import { ActivityIcon } from './icons/ActivityIcon'
import { BarChart3Icon } from './icons/BarChart3Icon'
import { TrendingUpIcon } from './icons/TrendingUpIcon'
import { Building2Icon } from './icons/Building2Icon'
import { ShieldCheckIcon } from './icons/ShieldCheckIcon'

const getNavItems = (isHrd) => [
  { to: '/',            label: 'Dashboard',      Icon: DashboardIcon,     badgeKey: null       },
  { to: '/recruitment', label: 'Rekruitmen',     Icon: ClipboardListIcon, badgeKey: null       },
  { to: '/approval',    label: 'Approval',       Icon: CheckSquareIcon,   badgeKey: 'approval' },
  { to: '/monitoring',  label: 'SLA Monitoring', Icon: ActivityIcon,      badgeKey: 'overdue'  },
  isHrd
    ? { to: '/kpi-hrd',      label: 'KPI HRD',      Icon: BarChart3Icon,  badgeKey: null }
    : { to: '/kpi-approver', label: 'KPI Approval', Icon: TrendingUpIcon, badgeKey: null },
]

const getMasterItems = () => [
  { to: '/master/bagian',        label: 'Kelola Bagian',       Icon: Building2Icon   },
  { to: '/master/bypass-users',  label: 'Kelola Bypass Users', Icon: ShieldCheckIcon },
]

// ─────────────────────────────────────────────────────────────────────────────
// ATURAN ANIMASI SMOOTH — hanya ubah property yang NUMERIC dan INTERPOLATABLE:
//   ✅ padding, gap, max-width, max-height, opacity, background-color
//   ❌ width: auto → px  (tidak bisa diinterpolasi browser)
//   ❌ justify-content    (bukan animatable CSS property)
//   ❌ display: hidden    (instan, memotong semua transition)
//
// Centering icon saat collapsed pakai padding matematika:
//   nav px-2 (8px) → NavLink width = 72-16 = 56px saat collapsed
//   Icon 20px → padding tiap sisi = (56-20)/2 = 18px → px-[18px] ✓
// ─────────────────────────────────────────────────────────────────────────────
const NavItem = React.memo(function NavItem({ to, label, Icon, badgeKey, badges, isCollapsed }) {
  const badgeCount = badgeKey ? (badges[badgeKey] ?? 0) : 0
  const iconRef = useRef(null)

  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={isCollapsed ? label : undefined}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
      className={({ isActive }) =>
        clsx(
          // ✅ Tidak ada w-11/h-11/mx-auto — hanya padding & gap yang berubah
          'flex items-center rounded-xl text-sm font-medium text-slate-600 mb-1',
          'hover:bg-ice-blue hover:text-sapphire select-none relative cursor-pointer',
          'transition-all duration-300 ease-door',
          isCollapsed
            ? 'px-[18px] py-2.5 gap-0'
            : 'px-4      py-2.5 gap-3',
          isActive && 'bg-sapphire text-white hover:bg-sapphire hover:text-white shadow-md'
        )
      }
    >
      <div className="relative shrink-0 flex items-center justify-center z-10">
        <Icon ref={iconRef} size={20} className="transition-colors duration-150" />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-1 ring-white px-0.5 leading-none z-10">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>

      {/* Label: max-w 0↔160px + opacity. TANPA hidden/display:none */}
      <span
        className={clsx(
          'whitespace-nowrap overflow-hidden leading-none',
          isCollapsed
            ? 'max-w-0      opacity-0   transition-all duration-150 ease-in'
            : 'max-w-[160px] opacity-100 transition-all duration-250 delay-100 ease-out'
        )}
      >
        {label}
      </span>
    </NavLink>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ isCollapsed, onToggle }) {
  const { user, logout, isHrd } = useAuth()
  const navigate = useNavigate()
  const initial  = user?.nama?.charAt(0)?.toUpperCase() ?? '?'

  const { data: stats } = useQuery({
    queryKey: ['sidebar-stats'],
    queryFn:  () => dashboardApi.stats().then(r => r.data.data),
    refetchInterval: 120_000,
    staleTime:       60_000,
  })
  const { data: summary } = useQuery({
    queryKey: ['sidebar-summary'],
    queryFn:  () => dashboardApi.summary().then(r => r.data.data),
    refetchInterval: 120_000,
    staleTime:       60_000,
  })

  const badges = {
    approval: stats?.pendingApproval ?? 0,
    overdue:  (summary?.overdueRequests ?? 0) + (summary?.needUserUpdate ?? 0),
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems    = getNavItems(isHrd)
  const masterItems = getMasterItems()

  return (
    <aside
      className={clsx(
        'h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-hidden relative',
        // transition-[width]: hanya animasi lebar, tidak ganggu properti lain
        'transition-[width] duration-300 ease-door',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >

      {/* ── Logo + Toggle ───────────────────────────────────────────── */}
      {/*
        ✅ KRITIS: Hapus justify-between ↔ justify-center.
        justify-content TIDAK bisa di-transition → langsung berubah → visual flash.
        Ganti dengan px-4 tetap di semua state. Logo di kiri, chevron fade via max-w.
      */}
      <div className="py-5 px-4 border-b border-slate-100 shrink-0 flex items-center">

        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 outline-none
                     hover:scale-105 active:scale-95 transition-transform duration-150"
          title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          <img
            src="/logo_app.png"
            alt="Logo PKAR"
            className={clsx(
              'object-contain drop-shadow-sm shrink-0 transition-all duration-300',
              isCollapsed ? 'w-9 h-9' : 'w-10 h-10'
            )}
          />

          {/* Teks logo: max-w 0↔160px, TANPA hidden */}
          <div
            className={clsx(
              'text-left overflow-hidden whitespace-nowrap min-w-0',
              isCollapsed
                ? 'max-w-0      opacity-0   transition-all duration-150 ease-in'
                : 'max-w-[160px] opacity-100 transition-all duration-250 delay-100 ease-out'
            )}
          >
            <p className="font-display font-extrabold text-slate-800 text-base leading-tight tracking-tight">PKAR</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rekruitmen</p>
          </div>
        </button>

        {/* Chevron: max-w 0↔36px, TANPA hidden */}
        <div
          className={clsx(
            'overflow-hidden shrink-0',
            isCollapsed
              ? 'max-w-0   opacity-0   transition-all duration-150 ease-in'
              : 'max-w-[36px] opacity-100 transition-all duration-250 delay-100 ease-out'
          )}
        >
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-7 h-7 ml-1 rounded-lg
                       text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
            title="Ciutkan sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} badges={badges} isCollapsed={isCollapsed} />
        ))}

        {isHrd && (
          <>
            {/* "Master Data" label: max-h 0↔48px */}
            <div
              className={clsx(
                'overflow-hidden',
                isCollapsed
                  ? 'max-h-0  opacity-0   transition-all duration-150 ease-in'
                  : 'max-h-12 opacity-100 transition-all duration-250 delay-100 ease-out'
              )}
            >
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-1">
                Master Data
              </p>
            </div>

            {/* Divider (hanya collapsed): kebalikan dari label di atas */}
            <div
              className={clsx(
                'overflow-hidden',
                isCollapsed
                  ? 'max-h-8 opacity-100 transition-all duration-250 delay-100 ease-out'
                  : 'max-h-0 opacity-0  transition-all duration-150 ease-in'
              )}
            >
              <div className="border-t border-slate-200 my-2 mx-auto w-8" />
            </div>

            {masterItems.map(item => (
              <NavItem key={item.to} {...item} badgeKey={null} badges={badges} isCollapsed={isCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* ── User profile ────────────────────────────────────────────── */}
      <div className="px-2 py-4 border-t border-slate-100 shrink-0">

        {/*
          Avatar row: px-3 konstan (12px tiap sisi).
          Collapsed: 72-16(nav)-24(px-3×2) = 32px → avatar 32px → centered ✓
          gap transisi 0↔3 (gap adalah animatable CSS property)
        */}
        <div
          className={clsx(
            'flex items-center py-2 mb-1 rounded-xl px-3 min-w-0',
            'transition-all duration-300 ease-door',
            isCollapsed ? 'gap-0' : 'gap-3'
          )}
        >
          <div
            className="w-8 h-8 rounded-full bg-ice-blue flex items-center justify-center shrink-0"
            title={isCollapsed ? user?.nama : undefined}
          >
            <span className="text-sapphire font-bold text-sm">{initial}</span>
          </div>

          <div
            className={clsx(
              'overflow-hidden whitespace-nowrap min-w-0',
              isCollapsed
                ? 'max-w-0      opacity-0   transition-all duration-150 ease-in'
                : 'max-w-[160px] opacity-100 transition-all duration-250 delay-100 ease-out'
            )}
          >
            <p className="text-sm font-semibold text-navy truncate">{user?.nama}</p>
            <p className="text-xs text-slate-400">{isHrd ? 'HRD' : 'Manager'}</p>
          </div>
        </div>

        {/*
          Logout: pola identik dengan NavItem.
          Icon 17px → (56-17)/2 ≈ 19.5 → px-[19px] untuk centering
        */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Keluar' : undefined}
          className={clsx(
            'flex items-center w-full rounded-xl text-sm font-medium text-red-500',
            'hover:bg-red-50 hover:text-red-600 cursor-pointer',
            'transition-all duration-300 ease-door',
            isCollapsed
              ? 'px-[19px] py-2.5 gap-0'
              : 'px-4      py-2.5 gap-3'
          )}
        >
          <LogOut size={17} className="shrink-0" />
          <span
            className={clsx(
              'whitespace-nowrap overflow-hidden',
              isCollapsed
                ? 'max-w-0      opacity-0   transition-all duration-150 ease-in'
                : 'max-w-[120px] opacity-100 transition-all duration-250 delay-100 ease-out'
            )}
          >
            Keluar
          </span>
        </button>
      </div>
    </aside>
  )
}