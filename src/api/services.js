import api from './axios'

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (body) => api.post('/auth/login', body),
  me:             ()     => api.get('/auth/me'),
  changePassword: (body) => api.post('/auth/change-password', body),
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:   (period) => api.get('/dashboard/stats', { params: { period } }),
  summary: ()       => api.get('/monitoring/dashboard-summary'),
}

// ── MASTER DATA ───────────────────────────────────────────────────────────────
export const masterApi = {
  jabatan:      (search) => api.get('/master/jabatan', { params: { search } }),
  bagian:       (search) => api.get('/master/bagian',  { params: { search } }),
  jabatanRules: ()       => api.get('/recruitment/jabatan-rules'),
}

// ── RECRUITMENT ───────────────────────────────────────────────────────────────
export const recruitmentApi = {
  list:            ()      => api.get('/recruitment/my-requests'),
  detail:          (nomor) => api.get('/recruitment/detail', { params: { nomor } }),
  save:            (body)  => api.post('/recruitment/save', body),
  complete:        (body)  => api.post('/recruitment/complete', body),
  batchDelete:     (body)  => api.delete('/recruitment/batch-delete', { data: body }),
  log:             (nomor) => api.get(`/recruitment/log/${encodeURIComponent(nomor)}`),
  hiredCandidates: (nomor) => api.get(`/recruitment/${encodeURIComponent(nomor)}/hired-candidates`),
  cancelCandidate: (nomor, body) => api.post(`/recruitment/${encodeURIComponent(nomor)}/cancel-candidate`, body),
  setEditable:     (nomor, body) => api.patch(`/recruitment/${encodeURIComponent(nomor)}/editable`, body),
}

// ── APPROVAL ──────────────────────────────────────────────────────────────────
export const approvalApi = {
  listAtasan:   (status) => api.get('/recruitment/approval/atasan', { params: { status } }),
  actionAtasan: (body)   => api.post('/recruitment/approval/atasan/action', body),
  listHrd:      (status) => api.get('/recruitment/approval/hrd', { params: { status } }),
  actionHrd:    (body)   => api.post('/recruitment/approval/hrd/action', body),
}

// ── MONITORING ────────────────────────────────────────────────────────────────
export const monitoringApi = {
  // ✅ FIX: Tambah parameter period agar backend bisa filter completed by month
  slaStatus:   (period) => api.get('/monitoring/sla-status', { params: period ? { period } : {} }),
  slaDetail:   (nomor)  => api.get(`/monitoring/sla-detail/${encodeURIComponent(nomor)}`),
  kpiHrd:      (period) => api.get('/monitoring/kpi-hrd',      { params: { period } }),
  kpiApprover: (period) => api.get('/monitoring/kpi-approver', { params: { period } }),
}