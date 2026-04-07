import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { recruitmentApi } from '../../api/services'
import { formatDate, getApprovalStatus } from '../../utils/helpers'
import { Badge, EmptyState, PageLoader, ErrorBox, ConfirmDialog, Spinner } from '../../components/ui'
import { Plus, Search, Filter, Trash2, Calendar, Edit2, Eye, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTS = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

export default function RecruitmentListPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => recruitmentApi.list().then(r => r.data.data ?? []),
  })

  const batchDeleteMut = useMutation({
    mutationFn: (nomors) => recruitmentApi.batchDelete({ tpkNomors: nomors }),
    onSuccess: () => {
      toast.success(`${selected.size} permintaan berhasil dihapus.`)
      setSelected(new Set())
      setShowDeleteConfirm(false)
      qc.invalidateQueries({ queryKey: ['my-requests'] })
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal menghapus.'),
  })

  const filtered = useMemo(() => {
    if (!raw) return []
    let list = raw
    if (status === 'pending')  list = list.filter(r => r.tpk_approveatasan === 0 || (r.tpk_approveatasan === 1 && r.tpk_approveHRD === 0))
    if (status === 'approved') list = list.filter(r => r.tpk_approveatasan === 1 && r.tpk_approveHRD === 1)
    if (status === 'rejected') list = list.filter(r => r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2)
    if (search) list = list.filter(r =>
      r.jab_nama.toLowerCase().includes(search.toLowerCase()) ||
      r.tpk_nomor.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [raw, status, search])

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Permintaan Rekruitmen</h1>
          <p className="text-sm text-slate-500 mt-0.5">{raw?.length ?? 0} total permintaan</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/recruitment/new')}>
          <Plus size={17} /> Buat Permintaan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Cari jabatan / nomor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {STATUS_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === o.value ? 'bg-white shadow text-sapphire' : 'text-slate-500'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Hapus ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? <PageLoader /> : isError ? <ErrorBox message="Gagal memuat data." onRetry={refetch} /> : (
        filtered.length === 0 ? (
          <EmptyState message="Tidak ada permintaan yang cocok." icon={Layers} action={() => navigate('/recruitment/new')} actionLabel="Buat Permintaan" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" className="accent-sapphire" onChange={(e) => {
                    if (e.target.checked) {
                      const selectables = filtered.filter(r => isPending(r) && isOwner(r)).map(r => r.tpk_nomor)
                      setSelected(new Set(selectables))
                    } else {
                      setSelected(new Set())
                    }
                  }} /></th>
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
                        <span className={`badge text-xs px-2 py-0.5 rounded-full font-semibold`}
                          style={{
                            background:
                              r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#fef2f2' :
                              r.tpk_approveHRD === 1 ? '#f0fdf4' : '#fff7ed',
                            color:
                              r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#991b1b' :
                              r.tpk_approveHRD === 1 ? '#166534' : '#c2410c',
                          }}>
                          {statusMeta.label}
                        </span>
                        {r.sla_is_editable === 1 && (
                          <span className="ml-1 badge text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fff7ed', color: '#c2410c' }}>
                            Perlu Update
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {r.sla_final_target_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {formatDate(r.sla_final_target_date)}
                          </span>
                        ) : '–'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost p-1.5" title="Detail" onClick={() => navigate(`/recruitment/${encodeURIComponent(r.tpk_nomor)}`)}>
                            <Eye size={15} />
                          </button>
                          {canEdit && (
                            <button className="btn-ghost p-1.5 text-sapphire" title="Edit" onClick={() => navigate(`/recruitment/edit/${encodeURIComponent(r.tpk_nomor)}`)}>
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
        )
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