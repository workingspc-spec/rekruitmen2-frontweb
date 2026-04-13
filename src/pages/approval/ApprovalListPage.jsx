// src/pages/approval/ApprovalListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApprovalList } from '../../hooks/useApprovalList'
import { PageLoader, ErrorBox, EmptyState, ConfirmDialog, SearchInput } from '../../components/ui'
import { PeriodPickerModal } from '../../components/PeriodPickerModal'
import { CheckSquare, Calendar, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ApprovalCard } from './ApprovalCard'
import { HrdConfirmDialog } from './HrdConfirmDialog'
import { formatDate } from '../../utils/helpers'

// ─── Period Options ────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: null,          label: 'Semua Waktu' },
  { value: 'Today',       label: 'Hari Ini' },
  { value: 'Yesterday',   label: 'Kemarin' },
  { value: 'This week',   label: 'Minggu Ini' },
  { value: 'Last week',   label: 'Minggu Lalu' },
  { value: 'This month',  label: 'Bulan Ini' },
  { value: 'Last month',  label: 'Bulan Lalu' },
  { value: 'This year',   label: 'Tahun Ini' },
  { value: 'Last year',   label: 'Tahun Lalu' },
]

function matchesPeriodFilter(tpkTanggal, period) {
  if (!tpkTanggal || !period) return true
  try {
    const itemDate = new Date(tpkTanggal.substring(0, 10) + 'T00:00:00')
    const today    = new Date(); today.setHours(0, 0, 0, 0)

    switch (period.toLowerCase()) {
      case 'today':     return itemDate.toDateString() === today.toDateString()
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1)
        return itemDate.toDateString() === y.toDateString()
      }
      case 'this week': {
        const mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() || 7) + 1)
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return itemDate >= mon && itemDate <= sun
      }
      case 'last week': {
        const mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() || 7) - 6)
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return itemDate >= mon && itemDate <= sun
      }
      case 'this month':
        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear()
      case 'last month': {
        const lm = new Date(today); lm.setMonth(lm.getMonth() - 1)
        return itemDate.getMonth() === lm.getMonth() && itemDate.getFullYear() === lm.getFullYear()
      }
      case 'this year':  return itemDate.getFullYear() === today.getFullYear()
      case 'last year':  return itemDate.getFullYear() === today.getFullYear() - 1
      default: {
        if (period.toLowerCase().startsWith('custom:')) {
          const rangeStr = period.replace(/custom:/i, '').trim()
          const parts = rangeStr.includes(',') ? rangeStr.split(',') : rangeStr.split(' - ')
          if (parts.length === 2) {
            const start = new Date(parts[0].trim() + 'T00:00:00')
            const end   = new Date(parts[1].trim() + 'T00:00:00')
            return itemDate >= start && itemDate <= end
          }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
          return itemDate.toDateString() === new Date(period + 'T00:00:00').toDateString()
        }
        return true
      }
    }
  } catch { return true }
}

