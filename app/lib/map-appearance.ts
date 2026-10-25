import { candidateTheme, mapTheme } from './theme.ts';
import { candidateFor, type PresidentialComparison, type CandidateKey } from './comparison.ts';

export type MapStateAppearance = {
  fill: string;
  leader: CandidateKey | null;
  label: string;
  shares: { flavio: number; lula: number } | null;
};

export function stateAppearance(comparison: PresidentialComparison | undefined, stateName: string): MapStateAppearance {
  if (!comparison || comparison.availability !== 'ready' || !comparison.secondRound) return { fill: mapTheme.neutral, leader: null, label: `${stateName}: apurando`, shares: null };
  const flavio = candidateFor(comparison.secondRound, 'flavio');
  const lula = candidateFor(comparison.secondRound, 'lula');
  if (!flavio || !lula || flavio.percentage === lula.percentage) return { fill: mapTheme.neutral, leader: null, label: `${stateName}: empate ou apuração pendente`, shares: null };
  const leader = flavio.percentage > lula.percentage ? 'flavio' : 'lula';
  const formatPercentage = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return {
    fill: candidateTheme[leader].color,
    leader,
    label: `${stateName}: ${candidateTheme.flavio.name} ${formatPercentage(flavio.percentage)}%, ${candidateTheme.lula.name} ${formatPercentage(lula.percentage)}%`,
    shares: {
      flavio: Math.min(100, Math.max(0, flavio.percentage)),
      lula: Math.min(100, Math.max(0, lula.percentage)),
    },
  };
}
