// src/pages/recruitment/RecruitmentListPage.jsx
// [SECURITY] Changes:
//   - console.warn('Background sync failed') → logger.warn(...)
//   - batchDeleteMut onError: e.response?.data?.message → sanitizeApiError(e, ...)
// [UX] Changes:
//   - Tambah persistensi filter state saat back navigation (useNavigationType)
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useNavigationType } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { recruitmentApi } from '../../api/services'
import {
  Badge, EmptyState, ErrorBox, ConfirmDialog, Spinner,
  RecruitmentTableSkeleton,
} from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import { matchesPeriodFilter, periodToLabel } from '../../utils/periodFilter'
import { Plus, Search, Trash2, Calendar, Edit2, Eye, Layers, X, Clock } from 'lucide-react'
import { formatDate, getApprovalStatus, getSlaSourceMeta } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { AnimatedIcon } from '../../components/AnimatedIcon'
// ✅ [SECURITY] Import logger dan sanitizeApiError
import logger from '../../utils/logger'
import { sanitizeApiError } from '../../utils/security'

const STATUS_OPTS = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

const ITEMS_PER_PAGE = 15
const STORAGE_KEY    = 'filters:/recruitment'

function ApprovalChip({ label, date }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
      <Clock size={11} className="text-green-600 shrink-0" />
      <span className="text-xs font-semibold text-green-700">{label}</span>
      <span className="text-xs text-green-500">({formatDate(date)})</span>
    </div>
  )
}

