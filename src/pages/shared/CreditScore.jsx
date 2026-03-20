import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getCreditScore } from '../../api/services'
import { SectionHeader, PageLoader, Alert } from '../../components/ui'
import clsx from 'clsx'

/* ── Score colour helpers ─────────────────────────────── */
function scoreColor(score) {
  if (score >= 750) return { text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent', ring: '#10B981' }
  if (score >= 650) return { text: 'text-gold-400',    bg: 'bg-gold-500',    label: 'Good',      ring: '#D4A853' }
  if (score >= 550) return { text: 'text-amber-400',   bg: 'bg-amber-500',   label: 'Fair',      ring: '#F59E0B' }
  return                   { text: 'text-ruby-400',    bg: 'bg-ruby-500',    label: 'Poor',      ring: '#EF4444' }
}

/* ── SVG Arc gauge ────────────────────────────────────── */
function ScoreGauge({ score }) {
  const MAX = 900; const MIN = 300
  const pct = Math.min(1, Math.max(0, (score - MIN) / (MAX - MIN)))
  const angle = -180 + pct * 180           // -180° (left) → 0° (right)
  const rad   = (angle * Math.PI) / 180
  const cx = 110; const cy = 110; const r = 80
  const needleX = cx + r * 0.78 * Math.cos(rad)
  const needleY = cy + r * 0.78 * Math.sin(rad)
  const { text, ring, label } = scoreColor(score)

  // Arc segments: Poor 300-550, Fair 550-650, Good 650-750, Excellent 750-900
  function arcPath(fromScore, toScore, colour) {
    const a1 = Math.PI + ((fromScore - MIN) / (MAX - MIN)) * Math.PI
    const a2 = Math.PI + ((toScore   - MIN) / (MAX - MIN)) * Math.PI
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2)
    return <path key={fromScore} d={`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`}
      stroke={colour} strokeWidth="14" fill="none" strokeLinecap="round" />
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="128" viewBox="0 0 220 128">
        {/* Track */}
        <path d={`M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          stroke="#1C1F28" strokeWidth="14" fill="none" />
        {/* Coloured segments */}
        {arcPath(300, 550,  '#EF4444')}
        {arcPath(550, 650,  '#F59E0B')}
        {arcPath(650, 750,  '#D4A853')}
        {arcPath(750, 900,  '#10B981')}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke={ring} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={ring} />
        {/* Score text */}
        <text x={cx} y={cy + 22} textAnchor="middle"
          style={{ fontSize: 28, fontWeight: 700, fill: ring, fontFamily: 'Syne, sans-serif' }}>
          {score}
        </text>
        <text x={cx} y={cy + 38} textAnchor="middle"
          style={{ fontSize: 11, fill: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}>
          {label}
        </text>
      </svg>
      <div className="flex gap-3 text-xs text-ink-500 mt-1">
        <span>300</span>
        <span className="flex-1 text-center">Credit Score</span>
        <span>900</span>
      </div>
    </div>
  )
}

/* ── Score factor bar ─────────────────────────────────── */
function FactorBar({ label, value, max, description, impact }) {
  const pct = Math.round((value / max) * 100)
  const impactColor = impact === 'HIGH' ? 'text-emerald-400' : impact === 'MEDIUM' ? 'text-gold-400' : 'text-ink-400'
  return (
    <div className="py-3 border-b border-ink-800 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-ink-200">{label}</span>
        <div className="flex items-center gap-2">
          <span className={clsx('text-xs font-medium', impactColor)}>{impact} IMPACT</span>
          <span className="text-sm font-mono text-ink-300">{value}/{max}</span>
        </div>
      </div>
      <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct >= 70 ? '#10B981' : pct >= 40 ? '#D4A853' : '#EF4444' }}
        />
      </div>
      <p className="text-xs text-ink-500">{description}</p>
    </div>
  )
}

/* ── Mock credit score if API not yet wired ───────────── */
function buildMockScore(user) {
  const kycBonus   = user?.kycStatus === 'VERIFIED' ? 150 : 0
  const incomeMap  = { ABOVE_50_LPA: 120, '20_50_LPA': 100, '10_20_LPA': 80, '5_10_LPA': 60, '2_5_LPA': 40, BELOW_2_LPA: 20 }
  const expMap     = { ADVANCED: 80, INTERMEDIATE: 50, BEGINNER: 20 }
  const base       = 450
  const score      = Math.min(900, base + kycBonus + (incomeMap[user?.incomeBracket] || 60) + (expMap[user?.p2pExperience] || 20))
  return {
    score,
    factors: [
      { label: 'KYC Verification',     value: kycBonus,                         max: 150, impact: 'HIGH',   description: 'Identity verified via AADHAAR + PAN' },
      { label: 'Income Bracket',        value: incomeMap[user?.incomeBracket]||60, max: 120, impact: 'HIGH',   description: 'Monthly income relative to loan amount' },
      { label: 'Repayment History',     value: 75,                               max: 100, impact: 'HIGH',   description: 'On-time EMI payments in past 12 months' },
      { label: 'P2P Experience',        value: expMap[user?.p2pExperience]||20,  max: 80,  impact: 'MEDIUM', description: 'Prior experience in peer-to-peer lending' },
      { label: 'Active Loans',          value: 40,                               max: 60,  impact: 'MEDIUM', description: 'Number of currently active loan accounts' },
      { label: 'Credit Utilisation',    value: 30,                               max: 50,  impact: 'LOW',    description: 'Ratio of used credit to total available' },
    ],
    recommendation: score >= 750
      ? 'Excellent credit profile. Eligible for highest loan amounts and lowest rates.'
      : score >= 650
      ? 'Good profile. Complete KYC and maintain repayment streak to improve further.'
      : 'Fair profile. Focus on timely EMI payments and KYC completion to improve score.',
    lastUpdated: new Date().toISOString(),
  }
}

export default function CreditScorePage() {
  const { user, getUserId } = useAuthStore()
  const userId = getUserId()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['credit-score', userId],
    queryFn: () => getCreditScore(userId),
    enabled: !!userId,
    retry: 1,
  })

  // Use API data if available, otherwise compute from profile
  const scoreData = data?.data?.data || buildMockScore(user)
  const { score, factors, recommendation, lastUpdated } = scoreData
  const { text, label } = scoreColor(score)

  return (
    <div className="animate-fade-up max-w-3xl">
      <SectionHeader
        title="Credit Score"
        subtitle="Your platform credit score based on KYC, income, and repayment history"
      />

      {isLoading && <PageLoader />}

      {!isLoading && (
        <div className="grid lg:grid-cols-5 gap-5">

          {/* Left — gauge + summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6 flex flex-col items-center">
              <ScoreGauge score={score} />
              <div className={clsx('mt-4 text-center')}>
                <p className={clsx('font-display text-3xl font-bold', text)}>{score}</p>
                <p className={clsx('text-sm font-medium mt-0.5', text)}>{label} Score</p>
              </div>
              <div className="w-full mt-5 space-y-2">
                {[
                  { range: '750 – 900', label: 'Excellent', color: 'bg-emerald-500' },
                  { range: '650 – 749', label: 'Good',      color: 'bg-gold-500' },
                  { range: '550 – 649', label: 'Fair',      color: 'bg-amber-500' },
                  { range: '300 – 549', label: 'Poor',      color: 'bg-ruby-500' },
                ].map(r => (
                  <div key={r.range} className="flex items-center gap-2 text-xs">
                    <div className={clsx('w-2.5 h-2.5 rounded-full', r.color)} />
                    <span className="text-ink-400 w-20">{r.range}</span>
                    <span className="text-ink-300">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="card p-4 border-l-4 border-l-gold-500">
              <p className="text-xs text-gold-400 uppercase tracking-wider mb-1.5">Recommendation</p>
              <p className="text-sm text-ink-200 leading-relaxed">{recommendation}</p>
            </div>

            {isError && (
              <Alert type="info" message="Score computed from profile data. Connect Week 7 API to use real scoring." />
            )}

            <div className="text-xs text-ink-500 text-center">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* Right — factor breakdown */}
          <div className="lg:col-span-3">
            <div className="card p-5">
              <p className="text-sm font-medium text-ink-200 mb-1">Score Breakdown</p>
              <p className="text-xs text-ink-400 mb-4">Factors contributing to your credit score</p>
              <div>
                {factors.map(f => (
                  <FactorBar key={f.label} {...f} />
                ))}
              </div>
            </div>

            {/* Total out of 900 */}
            <div className="card p-4 mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-wider">Total Score</p>
                <p className={clsx('font-display text-2xl font-bold mt-0.5', text)}>{score} / 900</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1C1F28" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={scoreColor(score).ring} strokeWidth="3.5"
                    strokeDasharray={`${((score - 300) / 600) * 100} 100`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={clsx('text-xs font-bold', text)}>
                    {Math.round(((score - 300) / 600) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
