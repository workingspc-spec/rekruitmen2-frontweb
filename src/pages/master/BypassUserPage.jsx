// src/pages/master/BypassUserPage.jsx
// [SECURITY] Changes:
//   - Add import: sanitizeApiError from utils/security
//   - addMut onError    → sanitizeApiError(e, 'Gagal mendaftarkan')
//   - toggleMut onError → sanitizeApiError(e, 'Gagal mengubah status')
//   - deleteMut onError → sanitizeApiError(e, 'Gagal menghapus')
//   - AddBypassUserModal lookup catch → sanitizeApiError(e, 'NIK tidak ditemukan')
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../api/services'
import { ErrorBox, EmptyState, Spinner, ConfirmDialog, BypassUserCardSkeleton } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import {
  ShieldCheck, UserPlus, Trash2, PauseCircle, PlayCircle,
  Building2, StickyNote, Search, AlertTriangle,
} from 'lucide-react'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import toast from 'react-hot-toast'
import { AnimatedIcon } from '../../components/AnimatedIcon'
// ✅ [SECURITY]
import { sanitizeApiError } from '../../utils/security'

const ITEMS_PER_PAGE = 10

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

export default function BypassUserPage() {
  const qc = useQueryClient()

  const [filterActive, setFilterActive] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: raw = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['bypass-users'],
    queryFn:  () => masterApi.getBypassUsers().then(r => r.data.data ?? []),
  })

  const addMut = useMutation({
    mutationFn: ({ nik, keterangan }) => masterApi.addBypassUser({ bu_nik: nik, bu_keterangan: keterangan || undefined }),
    onSuccess: () => {
      toast.success('Bypass user berhasil didaftarkan')
      qc.invalidateQueries({ queryKey: ['bypass-users'] })
      setShowAddModal(false)
    },
    // ✅ [SECURITY]
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mendaftarkan')),
  })

  const toggleMut = useMutation({
    mutationFn: ({ nik, active }) => masterApi.updateBypassUser(nik, { bu_active: active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bypass-users'] })
    },
    // ✅ [SECURITY]
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal mengubah status')),
  })

  const deleteMut = useMutation({
    mutationFn: (nik) => masterApi.deleteBypassUser(nik),
    onSuccess: () => {
      toast.success('Bypass user berhasil dihapus')
      qc.invalidateQueries({ queryKey: ['bypass-users'] })
      setDeleteTarget(null)
    },
    // ✅ [SECURITY]
    onError: (e) => toast.error(sanitizeApiError(e, 'Gagal menghapus')),
  })

  const filteredList = useMemo(() => {
    let list = [...raw]
    if (filterActive !== null) list = list.filter(u => u.bu_active === filterActive)
    return list.sort((a, b) => b.bu_active - a.bu_active || (a.kar_nama ?? a.bu_nik).localeCompare(b.kar_nama ?? b.bu_nik))
  }, [raw, filterActive])

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
    usePagination(filteredList, ITEMS_PER_PAGE)

  const aktifCount    = raw.filter(u => u.bu_active === 1).length
  const nonAktifCount = raw.filter(u => u.bu_active === 0).length

  const FILTERS = [
    { label: 'Semua',    value: null, color: 'sapphire', count: raw.length },
    { label: 'Aktif',    value: 1,    color: 'green',    count: aktifCount },
    { label: 'Nonaktif', value: 0,    color: 'slate',    count: nonAktifCount },
  ]

  if (isError) return <ErrorBox message="Gagal memuat bypass users." onRetry={refetch} />

  return (
    <div className="space-y-5 relative">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">Kelola Bypass Users</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Pengguna yang dapat mengajukan rekruitmen tanpa persetujuan atasan
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between w-full">

          {/* Filter Chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap shrink-0">
            {isLoading ? (
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

          {/* Info Banner */}
          <div className="flex-1 flex items-center gap-2.5 min-h-[44px]">
            <AnimatedIcon variant="wiggle">
              <ShieldCheck size={16} className="text-sapphire shrink-0" />
            </AnimatedIcon>
            <p className="text-[11px] font-medium text-slate-600 leading-snug">
              Bypass user dapat mengajukan permintaan rekruitmen langsung ke HRD tanpa perlu persetujuan atasan terlebih dahulu.
            </p>
          </div>

          {/* Action Button */}
          <button className="btn-primary flex items-center justify-center gap-2 shrink-0 min-h-[44px] px-5" onClick={() => setShowAddModal(true)}>
            <AnimatedIcon variant="scale"><UserPlus size={16} /></AnimatedIcon>
            Tambah Bypass User
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <BypassUserCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          message={filterActive !== null ? 'Tidak ada bypass user dengan filter ini.' : 'Belum ada bypass user terdaftar.'}
          icon={ShieldCheck}
          action={filterActive === null ? () => setShowAddModal(true) : undefined}
          actionLabel="Tambah Bypass User"
        />
      ) : (
        <div className="space-y-3">
          <div className="space-y-4">
            {paginatedData.map(item => (
              <BypassUserCard
                key={item.bu_nik}
                item={item}
                onToggle={() => toggleMut.mutate({ nik: item.bu_nik, active: item.bu_active === 1 ? 0 : 1 })}
                onDelete={() => setDeleteTarget(item)}
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

      {showAddModal && (
        <AddBypassUserModal
          loading={addMut.isPending}
          onConfirm={(nik, keterangan) => addMut.mutate({ nik, keterangan })}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget.bu_nik)}
          title="Hapus Permanen?"
          message={`Hapus bypass user ${deleteTarget.kar_nama ?? deleteTarget.bu_nik} (NIK: ${deleteTarget.bu_nik}) secara permanen? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus Permanen"
          danger
          loading={deleteMut.isPending}
        />
      )}
    </div>
  )
}

function BypassUserCard({ item, onToggle, onDelete, isToggling }) {
  const isActive = item.bu_active === 1
  const initial  = (item.kar_nama ?? item.bu_nik).charAt(0).toUpperCase()

  return (
    <div className={`card group transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7] ${!isActive ? 'opacity-60 grayscale-[50%]' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-black text-lg transition-colors ${
          isActive ? 'bg-sapphire/10 text-sapphire group-hover:bg-sapphire/20' : 'bg-slate-100 text-slate-400'
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-navy truncate group-hover:text-sapphire transition-colors">{item.kar_nama ?? item.bu_nik}</p>
            <span className={`text-[10px] uppercase tracking-wide font-bold px-2.5 py-0.5 rounded-full transition-colors ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">NIK: {item.bu_nik}</p>
          {item.jab_nama && (
            <p className="text-xs text-sapphire mt-0.5 font-medium">{item.jab_nama}</p>
          )}
        </div>
      </div>

      {(item.kar_bagian || item.bu_keterangan) && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {item.kar_bagian && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 size={13} className="text-slate-400 shrink-0" />
              {item.kar_bagian}
            </div>
          )}
          {item.bu_keterangan && (
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <StickyNote size={13} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{item.bu_keterangan}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={isToggling}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40 ${
            isActive
              ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          <AnimatedIcon variant="scale">
            {isToggling ? <Spinner size={14} /> : isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
          </AnimatedIcon>
          {isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          <AnimatedIcon variant="wiggle"><Trash2 size={14} /></AnimatedIcon>
          Hapus
        </button>
      </div>
    </div>
  )
}

function AddBypassUserModal({ loading, onConfirm, onClose }) {
  const [nik, setNik]         = useState('')
  const [ket, setKet]         = useState('')
  const [nikError, setNikError] = useState('')
  const [lookupState, setLookupState] = useState(null)
  const [isLooking, setIsLooking]     = useState(false)

  const handleLookup = async () => {
    const trimmed = nik.trim()
    if (!trimmed) { setNikError('NIK tidak boleh kosong'); return }
    setNikError('')
    setIsLooking(true)
    setLookupState(null)
    try {
      const res = await masterApi.getKaryawanByNik(trimmed)
      if (res.data?.success && res.data?.data) {
        setLookupState({ ok: true, data: res.data.data })
      } else {
        setLookupState({ ok: false, message: res.data?.message ?? 'NIK tidak ditemukan' })
      }
    } catch (e) {
      // ✅ [SECURITY] sanitizeApiError — lookup error juga disanitasi
      setLookupState({ ok: false, message: sanitizeApiError(e, 'NIK tidak ditemukan') })
    } finally {
      setIsLooking(false)
    }
  }

  const canSubmit = lookupState?.ok && !loading

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 modal-overlay backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sapphire/10 flex items-center justify-center">
            <UserPlus size={20} className="text-sapphire" />
          </div>
          <div>
            <h3 className="font-display font-bold text-navy text-lg">Tambah Bypass User</h3>
            <p className="text-xs text-slate-400">Cek NIK terlebih dahulu sebelum mendaftarkan</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">NIK Karyawan <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className={`input focus:border-sapphire focus:ring-sapphire/30 ${nikError || lookupState?.ok === false ? 'border-red-400' : ''}`}
                placeholder="Masukkan NIK"
                value={nik}
                onChange={e => { setNik(e.target.value); setNikError(''); setLookupState(null) }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                disabled={loading || isLooking}
              />
              {nikError && <p className="text-xs text-red-500 mt-1 font-medium">{nikError}</p>}
              {lookupState?.ok === false && <p className="text-xs text-red-500 mt-1 font-medium">{lookupState.message}</p>}
            </div>
            <button
              onClick={handleLookup}
              disabled={!nik.trim() || loading || isLooking}
              className="btn-secondary px-4 shrink-0 disabled:opacity-40"
            >
              {isLooking ? <Spinner size={15} /> : <Search size={15} />}
              Cek
            </button>
          </div>
        </div>

        {lookupState?.ok && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">
                {lookupState.data.kar_nama.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy truncate">{lookupState.data.kar_nama}</p>
                <p className="text-xs text-slate-400">NIK: {lookupState.data.kar_Nik}</p>
                {lookupState.data.jab_nama && (
                  <p className="text-xs text-green-700 mt-0.5 font-medium">
                    {lookupState.data.jab_nama}
                    {lookupState.data.kar_bagian ? ` · ${lookupState.data.kar_bagian}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {lookupState?.ok && (
          <div className="mb-4">
            <label className="label">Keterangan (Opsional)</label>
            <textarea
              className="input resize-none focus:border-sapphire focus:ring-sapphire/30"
              rows={3}
              placeholder="Contoh: Direktur Operasional — bypass by kebijakan BOD"
              value={ket}
              onChange={e => setKet(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-slate-400 mt-1">{ket.length} karakter</p>
          </div>
        )}

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
          <AnimatedIcon variant="wiggle">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          </AnimatedIcon>
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            Bypass user dapat mengajukan permintaan rekruitmen tanpa perlu persetujuan atasan.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            className="btn-primary flex-1 justify-center disabled:opacity-40"
            onClick={() => onConfirm(nik.trim(), ket.trim() || null)}
            disabled={!canSubmit}
          >
            {loading ? <Spinner size={16} /> : <UserPlus size={16} />}
            {loading ? 'Mendaftarkan...' : 'Daftarkan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}