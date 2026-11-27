export function formatUsdc(amount: number | string): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(numeric)) return '0.00 USDC'
  return `${numeric.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDC`
}

export function truncateAddress(address: string, start = 6, end = 6): string {
  if (address.length <= start + end + 3) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function formatShortDate(isoDate: string): string {
  const normalized = isoDate.length > 10 ? isoDate.slice(0, 10) : isoDate
  const date = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
