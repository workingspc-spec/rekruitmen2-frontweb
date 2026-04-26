import { clsx } from 'clsx'
import { createPortal } from 'react-dom'
import { Loader2, AlertTriangle, Info, CheckCircle2, XCircle, Search, X } from 'lucide-react'

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-sapphire ${className}`} />
}

// ── PAGE LOADER ───────────────────────────────────────────────────────────────
export function PageLoader({ message = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <Spinner size={32} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

export function CardSkeleton({ rows = 4 }) {
  return (
    <div className="card animate-pulse space-y-3">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// ── RECRUITMENT TABLE SKELETON ─────────────────────────────────────────────────
export function RecruitmentTableSkeleton({ rows = 8 }) {
  return (
    <div className="table-wrapper">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-4 py-3 w-8"><div className="skeleton h-4 w-4 rounded" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-16" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-24" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-20" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-24" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-20" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-16" /></th>
            <th className="px-4 py-3"><div className="skeleton h-3.5 w-24" /></th>
            <th className="px-4 py-3 text-right"><div className="skeleton h-3.5 w-12 ml-auto" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-slate-50">
              <td className="px-4 py-3"><div className="skeleton h-4 w-4 rounded" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-28" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-36" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-24" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-24" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-24" /></td>
              <td className="px-4 py-3"><div className="skeleton h-6 w-24 rounded-full" /></td>
              <td className="px-4 py-3"><div className="skeleton h-4 w-24" /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <div className="skeleton h-8 w-8 rounded-xl" />
                  <div className="skeleton h-8 w-8 rounded-xl" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── APPROVAL CARD SKELETON ─────────────────────────────────────────────────────
export function ApprovalCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-3.5 w-32" />
        </div>
        <div className="skeleton h-7 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="skeleton h-3.5 w-3.5 rounded shrink-0" />
            <div className="skeleton h-3.5 w-28" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <div className="skeleton h-8 w-20 rounded-xl" />
        <div className="flex-1" />
        <div className="skeleton h-8 w-20 rounded-xl" />
        <div className="skeleton h-8 w-24 rounded-xl" />
      </div>
    </div>
  )
}

// ── SLA CARD SKELETON ──────────────────────────────────────────────────────────
export function SlaCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-5 w-52" />
        <div className="skeleton h-3.5 w-36" />
        <div className="flex items-center gap-1.5 mt-2">
          <div className="skeleton h-3 w-3 rounded shrink-0" />
          <div className="skeleton h-3.5 w-40" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <div className="flex justify-between">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-3 w-12" />
        </div>
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="skeleton h-3 w-3 rounded shrink-0" />
        <div className="skeleton h-3 w-40" />
      </div>
    </div>
  )
}

// ── SLA STAT CARDS SKELETON ────────────────────────────────────────────────────
export function SlaStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card py-3 px-2 text-center space-y-1.5">
          <div className="skeleton h-7 w-12 mx-auto rounded" />
          <div className="skeleton h-3 w-16 mx-auto rounded" />
        </div>
      ))}
    </div>
  )
}

// ── BAGIAN CARD SKELETON ───────────────────────────────────────────────────────
export function BagianCardSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-3.5 w-32" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton w-8 h-8 rounded-lg" />
      </div>
    </div>
  )
}

// ── BYPASS USER CARD SKELETON ──────────────────────────────────────────────────
export function BypassUserCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-3.5 w-32" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-3.5 w-3.5 rounded shrink-0" />
          <div className="skeleton h-3.5 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton h-3.5 w-3.5 rounded shrink-0" />
          <div className="skeleton h-3.5 w-48" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex gap-2">
        <div className="skeleton flex-1 h-9 rounded-xl" />
        <div className="skeleton h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

// ── KPI DISTRIBUTION SKELETON ──────────────────────────────────────────────────
export function KpiDistributionSkeleton({ bars = 3 }) {
  return (
    <div className="card space-y-4">
      <div className="skeleton h-5 w-52" />
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="skeleton h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ── KPI ITEM CARD SKELETON ─────────────────────────────────────────────────────
export function KpiItemCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-3.5 w-32" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-evenly gap-4">
        <div className="space-y-1 text-center">
          <div className="skeleton h-3 w-16 mx-auto" />
          <div className="skeleton h-6 w-10 mx-auto" />
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div className="space-y-1 text-center">
          <div className="skeleton h-3 w-16 mx-auto" />
          <div className="skeleton h-6 w-10 mx-auto" />
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div className="space-y-1 text-center">
          <div className="skeleton h-3 w-16 mx-auto" />
          <div className="skeleton h-6 w-10 mx-auto" />
        </div>
      </div>
      <div className="skeleton h-8 w-36 rounded-xl" />
    </div>
  )
}

// ── SLA DETAIL PAGE SKELETON ───────────────────────────────────────────────────
export function SlaDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header card */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: 'linear-gradient(135deg, #c7d8f0 0%, #b0c8e8 100%)' }}>
        <div className="skeleton h-7 w-56 rounded" style={{ background: 'rgba(255,255,255,0.5)' }} />
        <div className="skeleton h-4 w-44 rounded" style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="flex gap-2">
          <div className="skeleton h-7 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="skeleton h-7 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
      {/* Status box */}
      <div className="card space-y-4">
        <div className="skeleton h-28 w-full rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-slate-50">
            <div className="skeleton h-3.5 w-24" />
            <div className="skeleton h-3.5 w-20" />
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div className="card space-y-4">
        <div className="skeleton h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="skeleton w-3 h-3 rounded-full mt-1 shrink-0" />
              {i < 3 && <div className="skeleton w-px flex-1 mt-1" style={{ minHeight: '24px' }} />}
            </div>
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-44" />
              <div className="skeleton h-3.5 w-24" />
            </div>
          </div>
        ))}
      </div>
      {/* Action cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="card space-y-3">
          <div className="skeleton h-5 w-36" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ── RECRUITMENT DETAIL SKELETON ────────────────────────────────────────────────
export function RecruitmentDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Status banner */}
      <div className="skeleton h-14 w-full rounded-2xl" />
      {/* Main info card */}
      <div className="card space-y-4">
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="skeleton h-4 w-4 rounded mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* SLA info card */}
      <div className="card space-y-3">
        <div className="skeleton h-5 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="skeleton h-4 w-36" />
            <div className="skeleton h-4 w-28" />
          </div>
        ))}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <div className="skeleton h-6 w-32 rounded-full" />
        </div>
      </div>
      {/* Alasan */}
      <div className="card space-y-3">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-5 w-48" />
      </div>
      {/* Jobdesk */}
      <div className="card space-y-3">
        <div className="skeleton h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton h-4 w-5 shrink-0" />
            <div className="skeleton h-4 flex-1" />
          </div>
        ))}
      </div>
      {/* Approval status */}
      <div className="card space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="flex justify-between py-1">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-px w-full" />
        <div className="flex justify-between py-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// ── FORM PAGE SKELETON ─────────────────────────────────────────────────────────
export function FormPageSkeleton() {
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Section 1: Jabatan */}
      <div className="card space-y-4">
        <div className="skeleton h-4 w-36 mb-2" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-20" />
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </div>
      {/* Section 2: Kebutuhan */}
      <div className="card space-y-4">
        <div className="skeleton h-4 w-24 mb-2" />
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-36" />
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-8 w-12 rounded" />
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-4 w-12" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </div>
      {/* Section 3: Alasan */}
      <div className="card space-y-4">
        <div className="skeleton h-4 w-36 mb-2" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-16" />
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </div>
      {/* Section 4: Jobdesk */}
      <div className="card space-y-3">
        <div className="skeleton h-4 w-40 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-11 w-full rounded-xl" />
        ))}
      </div>
      {/* Section 5: Spesifikasi */}
      <div className="card space-y-3">
        <div className="skeleton h-4 w-56 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-11 w-full rounded-xl" />
        ))}
      </div>
      {/* Save button */}
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ label, bg, text, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ message = 'Tidak ada data', icon: Icon = Info, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <Icon size={48} strokeWidth={1.3} />
      <p className="text-sm text-center max-w-xs leading-relaxed">{message}</p>
      {action && (
        <button className="btn-primary mt-2" onClick={action}>{actionLabel}</button>
      )}
    </div>
  )
}

// ── ERROR BOX ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
      <AlertTriangle size={40} strokeWidth={1.5} />
      <p className="text-sm text-center max-w-xs text-slate-600 leading-relaxed">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Coba Lagi
        </button>
      )}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }[size]
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto modal-content`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-navy text-lg">{title}</h3>
          <button onClick={onClose} className="btn-icon text-slate-400 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="px-5 pb-5 flex justify-end gap-3 border-t border-slate-50 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onClose, onConfirm,
  title, message, confirmText = 'Ya',
  danger = false, loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size={16} /> : null}
            {loading ? 'Memproses...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#0F52BA', className = '', animated = true }) {
  const pct = Math.min(Math.max(value ?? 0, 0), 100)
  return (
    <div className={`h-2 bg-slate-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${animated ? 'progress-animated' : ''}`}
        style={{
          width: `${pct}%`,
          background: color,
          transition: 'width 0.5s ease-out',
        }}
      />
    </div>
  )
}

