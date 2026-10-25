import type { CandidateKey } from '../../lib/comparison.ts';
import type { VoteHistoryPoint } from '../../lib/national-vote-history.ts';

export const voteChart = { width: 720, height: 260, left: 54, right: 28, top: 20, bottom: 48 } as const;

export function voteChartScale(points: VoteHistoryPoint[]) {
  const largest = Math.max(0, ...points.flatMap((point) => point.candidates.map((candidate) => candidate.percentage)));
  const timestamps = points.map((point) => Date.parse(point.recordedAt));
  return { maximum: Math.max(75, Math.ceil(largest / 25) * 25), first: timestamps.length ? Math.min(...timestamps) : 0,
    last: timestamps.length ? Math.max(...timestamps) : 0 };
}

export function voteCoordinates(point: VoteHistoryPoint, key: CandidateKey, scale: ReturnType<typeof voteChartScale>) {
  const percentage = point.candidates.find((candidate) => candidate.key === key)!.percentage;
  const progress = scale.first === scale.last ? 0.5 : (Date.parse(point.recordedAt) - scale.first) / (scale.last - scale.first);
  return {
    x: voteChart.left + progress * (voteChart.width - voteChart.left - voteChart.right),
    y: voteChart.top + (1 - percentage / scale.maximum) * (voteChart.height - voteChart.top - voteChart.bottom),
  };
}

export function nearestHistoryPoint(points: VoteHistoryPoint[], x: number, scale = voteChartScale(points)): number {
  if (!points.length) return -1;
  const fraction = Math.max(0, Math.min(1, (x - voteChart.left) / (voteChart.width - voteChart.left - voteChart.right)));
  const timestamp = scale.first + fraction * (scale.last - scale.first);
  return points.reduce((nearest, point, index) => Math.abs(Date.parse(point.recordedAt) - timestamp)
    < Math.abs(Date.parse(points[nearest].recordedAt) - timestamp) ? index : nearest, 0);
}

export function buildCandidateLine(points: VoteHistoryPoint[], key: CandidateKey, scale = voteChartScale(points)): string {
  return points.map((point, index) => {
    const { x, y } = voteCoordinates(point, key, scale);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}
