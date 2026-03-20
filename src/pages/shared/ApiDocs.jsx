import { useState } from 'react'
import clsx from 'clsx'

const BASE = 'http://localhost:8081'

/* All endpoints from the OpenAPI spec, grouped by tag */
const ENDPOINT_GROUPS = [
  {
    tag: 'OTP APIs',
    color: 'sapphire',
    endpoints: [
      { method: 'POST', path: '/auth/otp/send',   summary: 'Send OTP',            auth: false },
      { method: 'POST', path: '/auth/otp/verify', summary: 'Verify OTP & create user', auth: false },
    ],
  },
  {
    tag: 'User APIs',
    color: 'teal',
    endpoints: [
      { method: 'POST',   path: '/register',  summary: 'Complete registration',  auth: true, params: ['userId'] },
      { method: 'GET',    path: '/me',         summary: 'Get my profile',          auth: true },
      { method: 'PUT',    path: '/me',         summary: 'Update my profile',       auth: true },
      { method: 'GET',    path: '/admin',      summary: 'List all admins',         auth: true, role: 'ADMIN' },
      { method: 'POST',   path: '/admin',      summary: 'Create admin',            auth: true, role: 'ADMIN' },
      { method: 'DELETE', path: '/admin/{id}', summary: 'Delete admin',            auth: true, role: 'ADMIN' },
    ],
  },
  {
    tag: 'KYC APIs',
    color: 'amber',
    endpoints: [
      { method: 'POST',  path: '/kyc/submit',        summary: 'Submit KYC document',  auth: true, params: ['userId'] },
      { method: 'GET',   path: '/kyc/{userId}',      summary: 'Get KYC documents',    auth: true },
      { method: 'PATCH', path: '/kyc/approve/{docId}', summary: 'Approve document',   auth: true, role: 'ADMIN' },
      { method: 'PATCH', path: '/kyc/reject/{docId}',  summary: 'Reject document',    auth: true, role: 'ADMIN', params: ['reason'] },
    ],
  },
  {
    tag: 'Loan Product APIs',
    color: 'purple',
    endpoints: [
      { method: 'GET',    path: '/loan-products',      summary: 'List all active',   auth: false },
      { method: 'POST',   path: '/loan-products',      summary: 'Create product',    auth: true, role: 'ADMIN' },
      { method: 'GET',    path: '/loan-products/{id}', summary: 'Get by ID',         auth: false },
      { method: 'PUT',    path: '/loan-products/{id}', summary: 'Update product',    auth: true, role: 'ADMIN' },
      { method: 'DELETE', path: '/loan-products/{id}', summary: 'Deactivate',        auth: true, role: 'ADMIN' },
    ],
  },
  {
    tag: 'Savings Product APIs',
    color: 'green',
    endpoints: [
      { method: 'GET',    path: '/savings-products',      summary: 'List all active',  auth: false },
      { method: 'POST',   path: '/savings-products',      summary: 'Create product',   auth: true, role: 'ADMIN' },
      { method: 'GET',    path: '/savings-products/{id}', summary: 'Get by ID',        auth: false },
      { method: 'PUT',    path: '/savings-products/{id}', summary: 'Update product',   auth: true, role: 'ADMIN' },
      { method: 'DELETE', path: '/savings-products/{id}', summary: 'Deactivate',       auth: true, role: 'ADMIN' },
    ],
  },
  {
    tag: 'Bank Account APIs',
    color: 'coral',
    endpoints: [
      { method: 'POST', path: '/accounts/savings',              summary: 'Open savings account',    auth: true },
      { method: 'POST', path: '/accounts/loan',                 summary: 'Open loan account',       auth: true },
      { method: 'GET',  path: '/accounts/{accountId}',          summary: 'Get account by ID',       auth: true },
      { method: 'GET',  path: '/accounts/user/{userId}',        summary: 'Get all user accounts',   auth: true },
      { method: 'POST', path: '/accounts/{accountId}/deposit',  summary: 'Deposit',                 auth: true },
      { method: 'POST', path: '/accounts/{accountId}/withdraw', summary: 'Withdraw',                auth: true },
    ],
  },
  {
    tag: 'Lender Preference APIs',
    color: 'emerald',
    endpoints: [
      { method: 'GET',   path: '/lender-preferences',             summary: 'All active prefs (ADMIN)',  auth: true, role: 'ADMIN' },
      { method: 'POST',  path: '/lender-preferences',             summary: 'Save/update preference',    auth: true, params: ['lenderId'] },
      { method: 'GET',   path: '/lender-preferences/my',          summary: 'My preferences',            auth: true, params: ['lenderId'] },
      { method: 'PATCH', path: '/lender-preferences/deactivate',  summary: 'Deactivate preference',     auth: true, params: ['lenderId','loanProductId'] },
    ],
  },
  {
    tag: 'Loan Request APIs',
    color: 'gold',
    endpoints: [
      { method: 'POST',  path: '/loan-requests',                 summary: 'Submit loan request (BORROWER)',  auth: true, params: ['borrowerId'] },
      { method: 'GET',   path: '/loan-requests',                 summary: 'All requests (ADMIN)',            auth: true, role: 'ADMIN', params: ['status?'] },
      { method: 'GET',   path: '/loan-requests/{requestId}',     summary: 'Get by ID (ADMIN)',               auth: true, role: 'ADMIN' },
      { method: 'GET',   path: '/loan-requests/my',              summary: 'My requests (BORROWER)',          auth: true, params: ['borrowerId'] },
      { method: 'PATCH', path: '/loan-requests/{id}/cancel',     summary: 'Cancel (BORROWER)',               auth: true, params: ['borrowerId'] },
      { method: 'GET',   path: '/loan-requests/open',            summary: 'Browse open (LENDER)',            auth: true, params: ['lenderId'] },
      { method: 'GET',   path: '/loan-requests/open/matching',   summary: 'Matching requests (LENDER)',      auth: true, params: ['lenderId'] },
      { method: 'GET',   path: '/loan-requests/matched',         summary: 'Matched requests (LENDER)',       auth: true },
      { method: 'PATCH', path: '/loan-requests/{id}/accept',     summary: 'Accept (LENDER)',                 auth: true, params: ['lenderId'] },
      { method: 'PATCH', path: '/loan-requests/{id}/match',      summary: 'Mark matched (ADMIN)',            auth: true, role: 'ADMIN' },
      { method: 'PATCH', path: '/loan-requests/{id}/reject',     summary: 'Reject (ADMIN)',                  auth: true, role: 'ADMIN', params: ['reason'] },
    ],
  },
  {
    tag: 'Disbursement & EMI (Week 5+)',
    color: 'ruby',
    endpoints: [
      { method: 'POST', path: '/disbursements/{requestId}',        summary: 'Disburse loan (ADMIN)',     auth: true, role: 'ADMIN' },
      { method: 'GET',  path: '/emi-schedule/{loanId}',            summary: 'Get EMI schedule',          auth: true },
      { method: 'POST', path: '/repayments/{emiId}/pay',           summary: 'Pay EMI instalment',        auth: true },
      { method: 'GET',  path: '/loans/{loanId}/summary',           summary: 'Loan summary',              auth: true },
      { method: 'POST', path: '/repayments/{loanId}/partial',      summary: 'Partial repayment',         auth: true },
      { method: 'GET',  path: '/repayments/{loanId}/early-close-quote', summary: 'Early closure quote',  auth: true },
      { method: 'POST', path: '/repayments/{loanId}/early-close',  summary: 'Early closure',             auth: true },
    ],
  },
  {
    tag: 'Credit Score & Analytics (Week 7+)',
    color: 'ink',
    endpoints: [
      { method: 'GET', path: '/credit-score/{userId}',     summary: 'Get credit score',      auth: true },
      { method: 'GET', path: '/loans/{loanId}/state-history', summary: 'Loan state history', auth: true },
    ],
  },
]

