import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import {
  getUserAccounts, getSavingsProducts, getLoanProducts,
  openSavingsAccount, openLoanAccount, deposit, withdraw
} from '../../api/services'
import { SectionHeader, Modal, Field, Alert, PageLoader, Badge } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

function AccountCard({ account, onDeposit, onWithdraw }) {
  const isSavings = account.accountType === 'SAVINGS'
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{isSavings ? '🏦' : '💳'}</span>
            <span className="font-medium text-ink-100">{account.accountType}</span>
            <Badge variant={account.status === 'ACTIVE' ? 'success' : 'default'}>
              {account.status}
            </Badge>
          </div>
          <p className="text-xs font-mono text-ink-400">{account.accountNumber}</p>
          <p className="text-xs text-ink-500 mt-0.5">
            {account.savingsProductName || account.loanProductName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-gold-400">{formatINR(account.balance)}</p>
          <p className="text-xs text-ink-400 mt-0.5">balance</p>
        </div>
      </div>
      <p className="text-xs text-ink-500 mb-4">Opened {formatDate(account.createdAt)}</p>
      {isSavings && account.status === 'ACTIVE' && (
        <div className="flex gap-2">
          <button onClick={() => onDeposit(account)} className="btn-success flex-1 text-xs">Deposit</button>
          <button onClick={() => onWithdraw(account)} className="btn-secondary flex-1 text-xs">Withdraw</button>
        </div>
      )}
    </div>
  )
}

export default function BorrowerAccounts() {
  const { getUserId } = useAuthStore()
  const userId = getUserId()
  const qc = useQueryClient()
  const [openSavingsModal, setOpenSavingsModal] = useState(false)
  const [openLoanModal, setOpenLoanModal] = useState(false)
  const [txModal, setTxModal] = useState(null) // { account, type: 'deposit'|'withdraw' }
  const [amount, setAmount] = useState('')
  const [productId, setProductId] = useState('')
  const [error, setError] = useState('')

  const { data: accountsRes, isLoading } = useQuery({
    queryKey: ['my-accounts', userId],
    queryFn: () => getUserAccounts(userId),
    enabled: !!userId,
  })

  const { data: savingsProdsRes } = useQuery({
    queryKey: ['savings-products'],
    queryFn: getSavingsProducts,
  })

  const { data: loanProdsRes } = useQuery({
    queryKey: ['loan-products'],
    queryFn: getLoanProducts,
  })

  const accounts = accountsRes?.data?.data || []
  const savingsProds = savingsProdsRes?.data?.data || []
  const loanProds = loanProdsRes?.data?.data || []

  const openSavingsMutation = useMutation({
    mutationFn: () => openSavingsAccount({ userId, productId: Number(productId) }),
    onSuccess: () => { qc.invalidateQueries(['my-accounts']); setOpenSavingsModal(false) },
    onError: (e) => setError(e.response?.data?.message || 'Failed'),
  })

  const openLoanMutation = useMutation({
    mutationFn: () => openLoanAccount({ userId, productId: Number(productId) }),
    onSuccess: () => { qc.invalidateQueries(['my-accounts']); setOpenLoanModal(false) },
    onError: (e) => setError(e.response?.data?.message || 'Failed'),
  })

  const txMutation = useMutation({
    mutationFn: () => txModal.type === 'deposit'
      ? deposit(txModal.account.id, { amount: Number(amount) })
      : withdraw(txModal.account.id, { amount: Number(amount) }),
    onSuccess: () => { qc.invalidateQueries(['my-accounts']); setTxModal(null); setAmount('') },
    onError: (e) => setError(e.response?.data?.message || 'Transaction failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="My Accounts"
        subtitle="Manage your savings and loan accounts"
        action={
          <div className="flex gap-2">
            <button onClick={() => { setOpenSavingsModal(true); setError('') }} className="btn-secondary text-sm">
              + Savings Account
            </button>
            <button onClick={() => { setOpenLoanModal(true); setError('') }} className="btn-secondary text-sm">
              + Loan Account
            </button>
          </div>
        }
      />

      {accounts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-ink-400">No accounts yet. Open a savings or loan account to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              onDeposit={(a) => { setTxModal({ account: a, type: 'deposit' }); setAmount(''); setError('') }}
              onWithdraw={(a) => { setTxModal({ account: a, type: 'withdraw' }); setAmount(''); setError('') }}
            />
          ))}
        </div>
      )}

      {/* Open Savings Modal */}
      <Modal open={openSavingsModal} onClose={() => setOpenSavingsModal(false)} title="Open Savings Account">
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <Field label="Savings Product" required>
          <select className="select" value={productId} onChange={e => setProductId(e.target.value)}>
            <option value="">Select product</option>
            {savingsProds.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.interestRate}% p.a. (Min: {formatINR(p.minBalance)})
              </option>
            ))}
          </select>
        </Field>
        <button
          className="btn-primary w-full mt-4"
          onClick={() => openSavingsMutation.mutate()}
          disabled={!productId || openSavingsMutation.isPending}
        >
          {openSavingsMutation.isPending ? 'Opening...' : 'Open Account'}
        </button>
      </Modal>

      {/* Open Loan Modal */}
      <Modal open={openLoanModal} onClose={() => setOpenLoanModal(false)} title="Open Loan Account">
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <Field label="Loan Product" required>
          <select className="select" value={productId} onChange={e => setProductId(e.target.value)}>
            <option value="">Select product</option>
            {loanProds.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <button
          className="btn-primary w-full mt-4"
          onClick={() => openLoanMutation.mutate()}
          disabled={!productId || openLoanMutation.isPending}
        >
          {openLoanMutation.isPending ? 'Opening...' : 'Open Account'}
        </button>
      </Modal>

      {/* Deposit/Withdraw Modal */}
      <Modal
        open={!!txModal}
        onClose={() => setTxModal(null)}
        title={txModal?.type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
      >
        <Alert type="error" message={error} />
        {error && <div className="mb-4" />}
        <div className="mb-4 p-3 bg-ink-800/50 rounded-xl text-sm">
          <span className="text-ink-400">Current Balance: </span>
          <span className="text-gold-400 font-semibold">{formatINR(txModal?.account?.balance)}</span>
        </div>
        <Field label="Amount (₹)" required>
          <input className="input" type="number" min={1} value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
        </Field>
        <button
          className={txModal?.type === 'deposit' ? 'btn-success w-full mt-4' : 'btn-danger w-full mt-4'}
          onClick={() => txMutation.mutate()}
          disabled={!amount || txMutation.isPending}
        >
          {txMutation.isPending ? 'Processing...' : txModal?.type === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </Modal>
    </div>
  )
}
