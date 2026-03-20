import { useState } from 'react'
import clsx from 'clsx'

const STATES = [
  {
    id: 'PENDING',
    label: 'Pending',
    color: 'border-amber-500 bg-amber-500/10',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
    description: 'Borrower submitted. Awaiting admin matchmaking.',
    actor: 'BORROWER',
    actions: ['Submit request', 'Cancel request'],
  },
  {
    id: 'MATCHED',
    label: 'Matched',
    color: 'border-sapphire-500 bg-sapphire-500/10',
    dot: 'bg-sapphire-500',
    text: 'text-sapphire-400',
    description: 'Admin matched with a lender. Lender must accept or reject.',
    actor: 'ADMIN',
    actions: ['Mark as matched', 'Reject request'],
  },
  {
    id: 'ACCEPTED',
    label: 'Accepted',
    color: 'border-emerald-500 bg-emerald-500/10',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    description: 'Lender accepted. Awaiting admin disbursement.',
    actor: 'LENDER',
    actions: ['Accept (auto-rejects others)'],
  },
  {
    id: 'DISBURSED',
    label: 'Disbursed',
    color: 'border-gold-500 bg-gold-500/10',
    dot: 'bg-gold-500',
    text: 'text-gold-400',
    description: 'Loan disbursed. EMI schedule generated. Repayment begins.',
    actor: 'ADMIN',
    actions: ['Disburse funds', 'Generate EMI schedule'],
  },
]

const TERMINAL = [
  { id: 'REJECTED', label: 'Rejected', color: 'border-ruby-500 bg-ruby-500/10', dot: 'bg-ruby-500', text: 'text-ruby-400', description: 'Admin or system rejected the request.', actor: 'ADMIN', actions: ['Reject with reason'] },
  { id: 'CANCELLED', label: 'Cancelled', color: 'border-ink-500 bg-ink-700/30', dot: 'bg-ink-500', text: 'text-ink-400', description: 'Borrower cancelled before matching.', actor: 'BORROWER', actions: ['Cancel pending request'] },
]

const ACTOR_BADGE = {
  BORROWER: 'bg-sapphire-500/10 text-sapphire-400 border-sapphire-500/20',
  LENDER:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ADMIN:    'bg-gold-500/10 text-gold-400 border-gold-500/20',
}

export default function LoanStateMachine() {
  const [active, setActive] = useState('PENDING')
  const current = [...STATES, ...TERMINAL].find(s => s.id === active)

  return (
    <div className="animate-fade-up max-w-4xl">
      <div className="mb-6">
        <div className="accent-line mb-2" />
        <h2 className="section-title">Loan Lifecycle State Machine</h2>
        <p className="section-sub">Full transition map — click any state to inspect</p>
      </div>

      {/* State flow diagram */}
      <div className="card p-6 mb-5">
        {/* Main pipeline */}
        <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
          {STATES.map((s, i) => (
            <div key={s.id} className="flex items-center shrink-0">
              <button
                onClick={() => setActive(s.id)}
                className={clsx(
                  'flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all duration-200',
                  active === s.id ? s.color + ' scale-105 shadow-lg' : 'border-ink-700 bg-ink-800/40 hover:border-ink-600',
                )}
              >
                <div className={clsx('w-3 h-3 rounded-full', active === s.id ? s.dot : 'bg-ink-500')} />
                <span className={clsx('text-xs font-medium whitespace-nowrap', active === s.id ? s.text : 'text-ink-400')}>
                  {s.label}
                </span>
                <span className={clsx('text-xs border rounded-full px-2 py-0.5', ACTOR_BADGE[s.actor])}>
                  {s.actor}
                </span>
              </button>
              {i < STATES.length - 1 && (
                <div className="flex items-center gap-0 mx-1">
                  <div className="w-6 h-px bg-ink-600" />
                  <div className="border-4 border-y-transparent border-l-ink-500 border-r-0 w-0 h-0" style={{ borderLeftWidth: 7, borderTopWidth: 5, borderBottomWidth: 5 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Terminal states fork */}
        <div className="flex items-start gap-4 pl-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-6 bg-ink-700" />
            <div className="text-xs text-ink-500 mb-2">Terminal states</div>
            <div className="flex gap-3">
              {TERMINAL.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all duration-200',
                    active === s.id ? s.color + ' scale-105' : 'border-ink-700 bg-ink-800/40 hover:border-ink-600',
                  )}
                >
                  <div className={clsx('w-3 h-3 rounded-full', active === s.id ? s.dot : 'bg-ink-500')} />
                  <span className={clsx('text-xs font-medium', active === s.id ? s.text : 'text-ink-400')}>
                    {s.label}
                  </span>
                  <span className={clsx('text-xs border rounded-full px-2 py-0.5', ACTOR_BADGE[s.actor])}>
                    {s.actor}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active state detail */}
      {current && (
        <div className={clsx('card p-5 border-l-4 animate-fade-in', current.color.replace('bg-', 'border-l-').split(' ')[0])}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={clsx('w-2.5 h-2.5 rounded-full', current.dot)} />
                <span className={clsx('font-display font-semibold text-lg', current.text)}>{current.label}</span>
              </div>
              <p className="text-sm text-ink-300">{current.description}</p>
            </div>
            <span className={clsx('text-xs border rounded-full px-3 py-1', ACTOR_BADGE[current.actor])}>
              {current.actor}
            </span>
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wider mb-2">Available Actions</p>
            <div className="flex flex-wrap gap-2">
              {current.actions.map(action => (
                <span key={action} className="text-xs bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-ink-300">
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transition rules table */}
      <div className="card overflow-hidden mt-5">
        <div className="px-5 py-4 border-b border-ink-700">
          <p className="text-sm font-medium text-ink-200">Valid Transitions</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Who</th>
              <th>API Endpoint</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {[
              { from: 'PENDING',  to: 'MATCHED',   who: 'ADMIN',    ep: 'PATCH /loan-requests/{id}/match',  cond: 'Request exists and is PENDING' },
              { from: 'PENDING',  to: 'REJECTED',  who: 'ADMIN',    ep: 'PATCH /loan-requests/{id}/reject', cond: 'Any PENDING request' },
              { from: 'PENDING',  to: 'CANCELLED', who: 'BORROWER', ep: 'PATCH /loan-requests/{id}/cancel', cond: 'Borrower owns the request' },
              { from: 'MATCHED',  to: 'ACCEPTED',  who: 'LENDER',   ep: 'PATCH /loan-requests/{id}/accept', cond: 'Lender is matched to request' },
              { from: 'MATCHED',  to: 'REJECTED',  who: 'ADMIN',    ep: 'PATCH /loan-requests/{id}/reject', cond: 'No lender accepted yet' },
              { from: 'ACCEPTED', to: 'DISBURSED', who: 'ADMIN',    ep: 'POST /disbursements/{requestId}',  cond: 'Borrower has active loan account' },
            ].map((t, i) => (
              <tr key={i}>
                <td><span className={clsx('badge', [...STATES,...TERMINAL].find(s=>s.id===t.from)?.color)}>{t.from}</span></td>
                <td><span className={clsx('badge', [...STATES,...TERMINAL].find(s=>s.id===t.to)?.color)}>{t.to}</span></td>
                <td>
                  <span className={clsx('badge border text-xs', ACTOR_BADGE[t.who])}>{t.who}</span>
                </td>
                <td><code className="text-xs font-mono text-ink-300">{t.ep}</code></td>
                <td className="text-xs text-ink-400">{t.cond}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
