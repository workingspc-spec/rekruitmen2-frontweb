// src/pages/approval/ApprovalListPage.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApprovalList } from '../../hooks/useApprovalList'
import { PageLoader, ErrorBox, EmptyState, ConfirmDialog, SearchInput } from '../../components/ui'
import { CheckSquare } from 'lucide-react'
import { ApprovalCard } from './ApprovalCard'
import { HrdConfirmDialog } from './HrdConfirmDialog'

const TABS = [
  { key: 'pending',  label: 'Perlu Diproses' },
  { key: 'approved', label: 'Sudah Disetujui' },
  { key: 'all',      label: 'Semua' },
]

export default function ApprovalListPage() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('pending')
  const [search, setSearch] = useState('')  // Fix 4: search state
  const statusParam = tab === 'all' ? undefined : tab

  const {
    list, loading, error, refetch, isHrd,
    confirmItem, setConfirmItem,
    isHrdDialogItem, setIsHrdDialogItem,
    atasanMut, hrdMut, isPending,
  } = useApprovalList(statusParam)

  // Fix 4: filter lokal tanpa request ulang ke API
  const filteredList = useMemo(() => {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(item =>
      item.jab_nama?.toLowerCase().includes(q) ||
      item.tpk_nomor?.toLowerCase().includes(q) ||
      item.tpk_bagian?.toLowerCase().includes(q)
    )
  }, [list, search])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isHrd ? 'Persetujuan HRD' : 'Persetujuan Atasan'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch('') }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              tab === t.key
                ? 'bg-white shadow text-sapphire'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fix 4: Search — muncul hanya jika data sudah ada */}
      {!loading && !error && list.length > 0 && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari jabatan / nomor / bagian..."
          className="max-w-md"
        />
      )}

      {/* Content */}
      {loading ? <PageLoader /> :
       error   ? <ErrorBox message="Gagal memuat data approval." onRetry={refetch} /> :
       filteredList.length === 0 ? (
         <EmptyState
           message={
             search
               ? `Tidak ada hasil untuk "${search}".`
               : tab === 'pending'
                 ? 'Tidak ada permintaan yang perlu diproses.'
                 : 'Tidak ada data.'
           }
           icon={CheckSquare}
         />
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
       )
      }

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
          loading={hrdMut.isPending}
          onConfirm={() => hrdMut.mutate({ tpk_nomor: isHrdDialogItem.tpk_nomor })}
          onClose={() => setIsHrdDialogItem(null)}
        />
      )}
    </div>
  )
}