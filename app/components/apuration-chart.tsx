type Snapshot = {
  createdAt: string;
  sourcePayload: { s?: { pst?: string | number } };
};

function percentage(snapshot: Snapshot): number | null {
  const value = snapshot.sourcePayload?.s?.pst;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parsed = Number(value.replace('.', '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ApurationChart({ snapshots }: { snapshots: Snapshot[] }) {
  const points = snapshots
    .map((snapshot) => ({ value: percentage(snapshot), createdAt: snapshot.createdAt }))
    .filter((point): point is { value: number; createdAt: string } => point.value !== null)
    .reverse();

  if (points.length < 2) {
    return <div className="chart-empty">O histórico será exibido quando houver pelo menos duas atualizações.</div>;
  }

  const values = points.map((point) => point.value);
  const minimum = Math.max(0, Math.min(...values) - 1);
  const maximum = Math.min(100, Math.max(...values) + 1);
  const range = Math.max(maximum - minimum, 1);
  const line = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 100 - ((point.value - minimum) / range) * 100;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return <div className="chart" role="img" aria-label={`Evolução da apuração de ${values[0].toFixed(2)}% para ${values.at(-1)?.toFixed(2)}%`}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={line} /></svg>
    <span className="chart-value">{values.at(-1)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
  </div>;
}
