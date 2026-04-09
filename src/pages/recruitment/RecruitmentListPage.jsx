// src/pages/recruitment/RecruitmentListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { recruitmentApi } from '../../api/services'
import { formatDate, getApprovalStatus } from '../../utils/helpers'
import { Badge, EmptyState, PageLoader, ErrorBox, ConfirmDialog, Spinner } from '../../components/ui'
import { Plus, Search, Filter, Trash2, Calendar, Edit2, Eye, Layers, X, DateRange } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Period Options (identik Android PeriodPickerSheet) ────────────────────────
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

/**
 * Filter tanggal item berdasarkan period string
 * Identik dengan Android matchesPeriodFilter() di RecruitmentListScreen
 */
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
        // Single date YYYY-MM-DD
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
      const parts = period.replace(/custom:/i, '').trim().split(/,| - /)
      if (parts.length >= 2) {
        const fmt = (s) => new Date(s.trim() + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        return `${fmt(parts[0])} – ${fmt(parts[1])}`
      }
    } catch { return 'Rentang Kustom' }
  }
  return period
}

const STATUS_OPTS = [
  { value: 'all',      label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

/**
 * RecruitmentListPage
 * @param {string|null} initialPeriodFilter - period dari URL query param ?period=
 *   Identik Android: initialPeriodFilter: String? = null yang diterima dari Navigation
 */
export default function RecruitmentListPage({ initialPeriodFilter = null }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('all')
  const [selected, setSelected]   = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Period filter — inisialisasi dari prop (diteruskan dari Dashboard via URL)
  const [activePeriodFilter, setActivePeriodFilter] = useState(initialPeriodFilter ?? null)
  const [showPeriodPicker, setShowPeriodPicker]     = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')

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
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Gagal menghapus.'),
  })

  const filtered = useMemo(() => {
    if (!raw) return []
    let list = raw
    // Filter status
    if (status === 'pending')  list = list.filter(r => r.tpk_approveatasan === 0 || (r.tpk_approveatasan === 1 && r.tpk_approveHRD === 0))
    if (status === 'approved') list = list.filter(r => r.tpk_approveatasan === 1 && r.tpk_approveHRD === 1)
    if (status === 'rejected') list = list.filter(r => r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2)
    // Filter teks
    if (search) list = list.filter(r =>
      r.jab_nama.toLowerCase().includes(search.toLowerCase()) ||
      r.tpk_nomor.toLowerCase().includes(search.toLowerCase())
    )
    // Filter period — identik Android matchesPeriodFilter()
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

  const applyCustomPeriod = () => {
    if (customStart && customEnd) {
      setActivePeriodFilter(`Custom: ${customStart} - ${customEnd}`)
      setShowPeriodPicker(false)
    }
  }

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

      {/* ── Filter Bar — identik Android (StatusChips + DateButton) ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Cari jabatan / nomor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Status chips */}
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

        {/* Period filter button — identik Android OutlinedButton tanggal */}
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

        {/* Hint: tekan & tahan — identik Android AnimatedVisibility hint */}
        {hasPendingItems && (
          <p className="w-full text-xs text-slate-400 flex items-center gap-1">
            <span>☝️</span> Centang permintaan Pending Atasan untuk menghapus
          </p>
        )}

        {/* Batch delete */}
        {selected.size > 0 && (
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Hapus ({selected.size})
          </button>
        )}
      </div>

      {/* Hint saat period dari Dashboard */}
      {activePeriodFilter && activePeriodFilter === initialPeriodFilter && (
        <p className="text-xs text-sapphire">Difilter dari Dashboard · Tap tanggal untuk ubah</p>
      )}

      {/* ── Table ── */}
      {isLoading ? <PageLoader /> : isError ? <ErrorBox message="Gagal memuat data." onRetry={refetch} /> : (
        filtered.length === 0 ? (
          <EmptyState
            message={activePeriodFilter
              ? `Tidak ada permintaan pada periode: ${periodToLabel(activePeriodFilter)}`
              : 'Tidak ada permintaan yang cocok.'}
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
                    <input type="checkbox" className="accent-sapphire" onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(filtered.filter(r => isPending(r) && isOwner(r)).map(r => r.tpk_nomor)))
                      } else {
                        setSelected(new Set())
                      }
                    }} />
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
                        <span className="badge text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#fef2f2'
                              : r.tpk_approveHRD === 1 ? '#f0fdf4' : '#fff7ed',
                            color: r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2 ? '#991b1b'
                              : r.tpk_approveHRD === 1 ? '#166534' : '#c2410c',
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
                          <button className="btn-icon p-1.5" title="Detail" onClick={() => navigate(`/recruitment/${encodeURIComponent(r.tpk_nomor)}`)}>
                            <Eye size={15} />
                          </button>
                          {canEdit && (
                            <button className="btn-icon p-1.5 text-sapphire" title="Edit" onClick={() => navigate(`/recruitment/edit/${encodeURIComponent(r.tpk_nomor)}`)}>
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

      {/* ── Period Picker Modal ── */}
      {showPeriodPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && setShowPeriodPicker(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-navy">Pilih Periode</h3>
              <button onClick={() => setShowPeriodPicker(false)} className="btn-icon text-slate-400"><X size={18} /></button>
            </div>
            <div className="flex gap-0 p-5">
              {/* Preset */}
              <div className="flex-1 pr-4 border-r border-slate-100 space-y-0.5">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value ?? 'all'}
                    onClick={() => { setActivePeriodFilter(opt.value); setShowPeriodPicker(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      activePeriodFilter === opt.value
                        ? 'bg-red-50 text-red-500 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Custom range */}
              <div className="flex-1 pl-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rentang Kustom</p>
                <div>
                  <label className="label">Dari</label>
                  <input type="date" className="input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div>
                  <label className="label">Sampai</label>
                  <input type="date" className="input" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)} />
                </div>
                <button onClick={applyCustomPeriod} disabled={!customStart || !customEnd} className="btn-primary justify-center disabled:opacity-40">
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
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