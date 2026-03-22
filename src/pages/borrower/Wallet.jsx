import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getUserAccounts, deposit, withdraw } from '../../api/services'
import { SectionHeader, Modal, Field, Alert, PageLoader } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'

function WalletCard({ account, onDeposit, onWithdraw }) {
  const [animating, setAnimating] = useState(false)
  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"
        style={{backgroundImage:'radial-gradient(circle at 20% 50%, #d4af37 0%, transparent 60%)'}} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
            <span className="text-gold-400 text-sm">₹</span>
          </div>
          <span className="text-ink-400 text-sm">{account.accountType} Account</span>
        </div>
        <p className="font-mono text-xs text-ink-500 mb-4">{account.accountNumber}</p>
        <div className="mb-6">
          <p className="text-ink-400 text-xs mb-1">Available Balance</p>
          <p className="text-4xl font-display font-bold text-gold-400">
            {formatINR(account.balance)}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onDeposit(account)}
            className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all">
            ↓ Deposit
          </button>
          <button onClick={() => onWithdraw(account)}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all">
            ↑ Withdraw
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionItem({ type, amount, description, date, status }) {
  const isCredit = type === 'credit'
  return (
    <div className="flex items-center gap-4 py-3 border-b border-ink-800 last:border-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <span className={`text-lg ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
          {isCredit ? '↓' : '↑'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-ink-100 text-sm font-medium truncate">{description}</p>
        <p className="text-ink-500 text-xs">{date}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
          {isCredit ? '+' : '-'}{formatINR(amount)}
        </p>
        <p className="text-xs text-ink-500">{status}</p>
      </div>
    </div>
  )
}

function MoneyTransferAnimation({ show, from, to, amount, onDone }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card p-8 max-w-sm w-full mx-4 text-center">
        <p className="text-ink-400 text-sm mb-6">Processing Transaction</p>
        <div className="flex items-center justify-between mb-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-xs text-ink-400">{from}</p>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1 px-2">
            <div className="h-0.5 flex-1 bg-gold-500/30 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-8 bg-gold-500 animate-[slide_1s_linear_infinite]"
                style={{animation:'slideRight 1s linear infinite'}} />
            </div>
            <span className="text-gold-400 text-xs font-bold whitespace-nowrap">{formatINR(amount)}</span>
            <div className="h-0.5 flex-1 bg-gold-500/30">
              <div className="h-full w-8 bg-gold-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🏦</span>
            </div>
            <p className="text-xs text-ink-400">{to}</p>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span>✓</span><span>Transaction initiated</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span>✓</span><span>Amount debited</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gold-400 animate-pulse">
            <span>⟳</span><span>Crediting account...</span>
          </div>
        </div>
        <button onClick={onDone} className="btn-primary w-full">Done</button>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const { getUserId, getUser } = useAuthStore()
  const userId = getUserId()
  const user = getUser?.() || {}
  const qc = useQueryClient()
  const [txModal, setTxModal] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferData, setTransferData] = useState(null)

  const { data: accountsRes, isLoading } = useQuery({
    queryKey: ['my-accounts', userId],
    queryFn: () => getUserAccounts(userId),
    enabled: !!userId,
  })

  const accounts = accountsRes?.data?.data || []
  const savingsAccount = accounts.find(a => a.accountType === 'SAVINGS')
  const totalBalance = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0)

  const mockTransactions = []
   

  const txMutation = useMutation({
    mutationFn: () => txModal.type === 'deposit'
      ? deposit(txModal.account.id, { amount: Number(amount) })
      : withdraw(txModal.account.id, { amount: Number(amount) }),
    onSuccess: () => {
      qc.invalidateQueries(['my-accounts'])
      setTxModal(null)
      setAmount('')
      setTransferData({
        from: txModal.type === 'deposit' ? 'External Bank' : 'Your Wallet',
        to: txModal.type === 'deposit' ? 'Your Wallet' : 'External Bank',
        amount: Number(amount)
      })
      setShowTransfer(true)
    },
    onError: (e) => setError(e.response?.data?.message || 'Transaction failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <MoneyTransferAnimation
        show={showTransfer}
        from={transferData?.from}
        to={transferData?.to}
        amount={transferData?.amount}
        onDone={() => setShowTransfer(false)}
      />

      <SectionHeader
        title="My Wallet"
        subtitle="Manage your funds and view transaction history"
      />

      {/* Total Balance Banner */}
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{background:'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, transparent 60%)'}} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-ink-400 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-5xl font-display font-bold text-gold-400">
              {formatINR(totalBalance)}
            </p>
            <p className="text-ink-500 text-xs mt-2">{accounts.length} account(s) active</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="w-20 h-20 rounded-full border-4 border-gold-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-gold-400">₹</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="card p-8 text-center mb-6">
          <p className="text-ink-400">No accounts yet. Go to Accounts to open one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {accounts.map(acc => (
            <WalletCard
              key={acc.id}
              account={acc}
              onDeposit={(a) => { setTxModal({ account: a, type: 'deposit' }); setAmount(''); setError('') }}
              onWithdraw={(a) => { setTxModal({ account: a, type: 'withdraw' }); setAmount(''); setError('') }}
            />
          ))}
        </div>
      )}

      {/* Transaction History */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-100 mb-4">Transaction History</h3>
        
{mockTransactions.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-ink-500 text-sm">No transactions yet</p>
    <p className="text-ink-600 text-xs mt-1">Transactions will appear here after deposits, withdrawals or EMI payments</p>
  </div>
) : (
  mockTransactions.map(tx => (
    <TransactionItem key={tx.id} {...tx} />
  ))
)}
      </div>

      {/* Deposit/Withdraw Modal */}
      <Modal
        open={!!txModal}
        onClose={() => setTxModal(null)}
        title={txModal?.type === 'deposit' ? '↓ Deposit Funds' : '↑ Withdraw Funds'}
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
          className={`w-full mt-4 ${txModal?.type === 'deposit' ? 'btn-success' : 'btn-danger'}`}
          onClick={() => txMutation.mutate()}
          disabled={!amount || txMutation.isPending}
        >
          {txMutation.isPending ? 'Processing...' : txModal?.type === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </Modal>
    </div>
  )
}