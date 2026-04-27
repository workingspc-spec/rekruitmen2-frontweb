// src/components/Sidebar.jsx
import React, { useRef } from 'react'  // ← add React import
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
// NavItem is defined at MODULE SCOPE — outside Sidebar — so React sees the
// same component type across every Sidebar render. Defining it inside Sidebar
// creates a new function reference each render → React remounts every nav item
// → useRef is reset → icon animations never fire.
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
          'flex items-center rounded-xl text-sm font-medium text-slate-600',
          'hover:bg-ice-blue hover:text-sapphire transition-all duration-150 cursor-pointer select-none relative',
          isCollapsed ? 'justify-center w-11 h-11 mx-auto mb-1.5' : 'gap-3 px-4 py-2.5 mb-0.5',
          isActive && 'bg-sapphire text-white hover:bg-sapphire hover:text-white shadow-md'
        )
      }
    >
      <div className="relative shrink-0 group flex items-center justify-center z-10">
        <Icon ref={iconRef} size={20} className="transition-colors" />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-1 ring-white px-0.5 leading-none z-10">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      <span
        className={clsx(
          'truncate transition-all duration-300 ease-in-out',
          isCollapsed ? 'opacity-0 w-0 -translate-x-4 hidden' : 'opacity-100 flex-1 translate-x-0'
        )}
      >
        {label}
      </span>
    </NavLink>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component
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
        'h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-500 ease-in-out overflow-hidden relative',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={clsx(
          'py-5 border-b border-slate-100 shrink-0 flex items-center transition-all duration-500 ease-in-out',
          isCollapsed ? 'px-0 justify-center' : 'px-5 justify-between'
        )}
      >
        <button
          onClick={onToggle}
          className={clsx(
            'flex items-center outline-none transition-all duration-300 hover:scale-105 active:scale-95',
            isCollapsed ? 'justify-center w-full' : 'gap-3 min-w-0'
          )}
          title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          <img
            src="/logo_app.png"
            alt="Logo PKAR"
            className={clsx(
              'object-contain drop-shadow-sm shrink-0 transition-all duration-500',
              isCollapsed ? 'w-9 h-9' : 'w-10 h-10'
            )}
          />
          <div className={clsx(
            'text-left transition-all duration-300 ease-in-out',
            isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 min-w-0'
          )}>
            <p className="font-display font-extrabold text-slate-800 text-base leading-tight tracking-tight">PKAR</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rekruitmen</p>
          </div>
        </button>

        <button
          onClick={onToggle}
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 transition-all duration-300',
            isCollapsed ? 'opacity-0 scale-0 w-0 absolute right-0' : 'opacity-100 scale-100 ml-2'
          )}
          title="Ciutkan sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} badges={badges} isCollapsed={isCollapsed} />
        ))}

        {isHrd && (
          <>
            {!isCollapsed && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-1">
                Master Data
              </p>
            )}
            {isCollapsed && <div className="border-t border-slate-200 my-2 mx-auto w-8" />}
            {masterItems.map(item => (
              <NavItem key={item.to} {...item} badgeKey={null} badges={badges} isCollapsed={isCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="px-2 py-4 border-t border-slate-100 shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-ice-blue flex items-center justify-center shrink-0">
                <span className="text-sapphire font-bold text-sm">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{user?.nama}</p>
                <p className="text-xs text-slate-400">{isHrd ? 'HRD' : 'Manager'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
            >
              <LogOut size={17} />
              <span>Keluar</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-ice-blue flex items-center justify-center" title={user?.nama}>
              <span className="text-sapphire font-bold text-sm">{initial}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Keluar"
            >
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}