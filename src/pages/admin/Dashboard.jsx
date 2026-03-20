import { useQuery } from '@tanstack/react-query'
import { getAllLoanRequests, getAllPreferences } from '../../api/services'
import { StatCard, SectionHeader, StatusBadge, PageLoader } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { data: loanReqRes, isLoading } = useQuery({
    queryKey: ['all-loan-requests'],
    queryFn: () => getAllLoanRequests(),
  })

  const { data: prefsRes } = useQuery({
    queryKey: ['all-preferences'],
    queryFn: getAllPreferences,
  })

  const requests = loanReqRes?.data?.data || []
  const prefs = prefsRes?.data?.data || []

  const pending = requests.filter(r => r.status === 'PENDING').length
  const matched = requests.filter(r => r.status === 'MATCHED').length
  const accepted = requests.filter(r => r.status === 'ACCEPTED').length
  const disbursed = requests.filter(r => r.status === 'DISBURSED').length
  const totalDisbursed = requests
    .filter(r => r.status === 'DISBURSED')
    .reduce((s, r) => s + r.amount, 0)

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="accent-line mb-2" />
        <h1 className="font-display text-3xl font-bold text-ink-100">Admin Control Centre</h1>
        <p className="text-ink-400 mt-1">Platform-wide overview and management</p>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Pending" value={pending} icon="⏳" />
        <StatCard label="Matched" value={matched} icon="🤝" />
        <StatCard label="Accepted" value={accepted} icon="✅" />
        <StatCard label="Disbursed" value={disbursed} icon="💸" />
        <StatCard label="Total Disbursed" value={formatINR(totalDisbursed)} icon="📊" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent requests needing action */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Requests Needing Action"
            subtitle="PENDING requests ready to be matched"
            action={<Link to="/admin/loan-requests" className="btn-ghost text-xs">View all →</Link>}
          />
          <div className="card overflow-hidden">
            {requests.filter(r => ['PENDING','MATCHED'].includes(r.status)).length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-sm">All caught up ✓</div>
            ) : (
              <div className="divide-y divide-ink-800">
                {requests
                  .filter(r => ['PENDING', 'MATCHED'].includes(r.status))
                  .slice(0, 6)
                  .map(req => (
                    <div key={req.id} className="px-5 py-4 flex items-center justify-between hover:bg-ink-800/30">
                      <div>
                        <p className="text-sm font-medium text-ink-200">{req.borrowerName}</p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {formatINR(req.amount)} · {req.tenureMonths}m · {req.loanProductName}
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">{formatDate(req.createdAt)}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Management shortcuts */}
        <div className="space-y-4">
          <SectionHeader title="Manage" />
          <div className="space-y-2">
            {[
              { to: '/admin/loan-requests', icon: '◩', label: 'Loan Requests', sub: `${pending} pending`, color: 'amber' },
              { to: '/admin/kyc', icon: '◉', label: 'KYC Review', sub: 'Pending documents', color: 'sapphire' },
              { to: '/admin/loan-products', icon: '◫', label: 'Loan Products', sub: 'CRUD management', color: 'emerald' },
              { to: '/admin/savings-products', icon: '◎', label: 'Savings Products', sub: 'CRUD management', color: 'teal' },
              { to: '/admin/preferences', icon: '⚙', label: 'Lender Preferences', sub: `${prefs.length} active`, color: 'purple' },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="card p-4 flex items-center gap-3 hover:border-ink-600 transition-all block">
                <div className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center text-base">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-200">{item.label}</p>
                  <p className="text-xs text-ink-400">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
