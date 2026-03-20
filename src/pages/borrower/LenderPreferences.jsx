import { useQuery } from '@tanstack/react-query'
import { getAllPreferences } from '../../api/services'
import { SectionHeader, PageLoader, EmptyState, Badge } from '../../components/ui'
import { formatINR } from '../../utils/emi'
import { Link } from 'react-router-dom'

const RISK_COLORS = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
}

export default function LenderPreferencesBrowse() {
  const { data, isLoading } = useQuery({
    queryKey: ['all-preferences'],
    queryFn: getAllPreferences,
  })

  const prefs = data?.data?.data || []

  if (isLoading) return <PageLoader />

  return (
    <div className="animate-fade-up">
      <SectionHeader
        title="Active Lender Preferences"
        subtitle="Browse lenders and their lending criteria — apply for a loan matching their preferences"
        action={
          <Link to="/borrower/new-request" className="btn-primary text-sm">Apply for Loan</Link>
        }
      />

      {prefs.length === 0 ? (
        <EmptyState icon="◎" title="No active lender preferences" description="Lenders haven't set their preferences yet" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prefs.map(pref => (
            <div key={pref.id} className="card p-5 hover:border-ink-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-ink-100">{pref.lenderName}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{pref.loanProductName}</p>
                </div>
                <Badge variant={RISK_COLORS[pref.riskAppetite]}>
                  {pref.riskAppetite} risk
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Amount range</span>
                  <span className="text-ink-200 font-medium">
                    {formatINR(pref.minLoanAmount)} – {formatINR(pref.maxLoanAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Interest rate</span>
                  <span className="text-ink-200 font-medium">
                    {pref.minInterestRate}% – {pref.maxInterestRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Tenure</span>
                  <span className="text-ink-200 font-medium">
                    {pref.minTenureMonths} – {pref.maxTenureMonths} months
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-ink-700">
                <Link
                  to={`/borrower/new-request?productId=${pref.loanProductId}`}
                  className="btn-secondary w-full text-center text-xs"
                >
                  Apply for this product →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
