import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import {
  getMyLoanRequests, getEmiSchedule, getRepaymentHistory,
  makePartialRepayment, makeEarlyClosureRepayment, getEarlyClosureQuote
} from '../../api/services'
import {
  SectionHeader, Modal, Field, Alert, PageLoader, EmptyState, ProgressBar
} from '../../components/ui'
import { generateAmortization, calculateEmi, formatINR, formatDate, round2 } from '../../utils/emi'
import clsx from 'clsx'

/* ── EMI status helper ──────────────────────────────────── */
function emiStatus(emi, paidSet) {
  if (paidSet.has(emi.emiNumber)) return 'PAID'
  const today = new Date()
  const due   = new Date(emi.dueDate)
  return due < today ? 'OVERDUE' : 'PENDING'
}

const statusStyle = {
  PAID:    'badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  OVERDUE: 'badge bg-ruby-500/10 text-ruby-400 border border-ruby-500/20',
  PENDING: 'badge bg-amber-500/10 text-amber-400 border border-amber-500/20',
}

export default function RepaymentsPage() {
  const { getUserId } = useAuthStore()
  const userId = getUserId()
  const qc = useQueryClient()

  const [selectedLoan, setSelectedLoan] = useState(null)
  const [partialModal, setPartialModal] = useState(false)
  const [earlyModal, setEarlyModal] = useState(false)
  const [partialAmount, setPartialAmount] = useState('')
  const [error, setError] = useState('')
  const [paidEmis] = useState(new Set()) // will come from API when wired

  /* Fetch disbursed loan requests */
  const { data: loansRes, isLoading } = useQuery({
    queryKey: ['my-loan-requests', userId],
    queryFn: () => getMyLoanRequests(userId),
    enabled: !!userId,
  })

  const disbursedLoans = (loansRes?.data?.data || []).filter(l => l.status === 'DISBURSED')

  /* Early closure quote */
  const { data: quoteRes } = useQuery({
    queryKey: ['early-quote', selectedLoan?.id],
    queryFn: () => getEarlyClosureQuote(selectedLoan.id),
    enabled: !!selectedLoan && earlyModal,
    retry: false,
  })

  const partialMutation = useMutation({
    mutationFn: () => makePartialRepayment(selectedLoan.id, { amount: Number(partialAmount) }),
    onSuccess: () => { qc.invalidateQueries(['my-loan-requests']); setPartialModal(false); setPartialAmount('') },
    onError: e => setError(e.response?.data?.message || 'Partial repayment failed'),
  })

  const earlyMutation = useMutation({
    mutationFn: () => makeEarlyClosureRepayment(selectedLoan.id, {}),
    onSuccess: () => { qc.invalidateQueries(['my-loan-requests']); setEarlyModal(false) },
    onError: e => setError(e.response?.data?.message || 'Early closure failed'),
  })

  if (isLoading) return <PageLoader />

  /* If a loan is selected, show its full amortization */
  if (selectedLoan) {
    const ANNUAL_RATE = 12 // placeholder — real rate from API
    const schedule = generateAmortization(selectedLoan.amount, ANNUAL_RATE, selectedLoan.tenureMonths)
    const emi = calculateEmi(selectedLoan.amount, ANNUAL_RATE, selectedLoan.tenureMonths)
    const paidCount = paidEmis.size
    const paidPrincipal = schedule.slice(0, paidCount).reduce((s, r) => s + r.principal, 0)
    const remaining = selectedLoan.amount - paidPrincipal
    const quote = quoteRes?.data?.data

    return (
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedLoan(null)} className="btn-ghost text-sm">
            ← Back
          </button>
          <div>
            <div className="accent-line mb-1" />
            <h2 className="section-title">{selectedLoan.loanProductName}</h2>
            <p className="text-xs text-ink-400 font-mono">Request #{selectedLoan.id}</p>
          </div>
        </div>

        {/* Loan summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="card p-4">
            <p className="stat-label">Principal</p>
            <p className="stat-value text-gold-400">{formatINR(selectedLoan.amount)}</p>
          </div>
          <div className="card p-4">
            <p className="stat-label">Monthly EMI</p>
            <p className="stat-value">{formatINR(emi)}</p>
          </div>
          <div className="card p-4">
            <p className="stat-label">Tenure</p>
            <p className="stat-value">{selectedLoan.tenureMonths}m</p>
          </div>
          <div className="card p-4">
            <p className="stat-label">Outstanding</p>
            <p className="stat-value text-ruby-400">{formatINR(remaining)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="card p-5 mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink-400">Repayment Progress</span>
            <span className="text-ink-200 font-medium">{paidCount} / {selectedLoan.tenureMonths} EMIs paid</span>
          </div>
          <ProgressBar value={paidCount} max={selectedLoan.tenureMonths} />
          <div className="flex justify-between text-xs text-ink-500 mt-1.5">
            <span>{formatINR(paidPrincipal)} repaid</span>
            <span>{formatINR(remaining)} remaining</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <button
            className="btn-secondary flex-1"
            onClick={() => { setPartialModal(true); setError('') }}
          >
            ↓ Partial Repayment
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => { setEarlyModal(true); setError('') }}
          >
            ⚡ Early Closure
          </button>
        </div>

        {/* Amortization table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-200">Full EMI Schedule</p>
            <p className="text-xs text-ink-400">{selectedLoan.tenureMonths} instalments</p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="table">
              <thead className="sticky top-0 bg-ink-900 z-10">
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Opening</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>EMI</th>
                  <th>Closing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => {
                  const status = emiStatus(row, paidEmis)
                  return (
                    <tr key={row.emiNumber} className={clsx(
                      status === 'PAID' && 'opacity-60',
                      status === 'OVERDUE' && 'bg-ruby-500/5'
                    )}>
                      <td className="font-mono text-xs">{row.emiNumber}</td>
                      <td className="text-xs">{formatDate(row.dueDate)}</td>
                      <td className="text-xs">{formatINR(row.openingBalance)}</td>
                      <td className="text-xs text-sapphire-400">{formatINR(row.principal)}</td>
                      <td className="text-xs text-ruby-400">{formatINR(row.interest)}</td>
                      <td className="text-xs font-medium text-gold-400">{formatINR(row.emi)}</td>
                      <td className="text-xs">{formatINR(row.closingBalance)}</td>
                      <td><span className={statusStyle[status]}>{status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Partial repayment modal */}
        <Modal open={partialModal} onClose={() => setPartialModal(false)} title="Partial Repayment">
          <Alert type="error" message={error} />
          {error && <div className="mb-3" />}
          <div className="p-3 bg-ink-800/50 rounded-xl text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-ink-400">Outstanding balance</span>
              <span className="text-ruby-400 font-semibold">{formatINR(remaining)}</span>
            </div>
          </div>
          <Field label="Amount to Repay (₹)" required>
            <input className="input" type="number" min={1} max={remaining}
              value={partialAmount} onChange={e => setPartialAmount(e.target.value)}
              placeholder="Enter amount" />
          </Field>
          <p className="text-xs text-ink-500 mt-1">
            Partial payments reduce your outstanding principal — future EMIs remain unchanged.
          </p>
          <div className="flex gap-3 mt-4">
            <button className="btn-secondary flex-1" onClick={() => setPartialModal(false)}>Cancel</button>
            <button className="btn-primary flex-1"
              disabled={!partialAmount || partialMutation.isPending}
              onClick={() => partialMutation.mutate()}>
              {partialMutation.isPending ? 'Processing...' : 'Make Payment'}
            </button>
          </div>
        </Modal>

        {/* Early closure modal */}
        <Modal open={earlyModal} onClose={() => setEarlyModal(false)} title="Early Loan Closure">
          <Alert type="error" message={error} />
          {error && <div className="mb-3" />}
          <div className="space-y-3 mb-4">
            <div className="p-4 bg-ink-800/50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">Outstanding principal</span>
                <span className="text-ink-200">{formatINR(remaining)}</span>
              </div>
              {quote ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Pre-closure penalty</span>
                    <span className="text-ruby-400">{formatINR(quote.penalty)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ink-700 pt-2 font-medium">
                    <span className="text-ink-300">Total payable now</span>
                    <span className="text-gold-400">{formatINR(quote.totalPayable)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-ink-400">Estimated penalty (2%)</span>
                  <span className="text-ruby-400">{formatINR(round2(remaining * 0.02))}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400">
                Early closure terminates all future EMIs. A penalty may apply based on your loan terms.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setEarlyModal(false)}>Cancel</button>
            <button className="btn-danger flex-1"
              disabled={earlyMutation.isPending}
              onClick={() => earlyMutation.mutate()}>
              {earlyMutation.isPending ? 'Processing...' : 'Close Loan Early'}
            </button>
          </div>
        </Modal>
      </div>
    )
  }

  /* Loan list */
  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Repayments"
        subtitle="Manage EMI payments, partial repayments, and early closure"
      />
      {disbursedLoans.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No active loans"
          description="Your disbursed loans will appear here"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {disbursedLoans.map(loan => {
            const emi = calculateEmi(loan.amount, 12, loan.tenureMonths)
            return (
              <div key={loan.id} className="card p-5 cursor-pointer hover:border-ink-600 transition-all"
                onClick={() => setSelectedLoan(loan)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-ink-100">{loan.loanProductName}</p>
                    <p className="text-xs text-ink-400 mt-0.5">Request #{loan.id} · {formatDate(loan.updatedAt)}</p>
                  </div>
                  <span className="badge-disbursed">DISBURSED</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-400">Loan Amount</span>
                    <span className="text-gold-400 font-semibold">{formatINR(loan.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Monthly EMI</span>
                    <span className="text-ink-200">{formatINR(emi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Tenure</span>
                    <span className="text-ink-200">{loan.tenureMonths} months</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <button className="btn-secondary w-full text-xs">View Schedule & Repay →</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
