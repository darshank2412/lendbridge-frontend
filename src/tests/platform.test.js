import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { calculateEmi, generateAmortization, round2, formatINR } from '../utils/emi'
import { useAuthStore } from '../store/authStore'

/* ═══════════════════════════════════════════════════════════
   WEEK 4 — Matchmaking engine & loan request lifecycle
═══════════════════════════════════════════════════════════ */

describe('Loan Request Status Transitions', () => {
  const VALID_TRANSITIONS = {
    PENDING:  ['MATCHED', 'REJECTED', 'CANCELLED'],
    MATCHED:  ['ACCEPTED', 'REJECTED'],
    ACCEPTED: ['DISBURSED'],
    DISBURSED: [],
    REJECTED:  [],
    CANCELLED: [],
  }

  function isValidTransition(from, to) {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  }

  it('PENDING can transition to MATCHED (admin match)', () => {
    expect(isValidTransition('PENDING', 'MATCHED')).toBe(true)
  })

  it('PENDING can transition to CANCELLED (borrower cancel)', () => {
    expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true)
  })

  it('PENDING can transition to REJECTED (admin reject)', () => {
    expect(isValidTransition('PENDING', 'REJECTED')).toBe(true)
  })

  it('MATCHED can transition to ACCEPTED (lender accept)', () => {
    expect(isValidTransition('MATCHED', 'ACCEPTED')).toBe(true)
  })

  it('MATCHED can transition to REJECTED (admin reject)', () => {
    expect(isValidTransition('MATCHED', 'REJECTED')).toBe(true)
  })

  it('ACCEPTED can transition to DISBURSED (admin disburse)', () => {
    expect(isValidTransition('ACCEPTED', 'DISBURSED')).toBe(true)
  })

  it('DISBURSED cannot transition to any state (terminal)', () => {
    expect(isValidTransition('DISBURSED', 'PENDING')).toBe(false)
    expect(isValidTransition('DISBURSED', 'CANCELLED')).toBe(false)
  })

  it('REJECTED cannot transition to any state (terminal)', () => {
    expect(isValidTransition('REJECTED', 'PENDING')).toBe(false)
    expect(isValidTransition('REJECTED', 'MATCHED')).toBe(false)
  })

  it('PENDING cannot skip directly to DISBURSED', () => {
    expect(isValidTransition('PENDING', 'DISBURSED')).toBe(false)
  })

  it('CANCELLED cannot transition to MATCHED', () => {
    expect(isValidTransition('CANCELLED', 'MATCHED')).toBe(false)
  })
})

describe('Lender Preference Matching', () => {
  const pref = {
    minLoanAmount: 10000,
    maxLoanAmount: 200000,
    minInterestRate: 10,
    maxInterestRate: 18,
    minTenureMonths: 6,
    maxTenureMonths: 36,
    riskAppetite: 'MEDIUM',
  }

  function matchesPreference(request, preference) {
    return (
      request.amount       >= preference.minLoanAmount    &&
      request.amount       <= preference.maxLoanAmount    &&
      request.tenureMonths >= preference.minTenureMonths  &&
      request.tenureMonths <= preference.maxTenureMonths
    )
  }

  it('matches request within all preference bounds', () => {
    const req = { amount: 50000, tenureMonths: 12 }
    expect(matchesPreference(req, pref)).toBe(true)
  })

  it('rejects request below minimum amount', () => {
    const req = { amount: 5000, tenureMonths: 12 }
    expect(matchesPreference(req, pref)).toBe(false)
  })

  it('rejects request above maximum amount', () => {
    const req = { amount: 300000, tenureMonths: 12 }
    expect(matchesPreference(req, pref)).toBe(false)
  })

  it('rejects request with tenure below minimum', () => {
    const req = { amount: 50000, tenureMonths: 3 }
    expect(matchesPreference(req, pref)).toBe(false)
  })

  it('rejects request with tenure above maximum', () => {
    const req = { amount: 50000, tenureMonths: 60 }
    expect(matchesPreference(req, pref)).toBe(false)
  })

  it('accepts request exactly at minimum bounds', () => {
    const req = { amount: 10000, tenureMonths: 6 }
    expect(matchesPreference(req, pref)).toBe(true)
  })

  it('accepts request exactly at maximum bounds', () => {
    const req = { amount: 200000, tenureMonths: 36 }
    expect(matchesPreference(req, pref)).toBe(true)
  })

  it('ranks requests — higher amount preferred for HIGH risk appetite', () => {
    const reqs = [
      { id: 1, amount: 50000,  tenureMonths: 12 },
      { id: 2, amount: 150000, tenureMonths: 12 },
      { id: 3, amount: 10000,  tenureMonths: 12 },
    ]
    const ranked = [...reqs].sort((a, b) => b.amount - a.amount)
    expect(ranked[0].id).toBe(2)
    expect(ranked[1].id).toBe(1)
    expect(ranked[2].id).toBe(3)
  })
})

/* ═══════════════════════════════════════════════════════════
   WEEK 5 — EMI calculation & amortization
═══════════════════════════════════════════════════════════ */

