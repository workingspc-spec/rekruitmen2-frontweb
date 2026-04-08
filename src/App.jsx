import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <PageLoader message="Menyiapkan sesi..." />
  if (!token)  return <Navigate to="/login" replace />
  return <MainLayout>{children}</MainLayout>
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <PageLoader />
  if (token)   return <Navigate to="/" replace />
  return children
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

      <Route path="/recruitment" element={
        <ProtectedRoute><RecruitmentListPage /></ProtectedRoute>
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

      <Route path="/approval" element={
        <ProtectedRoute><ApprovalListPage /></ProtectedRoute>
      } />

      <Route path="/monitoring" element={
        <ProtectedRoute><SlaStatusListPage /></ProtectedRoute>
      } />
      <Route path="/monitoring/:nomor" element={
        <ProtectedRoute><SlaDetailPage /></ProtectedRoute>
      } />

      <Route path="/kpi-hrd" element={
        <ProtectedRoute><KpiHrdPage /></ProtectedRoute>
      } />
      <Route path="/kpi-approver" element={
        <ProtectedRoute><KpiApproverPage /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}