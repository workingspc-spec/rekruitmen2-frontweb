// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ClipboardList, CheckSquare,
  Activity, BarChart3, LogOut, TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'

const getNavItems = (isHrd) => [
  { to: '/',            label: 'Dashboard',      Icon: LayoutDashboard },
  { to: '/recruitment', label: 'Rekruitmen',     Icon: ClipboardList   },
  { to: '/approval',    label: 'Approval',       Icon: CheckSquare     },
  { to: '/monitoring',  label: 'SLA Monitoring', Icon: Activity        },
  isHrd
    ? { to: '/kpi-hrd',      label: 'KPI HRD',  Icon: BarChart3  }
    : { to: '/kpi-approver', label: 'KPI Saya', Icon: TrendingUp },
]

export default function Sidebar() {
  const { user, logout, isHrd } = useAuth()
  const navigate = useNavigate()
  const initial  = user?.nama?.charAt(0)?.toUpperCase() ?? '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    // h-screen: sidebar selalu tepat setinggi viewport, tidak ikut memanjang
    // flex flex-col: agar nav (flex-1) mengisi ruang dan profil selalu di bawah
    <aside className="w-60 h-screen bg-white border-r border-slate-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sapphire to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-display font-bold text-sm">P</span>
          </div>
          <div>
            <p className="font-display font-bold text-navy text-sm leading-tight">PKAR</p>
            <p className="text-xs text-slate-400">Sistem Rekruitmen</p>
          </div>
        </div>
      </div>

      {/* Navigation — flex-1 + overflow-y-auto: scroll jika nav items terlalu banyak */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {getNavItems(isHrd).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active')
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile — shrink-0: tidak pernah tercompress, selalu terlihat di bawah */}
      <div className="px-3 py-4 border-t border-slate-100 shrink-0">
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
          className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}