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

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <PageLoader message="Menyiapkan sesi..." />
  if (!token)  return <Navigate to="/login" replace />
  return <MainLayout>{children}</MainLayout>
}

function HrdRoute({ children }) {
  const { token, loading, isHrd } = useAuth()
  if (loading) return <PageLoader />
  if (!token)  return <Navigate to="/login" replace />
  if (!isHrd)  return <Navigate to="/" replace />
  return <MainLayout>{children}</MainLayout>
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <PageLoader />
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
        <ProtectedRoute><KpiHrdPage /></ProtectedRoute>
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