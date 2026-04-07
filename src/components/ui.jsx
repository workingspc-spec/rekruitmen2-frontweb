import { clsx } from 'clsx'
import { Loader2, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-sapphire ${className}`} />
}

// ── FULL PAGE LOADER ──────────────────────────────────────────────────────────
export function PageLoader({ message = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
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
      <p className="text-sm text-center max-w-xs">{message}</p>
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
      <p className="text-sm text-center max-w-xs text-slate-600">{message}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Coba Lagi</button>}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-navy text-lg">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 pb-5 flex justify-end gap-3 border-t border-slate-50 pt-4">{footer}</div>}
      </div>
    </div>
  )
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Ya', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <button className="btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size={16} /> : confirmText}
        </button>
      </>
    }>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#0F52BA', className = '' }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className={`h-2 bg-slate-100 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

// ── SELECT ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, placeholder = 'Pilih...', required, disabled }) {
  return (
    <div>
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input appearance-none"
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
    <div>
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input className={clsx('input', error && 'border-red-400 focus:ring-red-300')} required={required} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint  && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── TEXTAREA ──────────────────────────────────────────────────────────────────
export function TextArea({ label, required, error, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea
        className={clsx('input resize-none', error && 'border-red-400')}
        required={required}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = '#0F52BA', onClick, alert }) {
  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:shadow-card-hover transition-shadow duration-200 relative overflow-hidden"
    >
      {alert && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
          {Icon && <Icon size={20} style={{ color }} />}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-display font-bold mt-0.5" style={{ color }}>{value}</p>
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
        </button>
      ))}
    </div>
  )
}

// ── ALERT BANNER ─────────────────────────────────────────────────────────────
export function AlertBanner({ type = 'info', message, onAction, actionLabel }) {
  const styles = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', Icon: Info },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', Icon: AlertTriangle },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', Icon: CheckCircle2 },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', Icon: XCircle },
  }
  const { bg, border, text, Icon } = styles[type]
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border" style={{ background: bg, borderColor: border, color: text }}>
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {onAction && <button className="text-xs underline font-semibold" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}