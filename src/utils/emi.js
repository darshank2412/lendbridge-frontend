/**
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where r = annualRate / 12 / 100
 */
export function calculateEmi(principal, annualRate, tenureMonths) {
  const r = annualRate / 12 / 100
  if (r === 0) return principal / tenureMonths
  const pow = Math.pow(1 + r, tenureMonths)
  return (principal * r * pow) / (pow - 1)
}

/**
 * Generate full amortization schedule
 */
export function generateAmortization(principal, annualRate, tenureMonths, disbursedAt) {
  const emi = calculateEmi(principal, annualRate, tenureMonths)
  const r = annualRate / 12 / 100
  const schedule = []
  let balance = principal
  const startDate = disbursedAt ? new Date(disbursedAt) : new Date()

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = balance * r
    const principalPart = emi - interest
    const closing = Math.max(0, balance - principalPart)

    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i)

    schedule.push({
      emiNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      openingBalance: round2(balance),
      principal: round2(principalPart),
      interest: round2(interest),
      emi: round2(emi),
      closingBalance: round2(closing),
    })
    balance = closing
  }
  return schedule
}

export function round2(n) {
  return Math.round(n * 100) / 100
}

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getLoanStatusColor(status) {
  const map = {
    PENDING: 'badge-pending',
    MATCHED: 'badge-matched',
    ACCEPTED: 'badge-accepted',
    REJECTED: 'badge-rejected',
    CANCELLED: 'badge-cancelled',
    DISBURSED: 'badge-disbursed',
  }
  return map[status] || 'badge-cancelled'
}

export function getKycStatusColor(status) {
  const map = {
    PENDING: 'badge-pending',
    VERIFIED: 'badge-verified',
    REJECTED: 'badge-rejected',
  }
  return map[status] || 'badge-pending'
}
