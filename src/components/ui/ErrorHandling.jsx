import { Component, createContext, useContext, useState, useCallback } from 'react'
import clsx from 'clsx'

/* ── Toast context ──────────────────────────────────────── */
const ToastContext = createContext(null)

let _toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'error', message, duration = 4000 }) => {
    const id = ++_toastId
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const dismiss = (id) => setToasts(t => t.filter(x => x.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl animate-fade-up',
              toast.type === 'error'   && 'bg-ink-900 border-ruby-500/40 text-ruby-300',
              toast.type === 'success' && 'bg-ink-900 border-emerald-500/40 text-emerald-300',
              toast.type === 'warning' && 'bg-ink-900 border-amber-500/40 text-amber-300',
              toast.type === 'info'    && 'bg-ink-900 border-sapphire-500/40 text-sapphire-300',
            )}
          >
            <span className="text-base mt-0.5 shrink-0">
              {toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <p className="text-sm flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 text-xs"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx.addToast
}

/* ── Standard API error parser ──────────────────────────── */
export function parseApiError(err) {
  if (!err) return 'An unexpected error occurred'
  if (err.response?.data?.message) return err.response.data.message
  if (err.response?.status === 400) return 'Invalid request — check your inputs'
  if (err.response?.status === 401) return 'Session expired — please sign in again'
  if (err.response?.status === 403) return 'You do not have permission to perform this action'
  if (err.response?.status === 404) return 'Resource not found'
  if (err.response?.status === 409) return 'Conflict — resource already exists'
  if (err.response?.status === 422) return 'Validation failed — check the form fields'
  if (err.response?.status >= 500) return 'Server error — please try again later'
  if (err.message === 'Network Error') return 'Network error — check your connection'
  return err.message || 'Something went wrong'
}

/* ── React Error Boundary ───────────────────────────────── */
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-5xl mb-5">⚠</div>
            <h2 className="font-display text-2xl font-bold text-ink-100 mb-3">Something went wrong</h2>
            <p className="text-ink-400 text-sm mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ── Standardized API error display component ───────────── */
export function ApiError({ error, className = '' }) {
  if (!error) return null
  const message = parseApiError(error)
  return (
    <div className={clsx(
      'border border-ruby-500/30 bg-ruby-500/10 rounded-xl px-4 py-3 text-sm text-ruby-300',
      className
    )}>
      {message}
    </div>
  )
}
