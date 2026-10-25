import type { CandidateKey, PresidentialComparison } from '../../lib/comparison.ts';
import { candidateFor } from '../../lib/comparison.ts';
import { stateNames, stateShapes } from './geometry.ts';

export type StateVotePoint = {
  code: string;
  name: string;
  flavio: number | null;
  lula: number | null;
};

export const stateVoteChart = {
  width: 960,
  height: 360,
  left: 58,
  right: 18,
  top: 20,
  bottom: 54,
} as const;

export function buildStateVotePoints(comparisons: Record<string, PresidentialComparison>): StateVotePoint[] {
  return stateShapes
    .map(({ code }) => {
      const comparison = comparisons[code];
      const round = comparison?.availability === 'ready' ? comparison.secondRound : null;
      return {
        code,
        name: stateNames[code],
        flavio: candidateFor(round, 'flavio')?.percentage ?? null,
        lula: candidateFor(round, 'lula')?.percentage ?? null,
      };
    })
    .sort((left, right) => left.code.localeCompare(right.code));
}

export function buildCandidateLine(points: StateVotePoint[], key: CandidateKey): string {
  if (points.length < 2) return '';

  const plotWidth = stateVoteChart.width - stateVoteChart.left - stateVoteChart.right;
  const plotHeight = stateVoteChart.height - stateVoteChart.top - stateVoteChart.bottom;
  const commands: string[] = [];
  let startsSegment = true;

  points.forEach((point, index) => {
    const value = point[key];
    if (value === null) {
      startsSegment = true;
      return;
    }

    const x = stateVoteChart.left + (index / (points.length - 1)) * plotWidth;
    const y = stateVoteChart.top + ((100 - value) / 100) * plotHeight;
    commands.push(`${startsSegment ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    startsSegment = false;
  });

  return commands.join(' ');
}
