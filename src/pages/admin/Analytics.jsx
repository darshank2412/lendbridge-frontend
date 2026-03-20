import { useQuery } from '@tanstack/react-query'
import { getAllLoanRequests, getSavingsProducts, getLoanProducts, getAllPreferences } from '../../api/services'
import { SectionHeader, PageLoader } from '../../components/ui'
import { formatINR } from '../../utils/emi'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

/* ── Custom recharts tooltip ─────────────────────────── */
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-ink-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {currency ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

/* ── Build analytics from raw loan requests ──────────── */
function buildAnalytics(requests) {
  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const purposeCounts = requests.reduce((acc, r) => {
    acc[r.purpose] = (acc[r.purpose] || 0) + 1
    return acc
  }, {})

  // Monthly trend (last 6 months)
  const monthlyMap = {}
  requests.forEach(r => {
    const d = new Date(r.createdAt)
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, submitted: 0, disbursed: 0, amount: 0 }
    monthlyMap[key].submitted++
    if (r.status === 'DISBURSED') { monthlyMap[key].disbursed++; monthlyMap[key].amount += r.amount }
  })

  // Amount distribution buckets
  const buckets = [
    { range: '< 25K',     min: 0,      max: 25000  },
    { range: '25K–50K',   min: 25000,  max: 50000  },
    { range: '50K–1L',    min: 50000,  max: 100000 },
    { range: '1L–2L',     min: 100000, max: 200000 },
    { range: '> 2L',      min: 200000, max: Infinity},
  ]
  const amountDist = buckets.map(b => ({
    range: b.range,
    count: requests.filter(r => r.amount >= b.min && r.amount < b.max).length,
  }))

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  const purposeData = Object.entries(purposeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))
  const trend = Object.values(monthlyMap).slice(-6)

  return { statusData, purposeData, trend, amountDist }
}

const STATUS_COLORS = {
  PENDING: '#F59E0B', MATCHED: '#60A5FA', ACCEPTED: '#34D399',
  DISBURSED: '#D4A853', REJECTED: '#EF4444', CANCELLED: '#6B7280',
}
const CHART_COLORS = ['#D4A853', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B']

export default function AdminAnalytics() {
  const { data: loanReqRes, isLoading } = useQuery({
    queryKey: ['all-loan-requests'],
    queryFn: () => getAllLoanRequests(),
  })
  const { data: prefsRes } = useQuery({ queryKey: ['all-preferences'], queryFn: getAllPreferences })
  const { data: loanProdRes } = useQuery({ queryKey: ['loan-products'], queryFn: getLoanProducts })

  const requests   = loanReqRes?.data?.data || []
  const prefs      = prefsRes?.data?.data || []
  const loanProds  = loanProdRes?.data?.data || []
  const { statusData, purposeData, trend, amountDist } = buildAnalytics(requests)

  const totalDisbursed = requests.filter(r => r.status === 'DISBURSED').reduce((s, r) => s + r.amount, 0)
  const disbursedCount = requests.filter(r => r.status === 'DISBURSED').length
  const pendingCount   = requests.filter(r => r.status === 'PENDING').length
  const activePrefs    = prefs.filter(p => p.isActive).length
  const avgLoan        = disbursedCount ? Math.round(totalDisbursed / disbursedCount) : 0

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader title="Platform Analytics" subtitle="Overview of lending activity across the platform" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: 'Total Disbursed',  value: formatINR(totalDisbursed), sub: `${disbursedCount} loans`, icon: '💸' },
          { label: 'Avg Loan Size',    value: formatINR(avgLoan),        sub: 'Per disbursed loan',      icon: '📊' },
          { label: 'Active Lenders',   value: activePrefs,               sub: 'Set preferences',         icon: '🤝' },
          { label: 'Pending Review',   value: pendingCount,              sub: 'Awaiting match',           icon: '⏳' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="stat-label">{k.label}</span>
              <span className="text-lg">{k.icon}</span>
            </div>
            <p className="stat-value text-xl">{k.value}</p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Monthly trend */}
        <div className="card p-5">
          <p className="text-sm font-medium text-ink-200 mb-4">Monthly Request Trend</p>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-ink-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D4A853" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="submitted" name="Submitted"
                  stroke="#3B82F6" fill="url(#gSubmitted)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="disbursed" name="Disbursed"
                  stroke="#D4A853" fill="url(#gDisbursed)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <p className="text-sm font-medium text-ink-200 mb-4">Request Status Distribution</p>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-ink-500 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" paddingAngle={2}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] || '#888' }} />
                      <span className="text-ink-400">{s.name}</span>
                    </div>
                    <span className="text-ink-200 font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Amount distribution */}
        <div className="card p-5">
          <p className="text-sm font-medium text-ink-200 mb-4">Loan Amount Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={amountDist} barSize={28}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                {amountDist.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Purpose breakdown */}
        <div className="card p-5">
          <p className="text-sm font-medium text-ink-200 mb-4">Top Loan Purposes</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={purposeData} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }}
                width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {purposeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loan product overview table */}
      <div className="card overflow-hidden mt-5">
        <div className="px-5 py-4 border-b border-ink-700">
          <p className="text-sm font-medium text-ink-200">Active Loan Products</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Amount Range</th>
              <th>Interest Range</th>
              <th>Tenure Range</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {loanProds.filter(p => p.status === 'ACTIVE').map(p => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td>{formatINR(p.minAmount)} – {formatINR(p.maxAmount)}</td>
                <td>{p.minInterest}% – {p.maxInterest}%</td>
                <td>{p.minTenure} – {p.maxTenure}m</td>
                <td>{requests.filter(r => r.loanProductId === p.id).length}</td>
              </tr>
            ))}
            {loanProds.filter(p => p.status === 'ACTIVE').length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500 py-6 text-sm">No active products</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
