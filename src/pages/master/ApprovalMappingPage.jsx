import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../api/services'
import { ErrorBox, EmptyState, Spinner } from '../../components/ui'
import { GitMerge, Plus, Trash2, ToggleLeft, ToggleRight, Building2, User, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { sanitizeApiError } from '../../utils/security'
import { AnimatedIcon } from '../../components/AnimatedIcon'

export default function ApprovalMappingPage() {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)   // ID item yang sedang diedit
  const [editNik, setEditNik] = useState('')          // NIK sementara saat edit

  const { data: raw = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['approval-mapping'],
    queryFn: () => masterApi.getApprovalMapping().then(r => r.data.data ?? []),
  })

  const { data: bagianList = [] } = useQuery({
    queryKey: ['bagian-master-list'],
    queryFn: () => masterApi.getBagianList().then(r => r.data.data ?? []),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => masterApi.updateApprovalMapping(id, { am_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-mapping'] }),
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mengubah status')),
  })

  const editMut = useMutation({
    mutationFn: ({ id, nik }) => masterApi.updateApprovalMapping(id, { am_approver_nik: nik }),
    onSuccess: () => {
      toast.success('NIK Approver berhasil diupdate')
      qc.invalidateQueries({ queryKey: ['approval-mapping'] })
      setEditingId(null)
      setEditNik('')
    },
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mengupdate NIK')),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => masterApi.deleteApprovalMapping(id),
    onSuccess: () => {
      toast.success('Mapping berhasil dihapus')
      qc.invalidateQueries({ queryKey: ['approval-mapping'] })
    },
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal menghapus mapping')),
  })

  const handleStartEdit = (item) => {
    setEditingId(item.am_id)
    setEditNik(item.am_approver_nik)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditNik('')
  }
    // SESUDAH:
  const handleSaveEdit = (id) => {
    const trimmed = editNik.trim()
    if (!trimmed) return toast.error('NIK tidak boleh kosong')
    if (trimmed.length > 20) return toast.error('NIK maksimal 20 karakter')
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return toast.error('NIK hanya boleh berisi huruf dan angka')
    editMut.mutate({ id, nik: trimmed })
  }

  if (isError) return <ErrorBox message="Gagal memuat data mapping approval." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title">Mapping Approval Departemen</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tetapkan atasan khusus untuk mem-bypass hirarki default pada suatu bagian/divisi.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
            <AnimatedIcon variant="scale"><Plus size={16} /></AnimatedIcon>
            Tambah Mapping
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
        </div>
      ) : raw.length === 0 ? (
        <EmptyState
          message="Belum ada mapping atasan khusus. Semua persetujuan akan mengikuti relasi atasan default."
          icon={GitMerge}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {raw.map(item => {
            const isEditing = editingId === item.am_id
            return (
              <div
                key={item.am_id}
                className={`card group flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${item.am_active ? 'border-sapphire/20' : 'opacity-60 grayscale-[50%]'}`}
              >
                {/* Header: nama bagian + action buttons */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-navy font-bold">
                    <Building2 size={16} className="text-sapphire" />
                    {item.am_bagian}
                  </div>
                  <div className="flex gap-1">
                    {/* Toggle aktif/nonaktif */}
                    <button
                      onClick={() => toggleMut.mutate({ id: item.am_id, active: item.am_active ? 0 : 1 })}
                      disabled={toggleMut.isPending}
                      className={`btn-icon p-1.5 ${item.am_active ? 'text-green-600' : 'text-slate-400'}`}
                      title={item.am_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {item.am_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    {/* Edit NIK */}
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="btn-icon p-1.5 text-slate-400 hover:text-sapphire hover:bg-ice-blue"
                        title="Edit NIK Approver"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {/* Hapus */}
                    <button
                      onClick={() => { if (window.confirm(`Hapus mapping bagian "${item.am_bagian}"?`)) deleteMut.mutate(item.am_id) }}
                      disabled={deleteMut.isPending}
                      className="btn-icon p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Hapus mapping"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Body: info approver — normal view atau edit view */}
                {isEditing ? (
                  // ── Mode Edit NIK ─────────────────────────────────────────
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2">
                    <label className="text-xs font-semibold text-sapphire">NIK Approver Baru</label>
                    <input
                        className="input font-mono text-sm"
                        value={editNik}
                        onChange={e => setEditNik(e.target.value)}
                        placeholder="Masukkan NIK"
                        maxLength={20}
                        autoFocus
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(item.am_id)}
                        disabled={editMut.isPending}
                        className="btn-primary flex-1 justify-center flex items-center gap-1.5 text-xs py-1.5"
                      >
                        {editMut.isPending ? <Spinner size={13} /> : <><Check size={13} /> Simpan</>}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={editMut.isPending}
                        className="btn-ghost flex-1 justify-center flex items-center gap-1.5 text-xs py-1.5"
                      >
                        <X size={13} /> Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── Mode Normal ───────────────────────────────────────────
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.approver_name || <span className="text-red-400 italic">NIK tidak ditemukan</span>}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{item.am_approver_nik}</p>
                      {item.approver_jabatan && (
                        <p className="text-[10px] text-sapphire uppercase tracking-wider mt-0.5">{item.approver_jabatan}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Badge status */}
                <div className="flex justify-end">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.am_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {item.am_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <MappingFormModal
          bagianList={bagianList.filter(b => b.bag_active === 1)}
          existingBagian={raw.map(r => r.am_bagian)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function MappingFormModal({ bagianList, existingBagian, onClose }) {
  const qc = useQueryClient()
  const [bagian, setBagian] = useState('')
  const [nik, setNik] = useState('')

  // Filter bagian yang belum ada di mapping (hindari duplikat)
  const availableBagian = bagianList.filter(b => !existingBagian.includes(b.bag_nama))

  const createMut = useMutation({
    mutationFn: (body) => masterApi.addApprovalMapping(body),
    onSuccess: () => {
      toast.success('Mapping berhasil disimpan')
      qc.invalidateQueries({ queryKey: ['approval-mapping'] })
      onClose()
    },
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal menyimpan mapping'))
  })

  const handleSubmit = () => {
    if (!bagian) return toast.error('Pilih bagian terlebih dahulu')
    if (!nik.trim()) return toast.error('NIK Approver wajib diisi')
    createMut.mutate({ am_bagian: bagian, am_approver_nik: nik.trim() })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-display font-bold text-navy text-lg mb-1 flex items-center gap-2">
          <GitMerge size={20} className="text-sapphire" /> Tambah Mapping Atasan
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Hanya tambahkan bagian yang atasannya berbeda dari relasi hirarki default.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="label">Bagian / Departemen</label>
            {availableBagian.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">Semua bagian aktif sudah memiliki mapping.</p>
            ) : (
              <select className="input" value={bagian} onChange={e => setBagian(e.target.value)}>
                <option value="">-- Pilih Bagian --</option>
                {availableBagian.map(b => (
                  <option key={b.bag_id} value={b.bag_nama}>{b.bag_nama}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">NIK Atasan / Approver Khusus</label>
            <input
              className="input font-mono"
              placeholder="Contoh: 101002"
              value={nik}
              onChange={e => setNik(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Sistem akan memverifikasi NIK ke database karyawan secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-ghost flex-1 justify-center"
            onClick={onClose}
            disabled={createMut.isPending}
          >
            Batal
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={handleSubmit}
            disabled={createMut.isPending || availableBagian.length === 0}
          >
            {createMut.isPending ? <Spinner size={16} /> : 'Simpan Mapping'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}