// ── SELECT ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, placeholder = 'Pilih...', required, disabled }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── INPUT FIELD ───────────────────────────────────────────────────────────────
export function InputField({ label, required, error, hint, ...props }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={clsx('input', error && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
        required={required}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint  && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── TEXTAREA ──────────────────────────────────────────────────────────────────
export function TextArea({ label, required, error, rows = 3, ...props }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={clsx('input resize-none', error && 'border-red-400')}
        required={required}
        rows={rows}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = '#0F52BA', onClick, alert, subtitle }) {
  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:shadow-card-hover hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
    >
      {alert && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '18' }}
        >
          {Icon && <Icon size={20} style={{ color }} />}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
          <p className="text-2xl font-display font-bold mt-0.5" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-red-500 font-medium mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
    </button>
  )
}

// ── TABS ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150',
            active === t.value
              ? 'bg-white shadow text-sapphire'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={clsx(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
              active === t.value ? 'bg-sapphire/10 text-sapphire' : 'bg-slate-200 text-slate-500'
            )}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── ALERT BANNER ─────────────────────────────────────────────────────────────
export function AlertBanner({ type = 'info', message, onAction, actionLabel }) {
  const styles = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', Icon: Info           },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', Icon: AlertTriangle  },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', Icon: CheckCircle2   },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', Icon: XCircle        },
  }
  const { bg, border, text, Icon } = styles[type] ?? styles.info
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
      style={{ background: bg, borderColor: border, color: text }}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {onAction && (
        <button className="text-xs underline font-semibold" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ── SEARCH INPUT ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Cari...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        className="input pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          onClick={() => onChange('')}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ── STATUS PILL ───────────────────────────────────────────────────────────────
export function StatusPill({ label, bg, text }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  )
}

// ── DIVIDER ───────────────────────────────────────────────────────────────────
export function Divider({ className = '' }) {
  return <div className={`border-t border-slate-100 ${className}`} />
}