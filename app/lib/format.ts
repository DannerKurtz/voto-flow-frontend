const votesFormatter = new Intl.NumberFormat('pt-BR');
const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactPercentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function formatVotes(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? votesFormatter.format(value) : '—';
}

export function formatPercentage(value: number | null | undefined, compact = false): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${(compact ? compactPercentageFormatter : percentageFormatter).format(value)}%`;
}
