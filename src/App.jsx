// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './components/MainLayout'
import { PageLoader } from './components/ui'

// Pages
import LoginPage              from './pages/LoginPage'
import DashboardPage          from './pages/DashboardPage'
import RecruitmentListPage    from './pages/recruitment/RecruitmentListPage'
import RecruitmentFormPage    from './pages/recruitment/RecruitmentFormPage'
import RecruitmentDetailPage  from './pages/recruitment/RecruitmentDetailPage'
import ApprovalListPage       from './pages/approval/ApprovalListPage'
import SlaStatusListPage      from './pages/monitoring/SlaStatusListPage'
import SlaDetailPage          from './pages/monitoring/SlaDetailPage'
import KpiHrdPage             from './pages/monitoring/KpiHrdPage'
import KpiApproverPage        from './pages/monitoring/KpiApproverPage'
import BagianMasterPage       from './pages/master/BagianMasterPage'
import BypassUserPage         from './pages/master/BypassUserPage'

// ── Skeleton layout yang tampil saat sesi sedang diverifikasi ─────────────────
// Menggantikan PageLoader spinner agar transisi lebih halus dan tidak ada "kedip dua fase"
function AppLoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar skeleton */}
      <aside className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col shrink-0">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl">
              <div className="skeleton w-5 h-5 rounded shrink-0" />
              <div className="skeleton h-4 flex-1 rounded" />
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="skeleton w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          </div>
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-8 w-52 rounded" />
            <div className="skeleton h-3.5 w-36 rounded" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-7 w-12 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Menu items */}
          <div className="space-y-1.5">
            <div className="skeleton h-5 w-28 rounded mb-3" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-5 shadow-card">
                <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-44 rounded" />
                  <div className="skeleton h-3 w-56 rounded" />
                </div>
                <div className="skeleton w-5 h-5 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { token, loading, user } = useAuth()

  if (loading) {
    // Returning user: sessionStorage already has user data → render layout
    // immediately so only the page's own skeleton shows (no double shimmer).
    // First-ever load: no cached user → show the full skeleton while /auth/me runs.
    return user
      ? <MainLayout>{children}</MainLayout>
      : <AppLoadingSkeleton />
  }

  if (!token) return <Navigate to="/login" replace />
  return <MainLayout>{children}</MainLayout>
}

function HrdRoute({ children }) {
  const { token, loading, isHrd, user } = useAuth()

  if (loading) {
    return (user && isHrd)
      ? <MainLayout>{children}</MainLayout>
      : <AppLoadingSkeleton />
  }

  if (!token)  return <Navigate to="/login" replace />
  if (!isHrd)  return <Navigate to="/" replace />
  return <MainLayout>{children}</MainLayout>
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <PageLoader />   // Login page tetap pakai spinner minimal
  if (token)   return <Navigate to="/" replace />
  return children
}

function RecruitmentListWrapper() {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') || undefined
  return <RecruitmentListPage initialPeriodFilter={period} />
}

function ApprovalListWrapper() {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') || undefined
  return <ApprovalListPage initialPeriodFilter={period} />
}

function MonitoringListWrapper() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') || undefined
  const period = searchParams.get('period') || undefined
  return <SlaStatusListPage initialStatusFilter={status} initialPeriodFilter={period} />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />

      {/* Recruitment */}
      <Route path="/recruitment" element={
        <ProtectedRoute><RecruitmentListWrapper /></ProtectedRoute>
      } />
      <Route path="/recruitment/new" element={
        <ProtectedRoute><RecruitmentFormPage /></ProtectedRoute>
      } />
      <Route path="/recruitment/edit/:nomor" element={
        <ProtectedRoute><RecruitmentFormPage /></ProtectedRoute>
      } />
      <Route path="/recruitment/:nomor" element={
        <ProtectedRoute><RecruitmentDetailPage /></ProtectedRoute>
      } />

      {/* Approval */}
      <Route path="/approval" element={
        <ProtectedRoute><ApprovalListWrapper /></ProtectedRoute>
      } />

      {/* Monitoring */}
      <Route path="/monitoring" element={
        <ProtectedRoute><MonitoringListWrapper /></ProtectedRoute>
      } />
      <Route path="/monitoring/:nomor" element={
        <ProtectedRoute><SlaDetailPage /></ProtectedRoute>
      } />

      {/* KPI */}
      <Route path="/kpi-hrd" element={
        <HrdRoute><KpiHrdPage /></HrdRoute>
      } />
      <Route path="/kpi-approver" element={
        <ProtectedRoute><KpiApproverPage /></ProtectedRoute>
      } />

      {/* Master Data — HRD only */}
      <Route path="/master/bagian" element={
        <HrdRoute><BagianMasterPage /></HrdRoute>
      } />
      <Route path="/master/bypass-users" element={
        <HrdRoute><BypassUserPage /></HrdRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}