function periodToLabel(period) {
  if (!period) return 'Semua Waktu'
  const match = PERIOD_OPTIONS.find(o => o.value === period)
  if (match) return match.label
  if (period.toLowerCase().startsWith('custom:')) {
    try {
      const rangeStr = period.replace(/custom:/i, '').trim()
      const parts = rangeStr.includes(',') ? rangeStr.split(',') : rangeStr.split(' - ')
      if (parts.length >= 2) {
        const fmt = (s) => new Date(s.trim() + 'T00:00:00')
          .toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        return `${fmt(parts[0])} – ${fmt(parts[1])}`
      }
    } catch { return 'Rentang Kustom' }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    try {
      return new Date(period + 'T00:00:00')
        .toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return period }
  }
  return period
}

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
            : <CheckCircle2 size={24} className="text-green-600 shrink-0" />}
          <h3 className="font-display font-bold text-navy text-lg">Approval Berhasil</h3>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wide ${isSystem ? 'text-amber-600' : 'text-green-700'}`}>
          {isSystem ? '⚠️ Catatan Sistem:' : '✅ Konfirmasi:'}
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

export default function ApprovalListPage({ initialPeriodFilter = null }) {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('pending')
  const [search, setSearch] = useState('')
  const [activePeriodFilter, setActivePeriodFilter] = useState(initialPeriodFilter ?? null)
  const [showPeriodPicker, setShowPeriodPicker]     = useState(false)

  const statusParam = tab === 'all' ? undefined : tab

  const {
    list, loading, error, refetch, isHrd,
    confirmItem, setConfirmItem,
    isHrdDialogItem, setIsHrdDialogItem,
    slaResultInfo, setSlaResultInfo,
    atasanMut, hrdMut, isPending,
  } = useApprovalList(statusParam)

  // ── Hitung count per tab dari data mentah (sebelum filter search/period) ──
  // list sudah difilter oleh statusParam dari server, jadi kita hitung dari raw list
  // Untuk count badge, kita perlu ALL data — ambil dari useApprovalList dengan status=all
  // Pendekatan pragmatis: hitung dari filteredList dengan tab tertentu
  const rawList = list ?? []
  const pendingCount  = rawList.filter(item => isPending(item)).length
  const approvedCount = rawList.filter(item => !isPending(item)).length
  const allCount      = rawList.length

  const filteredList = useMemo(() => {
    let items = rawList
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(item =>
        item.jab_nama?.toLowerCase().includes(q) ||
        item.tpk_nomor?.toLowerCase().includes(q) ||
        item.tpk_bagian?.toLowerCase().includes(q)
      )
    }
    if (activePeriodFilter) {
      items = items.filter(item => matchesPeriodFilter(item.tpk_tanggal, activePeriodFilter))
    }
    return items
  }, [rawList, search, activePeriodFilter])

  const emptyMessage = (() => {
    const statusMsg = tab === 'pending'
      ? 'Tidak ada permintaan yang menunggu persetujuan'
      : tab === 'approved'
        ? 'Tidak ada permintaan yang sudah disetujui'
        : 'Tidak ada data approval'
    if (activePeriodFilter) return `${statusMsg}\npada periode: ${periodToLabel(activePeriodFilter)}`
    if (search) return `Tidak ada hasil untuk "${search}".`
    return statusMsg
  })()

  // Tab definitions dengan count badge dinamis
  // Note: count ditampilkan dari data yang sudah di-fetch (sesuai statusParam)
  // Saat tab='all', count total; saat tab='pending', count pending; dst.
  const STATUS_TABS = [
    { key: 'all',      label: 'Semua',         count: tab === 'all'      ? allCount : null },
    { key: 'pending',  label: 'Belum Approve',  count: tab === 'pending'  ? pendingCount : null },
    { key: 'approved', label: 'Sudah Approve',  count: tab === 'approved' ? approvedCount : null },
  ]

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
        {/* Tabs dengan count badge */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {STATUS_TABS.map(t => {
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch('') }}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
                {/* Count badge — muncul saat tab aktif dan ada data */}
                {isActive && t.count !== null && t.count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                    t.key === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : t.key === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-sapphire/10 text-sapphire'
                  }`}>
                    {t.count}
                  </span>
                )}
                {/* Dot merah untuk pending saat tab tidak aktif */}
                {!isActive && t.key === 'pending' && pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                )}
              </button>
            )
          })}
        </div>

        {/* Period filter button */}
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
            <X
              size={12}
              onClick={(e) => { e.stopPropagation(); setActivePeriodFilter(null) }}
            />
          )}
        </button>
      </div>

      {/* Hint dari Dashboard */}
      {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
        <p className="text-xs text-sapphire">
          Difilter dari Dashboard · Tap tanggal untuk ubah
        </p>
      )}

      {/* Search */}
      {!loading && !error && rawList.length > 0 && (
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
              onApprove={() => isHrd
                ? setIsHrdDialogItem(item)
                : setConfirmItem({ item, action: 'APPROVE' })
              }
              onReject={() => setConfirmItem({ item, action: 'REJECT' })}
              onDetail={() => navigate(`/recruitment/${encodeURIComponent(item.tpk_nomor)}`)}
            />
          ))}
        </div>
      )}

      {/* Period Picker Modal */}
      {showPeriodPicker && (
        <PeriodPickerModal
          current={activePeriodFilter}
          onSelect={(val) => { setActivePeriodFilter(val); setShowPeriodPicker(false) }}
          onClose={() => setShowPeriodPicker(false)}
        />
      )}

      {/* Confirm Dialog (Atasan) */}
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

      {/* HRD Confirm Dialog */}
      {isHrdDialogItem && (
        <HrdConfirmDialog
          item={isHrdDialogItem}
          loading={hrdMut.isPending}
          onConfirm={() => hrdMut.mutate({ tpk_nomor: isHrdDialogItem.tpk_nomor })}
          onClose={() => setIsHrdDialogItem(null)}
        />
      )}

      {/* Dialog Hasil SLA */}
      {slaResultInfo && (
        <SlaResultDialog
          slaInfo={slaResultInfo}
          onClose={() => setSlaResultInfo(null)}
        />
      )}
    </div>
  )
}