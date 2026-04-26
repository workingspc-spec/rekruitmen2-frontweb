// src/pages/master/BagianMasterPage.jsx
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../api/services'
import { ErrorBox, EmptyState, Spinner, BagianCardSkeleton } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import { Building2, Plus, Edit2, Check, X, ToggleLeft, ToggleRight, Save } from 'lucide-react'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import toast from 'react-hot-toast'

import { AnimatedIcon } from '../../components/AnimatedIcon'

const ITEMS_PER_PAGE = 15

const getFilterClasses = (color, isActive) => {
  if (isActive) {
    const map = {
      sapphire: 'bg-white shadow text-sapphire',
      green:    'bg-white shadow text-green-600',
      slate:    'bg-white shadow text-slate-700',
    }
    return map[color] || 'bg-white shadow text-sapphire'
  }
  return 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
}

const getBadgeClasses = (color) => {
  const map = {
    sapphire: 'bg-sapphire/10 text-sapphire',
    green:    'bg-green-100 text-green-700',
    slate:    'bg-slate-200 text-slate-700',
  }
  return map[color] || 'bg-sapphire/10 text-sapphire'
}

export default function BagianMasterPage() {
  const qc = useQueryClient()

  const [filterActive, setFilterActive] = useState(null)
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)

  const { data: raw = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['bagian-master-list'],
    queryFn:  () => masterApi.getBagianList().then(r => r.data.data ?? []),
  })

  const createMut = useMutation({
    mutationFn: (bagNama) => masterApi.createBagian({ bag_nama: bagNama }),
    onSuccess: () => {
      toast.success('Bagian berhasil ditambahkan')
      qc.invalidateQueries({ queryKey: ['bagian-master-list'] })
      qc.invalidateQueries({ queryKey: ['bagian'] })
      setShowAddModal(false)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal menambahkan bagian'),
  })

  const updateNamaMut = useMutation({
    mutationFn: ({ id, nama }) => masterApi.updateBagian(id, { bag_nama: nama }),
    onSuccess: () => {
      toast.success('Nama bagian diperbarui')
      qc.invalidateQueries({ queryKey: ['bagian-master-list'] })
      qc.invalidateQueries({ queryKey: ['bagian'] })
      setEditTarget(null)
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal mengubah nama'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => masterApi.updateBagian(id, { bag_active: active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bagian-master-list'] })
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal mengubah status'),
  })

  const filteredList = useMemo(() => {
    let list = [...raw]
    if (filterActive !== null) list = list.filter(b => b.bag_active === filterActive)
    return list.sort((a, b) => b.bag_active - a.bag_active || a.bag_nama.localeCompare(b.bag_nama))
  }, [raw, filterActive])

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
    usePagination(filteredList, ITEMS_PER_PAGE)

  const aktifCount    = raw.filter(b => b.bag_active === 1).length
  const nonAktifCount = raw.filter(b => b.bag_active === 0).length

  const FILTERS = [
    { label: 'Semua',    value: null, color: 'sapphire', count: raw.length },
    { label: 'Aktif',    value: 1,    color: 'green',    count: aktifCount },
    { label: 'Nonaktif', value: 0,    color: 'slate',    count: nonAktifCount },
  ]

  if (isError) return <ErrorBox message="Gagal memuat data bagian." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">Kelola Bagian / Departemen</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manajemen master data bagian untuk dropdown form rekruitmen
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">

          {/* Filter Chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            {isLoading ? (
              // Skeleton for filter tabs while loading
              [1, 2, 3].map(i => (
                <div key={i} className="skeleton h-8 w-20 rounded-lg" />
              ))
            ) : (
              FILTERS.map(opt => {
                const isActive = filterActive === opt.value
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => { setFilterActive(opt.value); setCurrentPage(1) }}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${getFilterClasses(opt.color, isActive)}`}
                  >
                    {opt.label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold transition-colors ${getBadgeClasses(opt.color)}`}>
                      {opt.count}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Action Button */}
          <button className="btn-primary flex items-center gap-2 shrink-0" onClick={() => setShowAddModal(true)}>
            <AnimatedIcon variant="scale"><Plus size={16} /></AnimatedIcon>
            Tambah Bagian
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BagianCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          message={filterActive !== null ? 'Tidak ada bagian dengan filter ini.' : 'Belum ada bagian. Tap + untuk menambah.'}
          icon={Building2}
          action={filterActive === null ? () => setShowAddModal(true) : undefined}
          actionLabel="Tambah Bagian"
        />
      ) : (
        <div className="space-y-3">
          <div className="space-y-3">
            {paginatedData.map(item => (
              <BagianCard
                key={item.bag_id}
                item={item}
                editTarget={editTarget}
                setEditTarget={setEditTarget}
                onSaveEdit={(nama) => updateNamaMut.mutate({ id: item.bag_id, nama })}
                onToggle={() => toggleMut.mutate({ id: item.bag_id, active: item.bag_active === 1 ? 0 : 1 })}
                isSaving={updateNamaMut.isPending && editTarget?.bag_id === item.bag_id}
                isToggling={toggleMut.isPending}
              />
            ))}
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

      {/* Add Modal */}
      {showAddModal && (
        <BagianFormModal
          title="Tambah Bagian Baru"
          initialValue=""
          loading={createMut.isPending}
          onConfirm={(nama) => createMut.mutate(nama)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function BagianCard({ item, editTarget, setEditTarget, onSaveEdit, onToggle, isSaving, isToggling }) {
  const isActive  = item.bag_active === 1
  const isEditing = editTarget?.bag_id === item.bag_id
  const [editVal, setEditVal] = useState(item.bag_nama)

  const handleEdit = () => {
    setEditVal(item.bag_nama)
    setEditTarget(item)
  }
  const handleSave = () => {
    if (editVal.trim().length < 1) { toast.error('Nama tidak boleh kosong'); return }
    onSaveEdit(editVal.trim())
  }

  return (
    <div className={`card group flex items-center gap-4 transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7] ${!isActive ? 'opacity-60 grayscale-[50%]' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        isActive ? 'bg-sapphire/10 group-hover:bg-sapphire/20' : 'bg-slate-100'
      }`}>
        <Building2 size={20} className={isActive ? 'text-sapphire' : 'text-slate-400'} />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            className="input text-sm py-1.5 px-3 h-9 border-sapphire focus:ring-sapphire/30"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            maxLength={100}
          />
        ) : (
          <p className="font-semibold text-navy truncate group-hover:text-sapphire transition-colors">{item.bag_nama}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {item.bag_created_by && (
            <span className="text-xs text-slate-400">Oleh: {item.bag_created_by}</span>
          )}
          {item.bag_created_at && (
            <span className="text-xs text-slate-300">· {formatDate(item.bag_created_at)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Spinner size={14} /> : <Check size={14} />}
            </button>
            <button
              onClick={() => setEditTarget(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={handleEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sapphire hover:bg-sapphire/10 transition-colors"
            title="Edit nama"
          >
            <AnimatedIcon variant="scale"><Edit2 size={14} /></AnimatedIcon>
          </button>
        )}
        <button
          onClick={onToggle}
          disabled={isToggling}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
            isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'
          }`}
          title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          <AnimatedIcon variant="scale">
            {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </AnimatedIcon>
        </button>
      </div>
    </div>
  )
}

function BagianFormModal({ title, initialValue, loading, onConfirm, onClose }) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) { setError('Nama bagian tidak boleh kosong'); return }
    if (trimmed.length > 100) { setError('Maksimal 100 karakter'); return }
    setError('')
    onConfirm(trimmed)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 modal-overlay backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sapphire/10 flex items-center justify-center">
            <Building2 size={20} className="text-sapphire" />
          </div>
          <h3 className="font-display font-bold text-navy text-lg">{title}</h3>
        </div>

        <div className="mb-4">
          <label className="label">Nama Bagian / Departemen <span className="text-red-500">*</span></label>
          <input
            className={`input focus:border-sapphire focus:ring-sapphire/30 ${error ? 'border-red-400' : ''}`}
            placeholder="Contoh: Remote Software Developer, Sales Online"
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            maxLength={100}
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          <p className="text-xs text-slate-400 mt-1">{value.trim().length}/100 karakter</p>
        </div>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
          <AnimatedIcon variant="wiggle">
            <Building2 size={14} className="text-sapphire shrink-0 mt-0.5" />
          </AnimatedIcon>
          <p className="text-xs text-sapphire leading-relaxed">
            Bagian yang ditambahkan akan langsung muncul di pilihan dropdown form permintaan rekruitmen.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={16} /> : <Save size={16} />}
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}