const METHOD_STYLE = {
  GET:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST:   'bg-sapphire-500/15 text-sapphire-400 border-sapphire-500/30',
  PUT:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PATCH:  'bg-gold-500/15 text-gold-400 border-gold-500/30',
  DELETE: 'bg-ruby-500/15 text-ruby-400 border-ruby-500/30',
}

const GROUP_COLOR = {
  sapphire: 'border-l-sapphire-500',
  teal:     'border-l-teal-500',
  amber:    'border-l-amber-500',
  purple:   'border-l-purple-500',
  green:    'border-l-green-500',
  coral:    'border-l-coral-500',
  emerald:  'border-l-emerald-500',
  gold:     'border-l-gold-500',
  ruby:     'border-l-ruby-500',
  ink:      'border-l-ink-400',
}

export default function ApiDocsPage() {
  const [openGroup, setOpenGroup] = useState('Loan Request APIs')
  const [search, setSearch] = useState('')
  const totalEndpoints = ENDPOINT_GROUPS.reduce((s, g) => s + g.endpoints.length, 0)

  const filtered = ENDPOINT_GROUPS.map(g => ({
    ...g,
    endpoints: g.endpoints.filter(e =>
      !search ||
      e.path.toLowerCase().includes(search.toLowerCase()) ||
      e.summary.toLowerCase().includes(search.toLowerCase()) ||
      e.method.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => !search || g.endpoints.length > 0)

  return (
    <div className="animate-fade-up">
      <SectionHeader title="API Documentation" subtitle={`${totalEndpoints} endpoints across ${ENDPOINT_GROUPS.length} tag groups`} />

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <a
          href={`${BASE}/swagger-ui/index.html`}
          target="_blank" rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 hover:border-gold-500/30 transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400 text-lg">⚡</div>
          <div>
            <p className="text-sm font-medium text-ink-200">Swagger UI</p>
            <p className="text-xs text-ink-400">Interactive API explorer</p>
          </div>
        </a>
        <a
          href={`${BASE}/v3/api-docs`}
          target="_blank" rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 hover:border-sapphire-500/30 transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-sapphire-500/10 flex items-center justify-center text-sapphire-400 text-lg">{'{ }'}</div>
          <div>
            <p className="text-sm font-medium text-ink-200">OpenAPI JSON</p>
            <p className="text-xs text-ink-400">Raw spec at /v3/api-docs</p>
          </div>
        </a>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">🔐</div>
          <div>
            <p className="text-sm font-medium text-ink-200">Auth: Basic</p>
            <p className="text-xs text-ink-400">phone:password → JWT (Wk 6)</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="input"
          placeholder="Search endpoints… (e.g. /loan-requests, GET, KYC)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Endpoint groups */}
      <div className="space-y-3">
        {filtered.map(group => (
          <div key={group.tag} className={clsx('card border-l-4 overflow-hidden', GROUP_COLOR[group.color] || 'border-l-ink-500')}>
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-800/30 transition-colors"
              onClick={() => setOpenGroup(openGroup === group.tag ? '' : group.tag)}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink-100 text-sm">{group.tag}</span>
                <span className="text-xs text-ink-500">{group.endpoints.length} endpoints</span>
              </div>
              <span className="text-ink-500 text-xs">{openGroup === group.tag ? '▲' : '▼'}</span>
            </button>

            {openGroup === group.tag && (
              <div className="border-t border-ink-700">
                {group.endpoints.map((ep, i) => (
                  <div key={i}
                    className="flex items-start gap-4 px-5 py-3 border-b border-ink-800 last:border-0 hover:bg-ink-800/20 transition-colors"
                  >
                    <span className={clsx('badge border text-xs shrink-0 font-mono w-16 text-center justify-center mt-0.5', METHOD_STYLE[ep.method])}>
                      {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono text-ink-200">{ep.path}</code>
                        {ep.role && (
                          <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">
                            {ep.role}
                          </span>
                        )}
                        {!ep.auth && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            PUBLIC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">{ep.summary}</p>
                      {ep.params && (
                        <p className="text-xs text-ink-500 mt-0.5">
                          Params: {ep.params.map(p => <code key={p} className="text-amber-400 mr-1">{p}</code>)}
                        </p>
                      )}
                    </div>
                    <a
                      href={`${BASE}/swagger-ui/index.html#/${group.tag.replace(/ /g,'%20')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-500 hover:text-gold-400 transition-colors shrink-0 mt-1"
                    >
                      Try →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── sub-component for import in Profile.jsx ─── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="w-8 h-0.5 bg-gold-500 rounded-full mb-2" />
        <h2 className="font-display text-lg text-ink-100 font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