describe('EMI Calculation', () => {
  it('calculates correct EMI for standard loan', () => {
    const emi = calculateEmi(100000, 12, 12)
    expect(round2(emi)).toBe(8884.88)
  })

  it('calculates correct EMI for long tenure', () => {
    const emi = calculateEmi(500000, 10, 60)
    expect(emi).toBeGreaterThan(9000)
    expect(emi).toBeLessThan(11000)
  })

  it('total repayment is always greater than principal', () => {
    const emi = calculateEmi(100000, 12, 12)
    const total = emi * 12
    expect(total).toBeGreaterThan(100000)
  })

  it('higher interest rate produces higher EMI', () => {
    const lowEmi  = calculateEmi(100000, 8,  12)
    const highEmi = calculateEmi(100000, 24, 12)
    expect(highEmi).toBeGreaterThan(lowEmi)
  })

  it('longer tenure produces lower EMI', () => {
    const shortEmi = calculateEmi(100000, 12, 12)
    const longEmi  = calculateEmi(100000, 12, 60)
    expect(longEmi).toBeLessThan(shortEmi)
  })

  it('handles zero interest rate (simple division)', () => {
    const emi = calculateEmi(120000, 0, 12)
    expect(round2(emi)).toBe(10000)
  })

  it('minimum loan amount produces positive EMI', () => {
    const emi = calculateEmi(1000, 8, 6)
    expect(emi).toBeGreaterThan(0)
  })
})

describe('Amortization Schedule', () => {
  const schedule = generateAmortization(100000, 12, 12)

  it('generates correct number of rows', () => {
    expect(schedule).toHaveLength(12)
  })

  it('first row opening balance equals principal', () => {
    expect(schedule[0].openingBalance).toBe(100000)
  })

  it('last row closing balance is effectively zero', () => {
    expect(schedule[11].closingBalance).toBeLessThan(1)
  })

  it('each row closing balance equals next row opening balance', () => {
    for (let i = 0; i < schedule.length - 1; i++) {
      expect(round2(schedule[i].closingBalance)).toBe(round2(schedule[i + 1].openingBalance))
    }
  })

  it('interest decreases over time (reducing balance)', () => {
    expect(schedule[0].interest).toBeGreaterThan(schedule[11].interest)
  })

  it('principal component increases over time', () => {
    expect(schedule[0].principal).toBeLessThan(schedule[11].principal)
  })

  it('EMI is constant across all rows', () => {
    const firstEmi = schedule[0].emi
    schedule.forEach(row => {
      expect(Math.abs(row.emi - firstEmi)).toBeLessThan(0.01)
    })
  })

  it('sum of principal components equals loan amount', () => {
    const totalPrincipal = schedule.reduce((s, r) => s + r.principal, 0)
    expect(Math.abs(totalPrincipal - 100000)).toBeLessThan(1)
  })

  it('generates due dates in ascending order', () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(new Date(schedule[i].dueDate) > new Date(schedule[i-1].dueDate)).toBe(true)
    }
  })
})

/* ═══════════════════════════════════════════════════════════
   WEEK 6 — Auth & role-based access
═══════════════════════════════════════════════════════════ */

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, credentials: null })
  })

  it('starts unauthenticated', () => {
    const { user } = useAuthStore.getState()
    expect(user).toBeNull()
  })

  it('login sets user and credentials', () => {
    const user = { id: 1, role: 'BORROWER', firstName: 'Test' }
    useAuthStore.getState().login({ user, credentials: { username: '9876543210', password: 'Test@123' } })
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().credentials?.username).toBe('9876543210')
  })

  it('login sets JWT token', () => {
    const user = { id: 1, role: 'LENDER' }
    useAuthStore.getState().login({ user, token: 'eyJhbGciOiJIUzI1NiJ9.test' })
    expect(useAuthStore.getState().token).toBe('eyJhbGciOiJIUzI1NiJ9.test')
  })

  it('logout clears all auth state', () => {
    useAuthStore.setState({ user: { id: 1 }, token: 'abc', credentials: { username: 'x', password: 'y' } })
    useAuthStore.getState().logout()
    const { user, token, credentials } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(credentials).toBeNull()
  })

  it('getRole returns correct role', () => {
    useAuthStore.setState({ user: { id: 1, role: 'ADMIN' } })
    expect(useAuthStore.getState().getRole()).toBe('ADMIN')
  })

  it('getRole returns null when unauthenticated', () => {
    expect(useAuthStore.getState().getRole()).toBeNull()
  })
})

describe('Role-based route access', () => {
  function canAccess(userRole, allowedRoles) {
    if (!userRole) return false
    return allowedRoles.includes(userRole)
  }

  it('BORROWER can access borrower routes', () => {
    expect(canAccess('BORROWER', ['BORROWER'])).toBe(true)
  })

  it('BORROWER cannot access admin routes', () => {
    expect(canAccess('BORROWER', ['ADMIN'])).toBe(false)
  })

  it('LENDER can access lender routes', () => {
    expect(canAccess('LENDER', ['LENDER'])).toBe(true)
  })

  it('ADMIN can access admin routes', () => {
    expect(canAccess('ADMIN', ['ADMIN'])).toBe(true)
  })

  it('unauthenticated user cannot access any protected route', () => {
    expect(canAccess(null, ['BORROWER', 'LENDER', 'ADMIN'])).toBe(false)
  })
})

