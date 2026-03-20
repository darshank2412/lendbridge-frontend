import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMyLoanRequests, getMyProfile, getUserAccounts } from '../../api/services'
import { StatCard, StatusBadge, SectionHeader, Card, PageLoader } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'
import { Link } from 'react-router-dom'

export default function BorrowerDashboard() {
  const { user, getUserId } = useAuthStore()
  const userId = getUserId()

  const { data: loanRequestsRes, isLoading: lr } = useQuery({
    queryKey: ['my-loan-requests', userId],
    queryFn: () => getMyLoanRequests(userId),
    enabled: !!userId,
  })

  const { data: accountsRes } = useQuery({
    queryKey: ['my-accounts', userId],
    queryFn: () => getUserAccounts(userId),
    enabled: !!userId,
  })

  const requests = loanRequestsRes?.data?.data || []
  const accounts = accountsRes?.data?.data || []

  const pending = requests.filter(r => r.status === 'PENDING').length
  const disbursed = requests.filter(r => r.status === 'DISBURSED').length
  const totalBorrowed = requests
    .filter(r => r.status === 'DISBURSED')
    .reduce((s, r) => s + r.amount, 0)
  const savingsAccount = accounts.find(a => a.accountType === 'SAVINGS')

  if (lr) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="accent-line mb-2" />
        <h1 className="font-display text-3xl font-bold text-ink-100">
          Good day, {user?.firstName} 👋
        </h1>
        <p className="text-ink-400 mt-1">Here's your lending overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Borrowed" value={formatINR(totalBorrowed)} icon="💰"
          sub="All disbursed loans" />
        <StatCard label="Active Loans" value={disbursed} icon="📋"
          sub="Currently disbursed" />
        <StatCard label="Pending Requests" value={pending} icon="⏳"
          sub="Awaiting match" />
        <StatCard label="Savings Balance" icon="🏦"
          value={savingsAccount ? formatINR(savingsAccount.balance) : '—'}
          sub={savingsAccount?.accountNumber || 'No savings account'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent requests */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Recent Loan Requests"
            action={
              <Link to="/borrower/loan-requests" className="btn-ghost text-xs">
                View all →
              </Link>
            }
          />
          <div className="card overflow-hidden">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-ink-400 text-sm">No loan requests yet</p>
                <Link to="/borrower/new-request" className="btn-primary inline-flex mt-4 text-sm">
                  Apply for a loan
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-ink-800">
                {requests.slice(0, 5).map(req => (
                  <div key={req.id} className="px-5 py-4 flex items-center justify-between hover:bg-ink-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-ink-200">{req.loanProductName}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {formatINR(req.amount)} · {req.tenureMonths}m · {formatDate(req.createdAt)}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">{req.purpose}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + KYC status */}
        <div className="space-y-4">
          <SectionHeader title="Quick Actions" />
          <div className="space-y-2">
            <Link to="/borrower/new-request"
              className="card p-4 flex items-center gap-3 hover:border-gold-500/30 transition-all cursor-pointer block">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400">⊕</div>
              <div>
                <p className="text-sm font-medium text-ink-200">New Loan Request</p>
                <p className="text-xs text-ink-400">Apply for a new loan</p>
              </div>
            </Link>
            <Link to="/borrower/lender-preferences"
              className="card p-4 flex items-center gap-3 hover:border-sapphire-500/30 transition-all cursor-pointer block">
              <div className="w-9 h-9 rounded-xl bg-sapphire-500/10 flex items-center justify-center text-sapphire-400">◎</div>
              <div>
                <p className="text-sm font-medium text-ink-200">Browse Lenders</p>
                <p className="text-xs text-ink-400">Find matching lenders</p>
              </div>
            </Link>
            <Link to="/borrower/kyc"
              className="card p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-all cursor-pointer block">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">◉</div>
              <div>
                <p className="text-sm font-medium text-ink-200">KYC Status</p>
                <p className={`text-xs ${user?.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user?.kycStatus || 'PENDING'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