export default function RecruitmentListPage({ initialPeriodFilter = null }) {
  const { user }         = useAuth()
  const navigate         = useNavigate()
  const qc               = useQueryClient()
  const navigationType   = useNavigationType() // 'POP' = back/forward, 'PUSH' = fresh nav

  // ── Filter State Persistence ───────────────────────────────────────────────
  // Saat back navigation (POP), pulihkan filter dari sessionStorage.
  // Saat navigasi fresh (PUSH/REPLACE) atau ada initialPeriodFilter dari URL, mulai bersih.
  const _saved = useMemo(() => {
    if (navigationType !== 'POP' || initialPeriodFilter !== null) return null
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    } catch { return null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // hanya saat mount

  const [search, setSearch]     = useState(_saved?.search ?? '')
  const [status, setStatus]     = useState(_saved?.status ?? 'all')
  const [selected, setSelected] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [activePeriodFilter, setActivePeriodFilter] = useState(
    initialPeriodFilter ?? _saved?.period ?? null
  )
  const [showPeriodPicker, setShowPeriodPicker] = useState(false)

  // Simpan filter ke sessionStorage setiap kali berubah
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        search, status, period: activePeriodFilter,
      }))
    } catch { /* silent */ }
  }, [search, status, activePeriodFilter])
  // ── End Filter State Persistence ──────────────────────────────────────────

  useEffect(() => {
    // ✅ [SECURITY] console.warn → logger.warn (silent in production)
    recruitmentApi.syncManual().catch(err => logger.warn('Background sync failed:', err))
  }, [])

  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-requests'],
    queryFn:  () => recruitmentApi.list().then(r => r.data.data ?? []),
  })

  const batchDeleteMut = useMutation({
    mutationFn: (nomors) => recruitmentApi.batchDelete({ tpkNomors: nomors }),
    onSuccess: async () => {
      await recruitmentApi.syncManual()
      toast.success(`${selected.size} permintaan berhasil dihapus.`)
      setSelected(new Set())
      setShowDeleteConfirm(false)
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
    // ✅ [SECURITY] sanitizeApiError — cegah SQL/stack trace bocor ke toast
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal menghapus.')),
  })

  const filtered = useMemo(() => {
    if (!raw) return []
    let list = raw

    if (status === 'pending') list = list.filter(r =>
      r.tpk_approveatasan !== 2 &&
      r.tpk_approveHRD !== 2 &&
      r.tpk_approveHRD !== 1
    )
    if (status === 'approved') list = list.filter(r => r.tpk_approveatasan === 1 && r.tpk_approveHRD === 1)
    if (status === 'rejected') list = list.filter(r => r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2)

    if (search) {
      list = list.filter(r =>
        r.jab_nama.toLowerCase().includes(search.toLowerCase()) ||
        r.tpk_nomor.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (activePeriodFilter) {
      list = list.filter(r => matchesPeriodFilter(r.tpk_tanggal, activePeriodFilter))
    }

    return list
  }, [raw, status, search, activePeriodFilter])

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems
  } = usePagination(filtered, ITEMS_PER_PAGE)

  useEffect(() => {
    setSelected(new Set())
  }, [currentPage])

  const toggleSelect = (nomor, isDraft) => {
    if (!isDraft) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(nomor) ? next.delete(nomor) : next.add(nomor)
      return next
    })
  }

  const isPending = r => r.tpk_approveatasan === 0 && r.tpk_approveHRD === 0
  const isOwner   = r => r.tpk_peminta?.trim() === user?.kode

  const hasPendingItems = raw?.some(r => isPending(r) && isOwner(r))

  const selectableOnPage = paginatedData.filter(
    r => isPending(r) && isOwner(r) && !r.is_legacy
  )

  const allCurrentPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every(r => selected.has(r.tpk_nomor))

  return (
    <div className="space-y-5">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title">Permintaan Rekruitmen</h1>
            <p className="text-sm text-slate-500 mt-0.5">{raw?.length ?? 0} total permintaan</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/recruitment/new')}>
            <AnimatedIcon variant="scale">
              <Plus size={17} />
            </AnimatedIcon>
            Buat Permintaan
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center mt-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Cari jabatan / nomor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {STATUS_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setStatus(o.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === o.value ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPeriodPicker(true)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-colors ${
              activePeriodFilter
                ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sapphire'
            }`}
          >
            <Calendar size={13} />
            <span className="max-w-[100px] truncate">{periodToLabel(activePeriodFilter)}</span>
            {activePeriodFilter && (
              <X size={12} onClick={(e) => { e.stopPropagation(); setActivePeriodFilter(null) }} />
            )}
          </button>

          {selected.size > 0 && (
            <button className="btn-danger flex items-center gap-2" onClick={() => setShowDeleteConfirm(true)}>
              <AnimatedIcon variant="wiggle">
                <Trash2 size={16} />
              </AnimatedIcon>
              Hapus ({selected.size})
            </button>
          )}
        </div>

        {hasPendingItems && (
          <p className="w-full text-xs text-slate-400 flex items-center gap-1 mt-3">
            <span>☝️</span> Centang permintaan Pending Atasan untuk menghapus.{' '}
            <span className="italic opacity-80">(Permintaan yang dibuat di sistem lama tidak dapat dihapus)</span>
          </p>
        )}
      </div>

      {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
        <p className="text-xs text-sapphire">Difilter dari Dashboard · Tap tanggal untuk ubah</p>
      )}

      {/* ── CONTENT ── */}
      {isLoading ? (
        <RecruitmentTableSkeleton rows={8} />
      ) : isError ? (
        <ErrorBox message="Gagal memuat data." onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            activePeriodFilter
              ? `Tidak ada permintaan pada periode: ${periodToLabel(activePeriodFilter)}`
              : 'Tidak ada permintaan yang cocok.'
          }
          icon={Layers}
          action={() => navigate('/recruitment/new')}
          actionLabel="Buat Permintaan"
        />
      ) : (
        <div className="space-y-3">
          <div className="table-wrapper relative">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-8 sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <input
                      type="checkbox"
                      className="accent-sapphire"
                      checked={allCurrentPageSelected}
                      disabled={selectableOnPage.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(new Set(selectableOnPage.map(r => r.tpk_nomor)))
                        } else {
                          setSelected(new Set())
                        }
                      }}
                    />
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Nomor</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Jabatan</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Bagian</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Tgl Permintaan</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Tgl Butuh</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Status</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Target SLA</th>
                  <th className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(r => {
                  const statusMeta = getApprovalStatus(r.tpk_approveatasan, r.tpk_approveHRD)
                  const canSelect = isPending(r) && isOwner(r) && !r.is_legacy
                  const canEdit   = isOwner(r) && !r.is_legacy && (isPending(r) || r.sla_is_editable)
                  const isSelected = selected.has(r.tpk_nomor)

                  const showAtasanChip = r.tpk_approveatasan === 1 && r.tgl_approve_atasan
                  const showHrdChip    = r.tpk_approveHRD === 1    && r.tgl_approve_hrd

                  return (
                    <tr key={r.tpk_nomor} className={isSelected ? 'bg-ice-blue/40' : 'hover:bg-slate-50 transition-colors'}>
                      <td>
                        <input
                          type="checkbox"
                          className="accent-sapphire"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={() => toggleSelect(r.tpk_nomor, canSelect)}
                        />
                      </td>
                      <td className="font-mono text-xs text-slate-500 whitespace-nowrap">{r.tpk_nomor}</td>
                      <td className="font-semibold text-navy">{r.jab_nama}</td>
                      <td>{r.tpk_bagian}</td>
                      <td className="whitespace-nowrap">{formatDate(r.tpk_tanggal)}</td>
                      <td className="whitespace-nowrap">{formatDate(r.tpk_tgl_butuh)}</td>

                      <td>
                        <span
                          className="badge text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#fef2f2'
                              : r.tpk_approveHRD === 1 ? '#f0fdf4' : '#fff7ed',
                            color: r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#991b1b'
                              : r.tpk_approveHRD === 1 ? '#166534' : '#c2410c',
                          }}
                        >
                          {statusMeta.label}
                        </span>

                        {r.is_legacy === 1 && (
                          <div className="mt-1">
                            <span className="badge text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: '#f1f5f9', color: '#64748b' }}>
                              📁 Sistem Lama
                            </span>
                          </div>
                        )}

                        {(showAtasanChip || showHrdChip) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {showAtasanChip && <ApprovalChip label="Atasan ✓" date={r.tgl_approve_atasan} />}
                            {showHrdChip    && <ApprovalChip label="HRD ✓"    date={r.tgl_approve_hrd}    />}
                          </div>
                        )}

                        {r.sla_is_editable === 1 && (
                          <div className="flex items-center gap-1.5 mt-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
                            <Edit2 size={12} className="text-orange-500 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-orange-600 leading-tight">HRD Minta Update Tanggal</p>
                              <p className="text-xs text-slate-400 leading-tight">Tap Edit untuk mengubah tanggal</p>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap text-xs">
                        {r.sla_final_target_date ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {formatDate(r.sla_final_target_date)}
                            </span>
                            {r.sla_source && (() => {
                              const meta = getSlaSourceMeta(r.sla_source)
                              return (
                                <span
                                  className="text-xs font-medium px-1.5 py-0.5 rounded w-fit"
                                  style={{ background: meta.bg, color: meta.text }}
                                >
                                  {meta.label}
                                </span>
                              )
                            })()}
                          </div>
                        ) : '–'}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn-icon p-1.5"
                            title="Detail"
                            onClick={() => navigate(`/recruitment/${encodeURIComponent(r.tpk_nomor)}`)}
                          >
                            <AnimatedIcon variant="scale">
                              <Eye size={15} />
                            </AnimatedIcon>
                          </button>
                          {canEdit && (
                            <button
                              className="btn-icon p-1.5 text-sapphire"
                              title="Edit"
                              onClick={() => navigate(`/recruitment/edit/${encodeURIComponent(r.tpk_nomor)}`)}
                            >
                              <AnimatedIcon variant="scale">
                                <Edit2 size={15} />
                              </AnimatedIcon>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {showPeriodPicker && (
        <PeriodPickerModal
          current={activePeriodFilter}
          onSelect={(val) => { setActivePeriodFilter(val); setShowPeriodPicker(false) }}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => batchDeleteMut.mutate([...selected])}
        title={`Hapus ${selected.size} Permintaan?`}
        message="Permintaan yang dihapus tidak dapat dikembalikan. Hanya permintaan yang belum disetujui atasan yang akan dihapus."
        confirmText="Ya, Hapus"
        danger
        loading={batchDeleteMut.isPending}
      />
    </div>
  )
}