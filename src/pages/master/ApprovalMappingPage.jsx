import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../api/services'
import { ErrorBox, EmptyState, Spinner } from '../../components/ui'
import { GitMerge, Plus, Trash2, ToggleLeft, ToggleRight, Building2, User, Edit2, Check, X, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { sanitizeApiError } from '../../utils/security'
import { AnimatedIcon } from '../../components/AnimatedIcon'

const clean = (value) => (value ?? '').toString().trim()
const nullable = (value) => {
  const v = clean(value).toUpperCase()
  return v ? v : null
}

function scopeLabel(item) {
  const dep = clean(item.am_dep_kode)
  const pab = clean(item.am_pab_kode)
  if (dep && pab) return `${dep} · ${pab}`
  if (pab) return `Plant ${pab}`
  if (dep) return `Dept ${dep}`
  return 'Global'
}

function priorityLabel(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 100
  return n
}

function validateNik(nik) {
  const trimmed = clean(nik)
  if (!trimmed) return 'NIK tidak boleh kosong'
  if (trimmed.length > 20) return 'NIK maksimal 20 karakter'
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'NIK hanya boleh berisi huruf dan angka'
  return null
}

function validatePriority(priority) {
  const n = Number(priority)
  if (!Number.isInteger(n) || n < 1 || n > 999) return 'Priority harus angka 1–999'
  return null
}

export default function ApprovalMappingPage() {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ nik: '', dep: '', pab: '', priority: '100' })

  const { data: raw = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['approval-mapping'],
    queryFn: () => masterApi.getApprovalMapping().then(r => r.data.data ?? []),
  })

  const { data: bagianList = [] } = useQuery({
    queryKey: ['bagian-master-list'],
    queryFn: () => masterApi.getBagianList().then(r => r.data.data ?? []),
  })

  const activeMappings = useMemo(() => raw.filter(r => Number(r.am_active) === 1), [raw])
  const globalCount = useMemo(() => activeMappings.filter(r => !clean(r.am_dep_kode) && !clean(r.am_pab_kode)).length, [activeMappings])

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => masterApi.updateApprovalMapping(id, { am_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-mapping'] }),
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mengubah status')),
  })

  const editMut = useMutation({
    mutationFn: ({ id, body }) => masterApi.updateApprovalMapping(id, body),
    onSuccess: () => {
      toast.success('Mapping approval berhasil diupdate')
      qc.invalidateQueries({ queryKey: ['approval-mapping'] })
      setEditingId(null)
      setEditForm({ nik: '', dep: '', pab: '', priority: '100' })
    },
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mengupdate mapping')),
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
    setEditForm({
      nik: clean(item.am_approver_nik),
      dep: clean(item.am_dep_kode),
      pab: clean(item.am_pab_kode),
      priority: String(priorityLabel(item.am_priority)),
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ nik: '', dep: '', pab: '', priority: '100' })
  }

  const handleSaveEdit = (id) => {
    const nikErr = validateNik(editForm.nik)
    if (nikErr) return toast.error(nikErr)
    const prioErr = validatePriority(editForm.priority)
    if (prioErr) return toast.error(prioErr)

    editMut.mutate({
      id,
      body: {
        am_approver_nik: clean(editForm.nik),
        am_dep_kode: nullable(editForm.dep),
        am_pab_kode: nullable(editForm.pab),
        am_priority: Number(editForm.priority),
      },
    })
  }

  if (isError) return <ErrorBox message="Gagal memuat data mapping approval." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
        <div className="page-header flex justify-between items-start gap-4">
          <div>
            <h1 className="page-title">Mapping Approval Departemen</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Atur scope approval berdasarkan bagian, departemen, plant/pabrik, dan priority.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Resolver: bagian+dep+pab → bagian+pab → bagian+dep → global → fallback atasan karyawan.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
            <AnimatedIcon variant="scale"><Plus size={16} /></AnimatedIcon>
            Tambah Mapping
          </button>
        </div>
      </div>

      {globalCount > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-700">
          <b>{globalCount}</b> mapping aktif masih bersifat global. Ini aman untuk bagian yang memang berlaku umum, tetapi untuk area lintas plant sebaiknya isi Dept/Plant.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 w-full rounded-2xl" />)}
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
            const isActive = Number(item.am_active) === 1
            return (
              <div
                key={item.am_id}
                className={`card group flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${isActive ? 'border-sapphire/20' : 'opacity-60 grayscale-[50%]'}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-navy font-bold">
                      <Building2 size={16} className="text-sapphire shrink-0" />
                      <span className="truncate">{item.am_bagian}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        <Layers size={11} /> {scopeLabel(item)}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                        Priority {priorityLabel(item.am_priority)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => toggleMut.mutate({ id: item.am_id, active: isActive ? 0 : 1 })}
                      disabled={toggleMut.isPending}
                      className={`btn-icon p-1.5 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
                      title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="btn-icon p-1.5 text-slate-400 hover:text-sapphire hover:bg-ice-blue"
                        title="Edit mapping"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => { if (window.confirm(`Hapus mapping bagian "${item.am_bagian}" dengan scope ${scopeLabel(item)}?`)) deleteMut.mutate(item.am_id) }}
                      disabled={deleteMut.isPending}
                      className="btn-icon p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Hapus mapping"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-sapphire">NIK Approver</label>
                      <input
                        className="input font-mono text-sm"
                        value={editForm.nik}
                        onChange={e => setEditForm(f => ({ ...f, nik: e.target.value }))}
                        placeholder="Masukkan NIK"
                        maxLength={20}
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-sapphire">Dept kode</label>
                        <input
                          className="input text-sm uppercase"
                          value={editForm.dep}
                          onChange={e => setEditForm(f => ({ ...f, dep: e.target.value.toUpperCase() }))}
                          placeholder="Opsional, contoh PRD2"
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-sapphire">Plant/Pab kode</label>
                        <input
                          className="input text-sm uppercase"
                          value={editForm.pab}
                          onChange={e => setEditForm(f => ({ ...f, pab: e.target.value.toUpperCase() }))}
                          placeholder="Opsional, contoh P04"
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sapphire">Priority</label>
                      <input
                        className="input text-sm"
                        type="number"
                        min="1"
                        max="999"
                        value={editForm.priority}
                        onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Angka kecil lebih diprioritaskan. Gunakan 10 untuk scope khusus dan 100 untuk default.</p>
                    </div>
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
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.approver_name || <span className="text-red-400 italic">NIK tidak ditemukan</span>}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{item.am_approver_nik}</p>
                      {(item.approver_dep_kode || item.approver_pab_kode) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Area approver: {clean(item.approver_dep_kode) || '-'} · {clean(item.approver_pab_kode) || '-'}
                        </p>
                      )}
                      {item.approver_jabatan && (
                        <p className="text-[10px] text-sapphire uppercase tracking-wider mt-0.5">{item.approver_jabatan}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <MappingFormModal
          bagianList={bagianList.filter(b => Number(b.bag_active) === 1)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function MappingFormModal({ bagianList, onClose }) {
  const qc = useQueryClient()
  const [bagian, setBagian] = useState('')
  const [nik, setNik] = useState('')
  const [dep, setDep] = useState('')
  const [pab, setPab] = useState('')
  const [priority, setPriority] = useState('100')

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
    const nikErr = validateNik(nik)
    if (nikErr) return toast.error(nikErr)
    const prioErr = validatePriority(priority)
    if (prioErr) return toast.error(prioErr)

    createMut.mutate({
      am_bagian: bagian,
      am_approver_nik: clean(nik),
      am_dep_kode: nullable(dep),
      am_pab_kode: nullable(pab),
      am_priority: Number(priority),
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-navy text-lg mb-1 flex items-center gap-2">
          <GitMerge size={20} className="text-sapphire" /> Tambah Mapping Approval
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Isi Dept/Plant untuk scope spesifik. Kosongkan keduanya hanya jika mapping memang global.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="label">Bagian</label>
            {bagianList.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">Belum ada bagian aktif.</p>
            ) : (
              <select className="input" value={bagian} onChange={e => setBagian(e.target.value)}>
                <option value="">-- Pilih Bagian --</option>
                {bagianList.map(b => (
                  <option key={b.bag_id} value={b.bag_nama}>{b.bag_nama}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">NIK Approver</label>
            <input
              className="input font-mono"
              placeholder="Contoh: 0411251525"
              value={nik}
              onChange={e => setNik(e.target.value)}
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dept kode</label>
              <input
                className="input uppercase"
                placeholder="Opsional, contoh PRD2"
                value={dep}
                onChange={e => setDep(e.target.value.toUpperCase())}
                maxLength={20}
              />
            </div>
            <div>
              <label className="label">Plant/Pab kode</label>
              <input
                className="input uppercase"
                placeholder="Opsional, contoh P04"
                value={pab}
                onChange={e => setPab(e.target.value.toUpperCase())}
                maxLength={20}
              />
            </div>
          </div>
          <div>
            <label className="label">Priority</label>
            <input
              className="input"
              type="number"
              min="1"
              max="999"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Gunakan 10 untuk mapping scope khusus, 100 untuk default. Resolver tetap mengutamakan kecocokan scope terlebih dahulu.
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
            disabled={createMut.isPending || bagianList.length === 0}
          >
            {createMut.isPending ? <Spinner size={16} /> : 'Simpan Mapping'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
