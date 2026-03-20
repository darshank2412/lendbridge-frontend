import clsx from 'clsx'
import { getLoanStatusColor, getKycStatusColor } from '../../utils/emi'

/* ── Spinner ──────────────────────────────────────────────────── */
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-ink-700 border-t-gold-500', s, className)} />
  )
}

/* ── Loading page ─────────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 opacity-60">{icon}</div>
      <p className="font-display text-ink-300 font-semibold text-lg">{title}</p>
      {description && <p className="text-ink-500 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── Status Badge ─────────────────────────────────────────────── */
export function StatusBadge({ status, type = 'loan' }) {
  const cls = type === 'kyc' ? getKycStatusColor(status) : getLoanStatusColor(status)
  return <span className={cls}>{status}</span>
}

/* ── Generic badge ────────────────────────────────────────────── */
export function Badge({ children, variant = 'default', className = '' }) {
  const v = {
    default: 'badge bg-ink-700/50 text-ink-300 border border-ink-600',
    success: 'badge-accepted',
    danger: 'badge-rejected',
    warning: 'badge-pending',
    info: 'badge-matched',
    gold: 'badge bg-gold-500/10 text-gold-400 border border-gold-400/20',
  }[variant]
  return <span className={clsx(v, className)}>{children}</span>
}

/* ── Card ─────────────────────────────────────────────────────── */
export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={clsx('card p-5', onClick && 'cursor-pointer hover:border-ink-600 transition-colors', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* ── Stat card ────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-1">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
      {trend !== undefined && (
        <span className={clsx('text-xs mt-1', trend >= 0 ? 'text-emerald-500' : 'text-ruby-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in">
      <div className={clsx('card-glass w-full animate-fade-up', w)}>
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h3 className="font-display font-semibold text-ink-100">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 text-ink-400 hover:text-ink-100">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* ── Form field ───────────────────────────────────────────────── */
export function Field({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="label">
          {label} {required && <span className="text-ruby-500 normal-case tracking-normal">*</span>}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-ruby-500 mt-0.5">{error}</span>}
    </div>
  )
}

/* ── Table ────────────────────────────────────────────────────── */
export function Table({ columns, data, loading, emptyState, onRowClick }) {
  if (loading) return <PageLoader />
  if (!data?.length) return emptyState || <EmptyState title="No records found" />
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Alert ────────────────────────────────────────────────────── */
export function Alert({ type = 'info', message }) {
  if (!message) return null
  const styles = {
    info: 'bg-sapphire-50/10 border-sapphire-500/30 text-sapphire-400',
    error: 'bg-ruby-50/10 border-ruby-500/30 text-ruby-400',
    success: 'bg-emerald-50/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-50/10 border-amber-500/30 text-amber-400',
  }
  return (
    <div className={clsx('border rounded-xl px-4 py-3 text-sm', styles[type])}>
      {message}
    </div>
  )
}

/* ── Section header ───────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="accent-line mb-2" />
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/* ── Progress bar ─────────────────────────────────────────────── */
export function ProgressBar({ value, max, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={clsx('w-full h-1.5 bg-ink-700 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-gold-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
