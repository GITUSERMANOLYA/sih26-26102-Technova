export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  return num.toLocaleString('en-IN');
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  return `${(num * 100).toFixed(1)}%`;
}
