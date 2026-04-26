// src/pages/approval/ApprovalListPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApprovalList } from '../../hooks/useApprovalList'
import { recruitmentApi } from '../../api/services'
import {
  ErrorBox, EmptyState, ConfirmDialog, SearchInput,
  ApprovalCardSkeleton,
} from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import PaginationControls from '../../components/PaginationControls'
import { usePagination } from '../../hooks/usePagination'
import {
  matchesPeriodFilter,
  periodToLabel,
} from '../../utils/periodFilter'
import { CheckSquare, Calendar, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ApprovalCard } from './ApprovalCard'
import { HrdConfirmDialog } from './HrdConfirmDialog'
import { HrdRejectDialog } from './HrdRejectDialog'
import { formatDate } from '../../utils/helpers'
import { AnimatedIcon } from '../../components/AnimatedIcon'

const ITEMS_PER_PAGE = 10

function SlaResultDialog({ slaInfo, onClose }) {
  const isSystem = slaInfo?.sla_source === 'SYSTEM'
  const explanation = isSystem
    ? 'Tanggal disesuaikan otomatis untuk memenuhi standar waktu layanan rekrutmen.'
    : (slaInfo?.explanation ?? 'Permintaan telah disetujui.')

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AnimatedIcon variant="wiggle">
            {isSystem
              ? <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              : <CheckCircle2  size={24} className="text-green-600 shrink-0" />}
          </AnimatedIcon>
          <h3 className="font-display font-bold text-navy text-lg">Rekrutmen Dibuka!</h3>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wide ${isSystem ? 'text-amber-600' : 'text-green-700'}`}>
          {isSystem ? '⚠️ Catatan Sistem:' : '✅ SLA Mulai Berjalan:'}
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>
        {slaInfo?.final_target_date && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Target Rekrutmen Selesai:</p>
            <p className="text-xl font-display font-black text-sapphire">
              {formatDate(slaInfo.final_target_date)}
            </p>
          </div>
        )}
        <button onClick={onClose} className="btn-primary w-full justify-center mt-2">Mengerti</button>
      </div>
    </div>,
    document.body
  )
}

const STATUS_TABS = [
  { key: 'all',      label: 'Semua' },
  { key: 'pending',  label: 'Belum Approve' },
  { key: 'approved', label: 'Sudah Approve' },
]

export default function ApprovalListPage({ initialPeriodFilter = null }) {
  const navigate = useNavigate()

  const [tab,    setTab]    = useState('pending')
  const [search, setSearch] = useState('')
  const [activePeriodFilter, setActivePeriodFilter] = useState(initialPeriodFilter ?? null)
  const [showPeriodPicker,   setShowPeriodPicker]   = useState(false)

  const {
    list, loading, error, refetch, isHrd,
    confirmItem, setConfirmItem,
    isHrdDialogItem, setIsHrdDialogItem,
    isHrdRejectItem, setIsHrdRejectItem,
    slaResultInfo, setSlaResultInfo,
    atasanMut,
    hrdApproveMut,
    hrdRejectMut,
    isPending,
  } = useApprovalList()

  useEffect(() => {
    recruitmentApi.syncManual().catch(err => console.warn('Sync failed:', err))
  }, [])

  const pendingCount  = list.filter(item => isPending(item)).length
  const approvedCount = list.filter(item => !isPending(item)).length
  const allCount      = list.length
  
  // (Baris ini biarkan saja, sudah benar untuk titik merah notifikasi)
  const actionableCount = list.filter(item => isPending(item) && item.is_legacy !== 1).length
  const filteredList = useMemo(() => {
    let items = list

    if (tab === 'pending') {
      items = items.filter(item => isPending(item)) // Biarkan legacy pending masuk sini
    }
    if (tab === 'approved') {
      items = items.filter(item => !isPending(item)) // Biarkan legacy approved masuk sini
    }

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(item =>
        item.jab_nama?.toLowerCase().includes(q) ||
        item.tpk_nomor?.toLowerCase().includes(q) ||
        item.tpk_bagian?.toLowerCase().includes(q)
      )
    }

    if (activePeriodFilter) {
      items = items.filter(item => {
        const dateToCheck = item.tpk_approveHRD !== 0 ? item.tgl_approve_hrd
                          : item.tpk_approveatasan !== 0 ? item.tgl_approve_atasan
                          : item.tpk_tanggal
        return matchesPeriodFilter(dateToCheck, activePeriodFilter)
      })
    }

    return items
  }, [list, tab, search, activePeriodFilter])

  const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
    usePagination(filteredList, ITEMS_PER_PAGE)

  const emptyMessage = (() => {
    const statusMsg =
      tab === 'pending'
        ? 'Tidak ada permintaan yang menunggu persetujuan'
        : tab === 'approved'
          ? 'Tidak ada permintaan yang sudah disetujui'
          : 'Tidak ada data approval'
    if (activePeriodFilter) return `${statusMsg}\npada periode: ${periodToLabel(activePeriodFilter)}`
    if (search) return `Tidak ada hasil untuk "${search}".`
    return statusMsg
  })()

  const countFor = (key) => {
    if (key === 'all')      return allCount
    if (key === 'pending')  return pendingCount
    if (key === 'approved') return approvedCount
    return 0
  }

  return (
    <div className="space-y-5 relative">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

        <div className="page-header mb-4">
          <div>
            <h1 className="page-title">Approval</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isHrd ? 'Persetujuan HRD' : 'Persetujuan Atasan'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">

          {(!loading && !error && (list.length > 0 || search !== '')) ? (
            <div className="flex-1 min-w-48 transition-all duration-300">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari jabatan / nomor / bagian..."
                className="w-full"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {STATUS_TABS.map(t => {
              const isActive = tab === t.key
              const count    = countFor(t.key)
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch('') }}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    isActive ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      t.key === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : t.key === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-sapphire/10 text-sapphire'
                    }`}>
                      {count}
                    </span>
                  )}
                  {!isActive && t.key === 'pending' && actionableCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowPeriodPicker(true)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 ${
              activePeriodFilter
                ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'
            }`}
          >
            <Calendar size={13} className={activePeriodFilter ? 'text-sapphire' : 'text-slate-400'} />
            <span className="max-w-[120px] truncate">{periodToLabel(activePeriodFilter)}</span>
            {activePeriodFilter && (
              <X size={12} className="hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); setActivePeriodFilter(null) }} />
            )}
          </button>
        </div>

        {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
          <p className="text-xs text-[#A6C5D7] font-medium mt-3">Difilter dari Dashboard · Tap tanggal untuk ubah</p>
        )}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ApprovalCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorBox message="Gagal memuat data approval." onRetry={refetch} />
      ) : filteredList.length === 0 ? (
        <EmptyState message={emptyMessage} icon={CheckSquare} />
      ) : (
        <div className="space-y-3">
          <div className="space-y-4">
            {paginatedData.map(item => (
              <ApprovalCard
                key={item.tpk_nomor}
                item={item}
                isHrd={isHrd}
                pending={isPending(item) && !item.is_legacy}
                onApprove={() => {
                  if (isHrd) {
                    setIsHrdDialogItem(item)
                  } else {
                    setConfirmItem({ item, action: 'APPROVE' })
                  }
                }}
                onReject={() => {
                  if (isHrd) {
                    setIsHrdRejectItem(item)
                  } else {
                    setConfirmItem({ item, action: 'REJECT' })
                  }
                }}
                onDetail={() => navigate(`/recruitment/${encodeURIComponent(item.tpk_nomor)}`)}
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

      {showPeriodPicker && (
        <PeriodPickerModal
          current={activePeriodFilter}
          onSelect={(val) => { setActivePeriodFilter(val); setShowPeriodPicker(false) }}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}

      {confirmItem && (
        <ConfirmDialog
          open
          onClose={() => setConfirmItem(null)}
          onConfirm={() => atasanMut.mutate({
            tpk_nomor: confirmItem.item.tpk_nomor,
            action: confirmItem.action,
          })}
          title={confirmItem.action === 'APPROVE' ? 'Setujui Permintaan?' : 'Tolak Permintaan?'}
          message={`${confirmItem.item.jab_nama} — ${confirmItem.item.tpk_bagian}\nJumlah: ${confirmItem.item.tpk_jumlah} orang`}
          confirmText={confirmItem.action === 'APPROVE' ? 'Setujui' : 'Tolak'}
          danger={confirmItem.action === 'REJECT'}
          loading={atasanMut.isPending}
        />
      )}

      {isHrdDialogItem && (
        <HrdConfirmDialog
          item={isHrdDialogItem}
          loading={hrdApproveMut.isPending}
          onConfirm={() => hrdApproveMut.mutate({ tpk_nomor: isHrdDialogItem.tpk_nomor })}
          onClose={() => setIsHrdDialogItem(null)}
        />
      )}

      {isHrdRejectItem && (
        <HrdRejectDialog
          item={isHrdRejectItem}
          loading={hrdRejectMut.isPending}
          onConfirm={(alasan_tolak) => hrdRejectMut.mutate({
            tpk_nomor: isHrdRejectItem.tpk_nomor,
            alasan_tolak,
          })}
          onClose={() => setIsHrdRejectItem(null)}
        />
      )}

      {slaResultInfo && (
        <SlaResultDialog
          slaInfo={slaResultInfo}
          onClose={() => setSlaResultInfo(null)}
        />
      )}
    </div>
  )
}