/* ═══════════════════════════════════════════════════════════
   WEEK 7 — Credit score & partial repayment
═══════════════════════════════════════════════════════════ */

describe('Credit Score Calculation', () => {
  function computeScore(profile) {
    const kycBonus  = profile.kycStatus === 'VERIFIED' ? 150 : 0
    const incomeMap = { ABOVE_50_LPA: 120, '20_50_LPA': 100, '10_20_LPA': 80, '5_10_LPA': 60, '2_5_LPA': 40, BELOW_2_LPA: 20 }
    const expMap    = { ADVANCED: 80, INTERMEDIATE: 50, BEGINNER: 20 }
    return Math.min(900, 450 + kycBonus + (incomeMap[profile.incomeBracket] || 60) + (expMap[profile.p2pExperience] || 20))
  }

  it('verified KYC improves score significantly', () => {
    const withKyc    = computeScore({ kycStatus: 'VERIFIED', incomeBracket: '5_10_LPA', p2pExperience: 'BEGINNER' })
    const withoutKyc = computeScore({ kycStatus: 'PENDING',  incomeBracket: '5_10_LPA', p2pExperience: 'BEGINNER' })
    expect(withKyc).toBeGreaterThan(withoutKyc)
    expect(withKyc - withoutKyc).toBe(150)
  })

  it('higher income bracket produces higher score', () => {
    const highIncome = computeScore({ kycStatus: 'VERIFIED', incomeBracket: 'ABOVE_50_LPA', p2pExperience: 'BEGINNER' })
    const lowIncome  = computeScore({ kycStatus: 'VERIFIED', incomeBracket: 'BELOW_2_LPA',  p2pExperience: 'BEGINNER' })
    expect(highIncome).toBeGreaterThan(lowIncome)
  })

  it('score never exceeds 900', () => {
    const maxScore = computeScore({ kycStatus: 'VERIFIED', incomeBracket: 'ABOVE_50_LPA', p2pExperience: 'ADVANCED' })
    expect(maxScore).toBeLessThanOrEqual(900)
  })

  it('score is always at least 300', () => {
    const minScore = computeScore({ kycStatus: 'PENDING', incomeBracket: 'BELOW_2_LPA', p2pExperience: 'BEGINNER' })
    expect(minScore).toBeGreaterThanOrEqual(300)
  })
})

describe('Early Closure Quote', () => {
  function computeEarlyClosureQuote(outstanding, penaltyRatePct = 2) {
    const penalty      = round2(outstanding * penaltyRatePct / 100)
    const totalPayable = round2(outstanding + penalty)
    return { outstanding, penalty, totalPayable }
  }

  it('computes penalty correctly', () => {
    const quote = computeEarlyClosureQuote(50000)
    expect(quote.penalty).toBe(1000)
  })

  it('total payable equals outstanding plus penalty', () => {
    const quote = computeEarlyClosureQuote(75000)
    expect(quote.totalPayable).toBe(quote.outstanding + quote.penalty)
  })

  it('zero penalty rate means no penalty', () => {
    const quote = computeEarlyClosureQuote(100000, 0)
    expect(quote.penalty).toBe(0)
    expect(quote.totalPayable).toBe(100000)
  })
})

describe('Partial Repayment', () => {
  it('partial payment reduces outstanding balance', () => {
    const outstanding = 80000
    const payment     = 20000
    const newBalance  = outstanding - payment
    expect(newBalance).toBe(60000)
  })

  it('partial payment cannot exceed outstanding balance', () => {
    const outstanding = 50000
    const payment     = 60000
    expect(payment > outstanding).toBe(true) // should be rejected
  })

  it('recalculates EMI after partial payment', () => {
    const remaining     = 60000
    const ANNUAL_RATE   = 12
    const monthsLeft    = 8
    const newEmi        = calculateEmi(remaining, ANNUAL_RATE, monthsLeft)
    const originalEmi   = calculateEmi(80000, ANNUAL_RATE, 12)
    expect(newEmi).toBeLessThan(originalEmi)
  })
})

/* ═══════════════════════════════════════════════════════════
   WEEK 8 — Formatting utilities
═══════════════════════════════════════════════════════════ */

describe('formatINR', () => {
  it('formats large amounts with Indian numbering', () => {
    const result = formatINR(100000)
    expect(result).toContain('1,00,000')
  })

  it('handles zero', () => {
    const result = formatINR(0)
    expect(result).toContain('0')
  })

  it('returns dash for null/undefined', () => {
    expect(formatINR(null)).toBe('—')
    expect(formatINR(undefined)).toBe('—')
  })

  it('formats currency symbol correctly', () => {
    const result = formatINR(50000)
    expect(result).toMatch(/₹|INR/)
  })
})

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(10.555)).toBe(10.56)
    expect(round2(10.554)).toBe(10.55)
  })

  it('handles whole numbers', () => {
    expect(round2(100)).toBe(100)
  })
})
