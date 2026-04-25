// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/services'
import {
  LayoutDashboard, ClipboardList, CheckSquare,
  Activity, BarChart3, LogOut, TrendingUp,
  ChevronLeft, ChevronRight, Building2, ShieldCheck,
} from 'lucide-react'
import { clsx } from 'clsx'

const getNavItems = (isHrd) => [
  { to: '/',            label: 'Dashboard',      Icon: LayoutDashboard, badgeKey: null       },
  { to: '/recruitment', label: 'Rekruitmen',     Icon: ClipboardList,   badgeKey: null       },
  { to: '/approval',    label: 'Approval',       Icon: CheckSquare,     badgeKey: 'approval' },
  { to: '/monitoring',  label: 'SLA Monitoring', Icon: Activity,        badgeKey: 'overdue'  },
  isHrd
    ? { to: '/kpi-hrd',      label: 'KPI HRD',      Icon: BarChart3,   badgeKey: null }
    : { to: '/kpi-approver', label: 'KPI Approval',  Icon: TrendingUp, badgeKey: null },
]

const getMasterItems = () => [
  { to: '/master/bagian',        label: 'Kelola Bagian',       Icon: Building2   },
  { to: '/master/bypass-users',  label: 'Kelola Bypass Users', Icon: ShieldCheck },
]

export default function Sidebar({ isCollapsed, onToggle }) {
  const { user, logout, isHrd } = useAuth()
  const navigate  = useNavigate()
  const initial   = user?.nama?.charAt(0)?.toUpperCase() ?? '?'

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

  const NavItem = ({ to, label, Icon, badgeKey }) => {
    const badgeCount = badgeKey ? (badges[badgeKey] ?? 0) : 0
    return (
      <NavLink
        to={to}
        end={to === '/'}
        title={isCollapsed ? label : undefined}
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600',
            'hover:bg-ice-blue hover:text-sapphire transition-all duration-150 cursor-pointer select-none relative',
            isCollapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-4 py-2.5',
            isActive && 'bg-sapphire text-white hover:bg-sapphire hover:text-white shadow-md'
          )
        }
      >
        <div className="relative shrink-0">
          <Icon size={18} />
          {badgeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-1 ring-white px-0.5 leading-none">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </div>
        {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
      </NavLink>
    )
  }

  return (
    <aside
      className={clsx(
        'h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300 overflow-hidden',
        isCollapsed ? 'w-[64px]' : 'w-60'
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={clsx(
          'py-4 border-b border-slate-100 shrink-0 flex items-center',
          isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo_app.png" alt="Logo PKAR" className="w-9 h-9 object-contain drop-shadow-sm shrink-0" />
            <div className="min-w-0">
              <p className="font-display font-extrabold text-slate-800 text-base leading-tight tracking-tight">PKAR</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rekruitmen</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img src="/logo_app.png" alt="Logo PKAR" className="w-8 h-8 object-contain" />
        )}
        <button
          onClick={onToggle}
          className={clsx(
            'flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0',
            isCollapsed ? 'w-8 h-8 mt-2' : 'w-7 h-7'
          )}
          title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Master Data Section — HRD only */}
        {isHrd && (
          <>
            {!isCollapsed && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-1">
                Master Data
              </p>
            )}
            {isCollapsed && <div className="border-t border-slate-100 my-2 mx-1" />}
            {masterItems.map(item => (
              <NavItem key={item.to} {...item} badgeKey={null} />
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