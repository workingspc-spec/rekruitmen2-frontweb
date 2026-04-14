// src/pages/recruitment/RecruitmentListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { recruitmentApi } from '../../api/services'
import { Badge, EmptyState, PageLoader, ErrorBox, ConfirmDialog, Spinner } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import {
  matchesPeriodFilter,
  periodToLabel,
} from '../../utils/periodFilter'   // ✅ FIX: was '../../src/utils/periodFilter' (wrong path)
import { Plus, Search, Trash2, Calendar, Edit2, Eye, Layers, X, Clock } from 'lucide-react'
import { formatDate, getApprovalStatus, getSlaSourceMeta } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUS_OPTS = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

/**
 * ApprovalChip — chip tanggal approval per approver.
 * Identik Android: ApprovalChip di RecruitmentListScreen.kt
 */
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
  const { user } = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('all')
  const [selected, setSelected]   = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [activePeriodFilter, setActivePeriodFilter] = useState(initialPeriodFilter ?? null)
  const [showPeriodPicker, setShowPeriodPicker]     = useState(false)

  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-requests'],
    queryFn:  () => recruitmentApi.list().then(r => r.data.data ?? []),
  })

  const batchDeleteMut = useMutation({
    mutationFn: (nomors) => recruitmentApi.batchDelete({ tpkNomors: nomors }),
    onSuccess: () => {
      toast.success(`${selected.size} permintaan berhasil dihapus.`)
      setSelected(new Set())
      setShowDeleteConfirm(false)
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal menghapus.'),
  })

  const filtered = useMemo(() => {
    if (!raw) return []
    let list = raw

    // Status filter
    if (status === 'pending')  list = list.filter(r => r.tpk_approveatasan === 0 || (r.tpk_approveatasan === 1 && r.tpk_approveHRD === 0))
    if (status === 'approved') list = list.filter(r => r.tpk_approveatasan === 1 && r.tpk_approveHRD === 1)
    if (status === 'rejected') list = list.filter(r => r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2)

    // Search filter
    if (search) {
      list = list.filter(r =>
        r.jab_nama.toLowerCase().includes(search.toLowerCase()) ||
        r.tpk_nomor.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Period filter (client-side) — menggunakan shared utility
    if (activePeriodFilter) {
      list = list.filter(r => matchesPeriodFilter(r.tpk_tanggal, activePeriodFilter))
    }

    return list
  }, [raw, status, search, activePeriodFilter])

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

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Permintaan Rekruitmen</h1>
          <p className="text-sm text-slate-500 mt-0.5">{raw?.length ?? 0} total permintaan</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/recruitment/new')}>
          <Plus size={17} /> Buat Permintaan
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
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
                status === o.value ? 'bg-white shadow text-sapphire' : 'text-slate-500'
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

        {hasPendingItems && (
          <p className="w-full text-xs text-slate-400 flex items-center gap-1">
            <span>☝️</span> Centang permintaan Pending Atasan untuk menghapus
          </p>
        )}

        {selected.size > 0 && (
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Hapus ({selected.size})
          </button>
        )}
      </div>

      {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
        <p className="text-xs text-sapphire">Difilter dari Dashboard · Tap tanggal untuk ubah</p>
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <PageLoader />
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
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    className="accent-sapphire"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(filtered.filter(r => isPending(r) && isOwner(r)).map(r => r.tpk_nomor)))
                      } else {
                        setSelected(new Set())
                      }
                    }}
                  />
                </th>
                <th>Nomor</th>
                <th>Jabatan</th>
                <th>Bagian</th>
                <th>Tgl Permintaan</th>
                <th>Tgl Butuh</th>
                <th>Status</th>
                <th>Target SLA</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const statusMeta = getApprovalStatus(r.tpk_approveatasan, r.tpk_approveHRD)
                const canSelect  = isPending(r) && isOwner(r)
                const canEdit    = isOwner(r) && (isPending(r) || r.sla_is_editable)
                const isSelected = selected.has(r.tpk_nomor)

                const showAtasanChip = r.tpk_approveatasan === 1 && r.tgl_approve_atasan
                const showHrdChip    = r.tpk_approveHRD === 1    && r.tgl_approve_hrd

                return (
                  <tr key={r.tpk_nomor} className={isSelected ? 'bg-ice-blue/40' : ''}>
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
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            className="btn-icon p-1.5 text-sapphire"
                            title="Edit"
                            onClick={() => navigate(`/recruitment/edit/${encodeURIComponent(r.tpk_nomor)}`)}
                          >
                            <Edit2 size={15} />
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
      )}

      {/* ── Period Picker Modal ── */}
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