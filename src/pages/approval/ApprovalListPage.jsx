// src/pages/approval/ApprovalListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApprovalList } from '../../hooks/useApprovalList'
import { PageLoader, ErrorBox, EmptyState, ConfirmDialog, SearchInput } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import {
  matchesPeriodFilter,
  periodToLabel,
} from '../../utils/periodFilter'
import { CheckSquare, Calendar, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ApprovalCard } from './ApprovalCard'
import { HrdConfirmDialog } from './HrdConfirmDialog'
import { HrdRejectDialog } from './HrdRejectDialog'
import { formatDate } from '../../utils/helpers'

function SlaResultDialog({ slaInfo, onClose }) {
  const isSystem = slaInfo?.sla_source === 'SYSTEM'
  const explanation = isSystem
    ? 'Tanggal disesuaikan otomatis untuk memenuhi standar waktu layanan rekrutmen.'
    : (slaInfo?.explanation ?? 'Permintaan telah disetujui.')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          {isSystem
            ? <AlertTriangle size={24} className="text-amber-500 shrink-0" />
            : <CheckCircle2  size={24} className="text-green-600 shrink-0" />}
          <h3 className="font-display font-bold text-navy text-lg">Rekrutmen Dibuka!</h3>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wide ${isSystem ? 'text-amber-600' : 'text-green-700'}`}>
          {isSystem ? '⚠️ Catatan Sistem:' : '✅ SLA Mulai Berjalan:'}
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>
        {slaInfo?.final_target_date && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Target Rekrutmen Selesai:</p>
            <p className="text-xl font-display font-black text-sapphire">
              {formatDate(slaInfo.final_target_date)}
            </p>
          </div>
        )}
        <button onClick={onClose} className="btn-primary w-full justify-center">Mengerti</button>
      </div>
    </div>
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

  const pendingCount  = list.filter(item =>  isPending(item)).length
  const approvedCount = list.filter(item => !isPending(item)).length
  const allCount      = list.length

  const filteredList = useMemo(() => {
    let items = list

    if (tab === 'pending')  items = items.filter(item =>  isPending(item))
    if (tab === 'approved') items = items.filter(item => !isPending(item))

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(item =>
        item.jab_nama?.toLowerCase().includes(q) ||
        item.tpk_nomor?.toLowerCase().includes(q) ||
        item.tpk_bagian?.toLowerCase().includes(q)
      )
    }

    if (activePeriodFilter) {
      items = items.filter(item =>
        matchesPeriodFilter(item.tpk_tanggal, activePeriodFilter)
      )
    }

    return items
  }, [list, tab, search, activePeriodFilter])

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
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isHrd ? 'Persetujuan HRD' : 'Persetujuan Atasan'}
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {STATUS_TABS.map(t => {
            const isActive = tab === t.key
            const count    = countFor(t.key)
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch('') }}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'
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
                {!isActive && t.key === 'pending' && pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                )}
              </button>
            )
          })}
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
          <span className="max-w-[120px] truncate">{periodToLabel(activePeriodFilter)}</span>
          {activePeriodFilter && (
            <X size={12} onClick={(e) => { e.stopPropagation(); setActivePeriodFilter(null) }} />
          )}
        </button>
      </div>

      {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
        <p className="text-xs text-sapphire">Difilter dari Dashboard · Tap tanggal untuk ubah</p>
      )}

      {!loading && !error && list.length > 0 && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari jabatan / nomor / bagian..."
          className="max-w-md"
        />
      )}

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorBox message="Gagal memuat data approval." onRetry={refetch} />
      ) : filteredList.length === 0 ? (
        <EmptyState message={emptyMessage} icon={CheckSquare} />
      ) : (
        <div className="space-y-4">
          {filteredList.map(item => (
            <ApprovalCard
              key={item.tpk_nomor}
              item={item}
              isHrd={isHrd}
              pending={isPending(item)}
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
      )}

      {/* Period Picker */}
      {showPeriodPicker && (
        <PeriodPickerModal
          current={activePeriodFilter}
          onSelect={(val) => { setActivePeriodFilter(val); setShowPeriodPicker(false) }}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}

      {/* Atasan Confirm Dialog */}
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

      {/* HRD Approve Dialog */}
      {isHrdDialogItem && (
        <HrdConfirmDialog
          item={isHrdDialogItem}
          loading={hrdApproveMut.isPending}
          onConfirm={() => hrdApproveMut.mutate({ tpk_nomor: isHrdDialogItem.tpk_nomor })}
          onClose={() => setIsHrdDialogItem(null)}
        />
      )}

      {/* HRD Reject Dialog — dengan alasan */}
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

      {/* Dialog Hasil SLA (dari HRD approve) */}
      {slaResultInfo && (
        <SlaResultDialog
          slaInfo={slaResultInfo}
          onClose={() => setSlaResultInfo(null)}
        />
      )}
    </div>
  )
}