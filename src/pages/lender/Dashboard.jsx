import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMatchedRequests, getMyPreferences, getOpenRequests } from '../../api/services'
import { StatCard, SectionHeader, StatusBadge, PageLoader } from '../../components/ui'
import { formatINR, formatDate } from '../../utils/emi'
import { Link } from 'react-router-dom'

export default function LenderDashboard() {
  const { user, getUserId } = useAuthStore()
  const lenderId = getUserId()

  const { data: matchedRes, isLoading: ml } = useQuery({
    queryKey: ['matched-requests'],
    queryFn: getMatchedRequests,
  })

  const { data: prefsRes } = useQuery({
    queryKey: ['my-preferences', lenderId],
    queryFn: () => getMyPreferences(lenderId),
    enabled: !!lenderId,
  })

  const { data: openRes } = useQuery({
    queryKey: ['open-requests', lenderId],
    queryFn: () => getOpenRequests(lenderId),
    enabled: !!lenderId,
  })

  const matched = matchedRes?.data?.data || []
  const prefs = prefsRes?.data?.data || []
  const open = openRes?.data?.data || []
  const totalLent = matched
    .filter(r => r.status === 'ACCEPTED' || r.status === 'DISBURSED')
    .reduce((s, r) => s + r.amount, 0)

  if (ml) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="accent-line mb-2" />
        <h1 className="font-display text-3xl font-bold text-ink-100">
          Hello, {user?.firstName} 👋
        </h1>
        <p className="text-ink-400 mt-1">Your lending activity at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Lent" value={formatINR(totalLent)} icon="💸" sub="Accepted + disbursed" />
        <StatCard label="Matched Requests" value={matched.length} icon="🤝" sub="Pending your action" />
        <StatCard label="Open Requests" value={open.length} icon="📬" sub="In the market" />
        <StatCard label="Active Preferences" value={prefs.filter(p => p.isActive).length} icon="⚙️" sub="Loan products" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Matched requests */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Matched Requests"
            subtitle="Waiting for your accept/reject"
            action={<Link to="/lender/matched" className="btn-ghost text-xs">View all →</Link>}
          />
          <div className="card overflow-hidden">
            {matched.length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-sm">No matched requests yet</div>
            ) : (
              <div className="divide-y divide-ink-800">
                {matched.slice(0, 5).map(req => (
                  <div key={req.id} className="px-5 py-4 flex items-center justify-between hover:bg-ink-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-ink-200">{req.borrowerName}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {formatINR(req.amount)} · {req.tenureMonths}m · {req.purpose}
                      </p>
                      <p className="text-xs text-ink-500">{req.loanProductName}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={req.status} />
                      <p className="text-xs text-ink-500 mt-1">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <SectionHeader title="Quick Actions" />
          <div className="space-y-2">
            <Link to="/lender/preferences" className="card p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-all block">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">⚙️</div>
              <div>
                <p className="text-sm font-medium text-ink-200">Set Preferences</p>
                <p className="text-xs text-ink-400">Define lending criteria</p>
              </div>
            </Link>
            <Link to="/lender/matching" className="card p-4 flex items-center gap-3 hover:border-gold-500/30 transition-all block">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400">◎</div>
              <div>
                <p className="text-sm font-medium text-ink-200">Matching Requests</p>
                <p className="text-xs text-ink-400">Requests that fit your prefs</p>
              </div>
            </Link>
            <Link to="/lender/open-requests" className="card p-4 flex items-center gap-3 hover:border-sapphire-500/30 transition-all block">
              <div className="w-9 h-9 rounded-xl bg-sapphire-500/10 flex items-center justify-center text-sapphire-400">📬</div>
              <div>
                <p className="text-sm font-medium text-ink-200">All Open Requests</p>
                <p className="text-xs text-ink-400">Browse the full market</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
