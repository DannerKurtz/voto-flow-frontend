import { candidateTheme, mapTheme } from './theme';

export type CandidateKey = keyof typeof candidateTheme;
export type CandidateResult = { key: CandidateKey; sqcand: string; name: string; ballotName: string; votes: number; percentage: number };
export type RoundResult = { electionCode: string; totalizationPercentage: number; candidates: CandidateResult[] };
export type SecondRoundResult = RoundResult & { blankVotes: number; nullVotes: number };
export type PresidentialComparison = {
  scope: { code: string; level: 'national' | 'state' };
  availability: 'pending' | 'ready';
  firstRound: RoundResult | null;
  secondRound: SecondRoundResult | null;
  estimatedSurplus: { estimated: true; eligible: boolean; label: string; candidates: Array<{ key: CandidateKey; votes: number | null }> };
};
export type ComparisonList = { results: PresidentialComparison[] };

const fallbackApi = 'https://voto-flow-backend.onrender.com';
export function apiBaseUrl(): string { const configured = process.env.NEXT_PUBLIC_API_URL; return configured?.startsWith('http://') || configured?.startsWith('https://') ? configured : fallbackApi; }
export function websocketUrl(): string { return `${apiBaseUrl().replace(/^http/, 'ws')}/ws`; }
export function candidateFor(round: RoundResult | SecondRoundResult | null, key: CandidateKey): CandidateResult | null { return round?.candidates.find((candidate) => candidate.key === key) ?? null; }
export function estimatedVotes(comparison: PresidentialComparison | null, key: CandidateKey): number | null { return comparison?.estimatedSurplus.eligible ? comparison.estimatedSurplus.candidates.find((candidate) => candidate.key === key)?.votes ?? null : null; }
export type MapStateAppearance = { fill: string; leader: CandidateKey | null; label: string };

export function stateAppearance(comparison: PresidentialComparison | undefined, stateName: string): MapStateAppearance {
  if (!comparison || comparison.availability !== 'ready' || !comparison.secondRound) return { fill: mapTheme.neutral, leader: null, label: `${stateName}: apurando` };
  const flavio = candidateFor(comparison.secondRound, 'flavio');
  const lula = candidateFor(comparison.secondRound, 'lula');
  if (!flavio || !lula || flavio.percentage === lula.percentage) return { fill: mapTheme.neutral, leader: null, label: `${stateName}: empate ou apuração pendente` };
  const leader = flavio.percentage > lula.percentage ? 'flavio' : 'lula';
  const leadingPercentage = leader === 'flavio' ? flavio.percentage : lula.percentage;
  const marginProgress = Math.min(1, Math.max(0, (leadingPercentage - 50) / (mapTheme.maxIntensityPercentage - 50)));
  const intensity = mapTheme.minimumColorStrength + (1 - mapTheme.minimumColorStrength) * marginProgress;
  const [red, green, blue] = candidateTheme[leader].rgb;
  const neutral = [229, 234, 241];
  const mix = (channel: number, neutralChannel: number) => Math.round(neutralChannel + (channel - neutralChannel) * intensity);
  return { fill: `rgb(${mix(red, neutral[0])} ${mix(green, neutral[1])} ${mix(blue, neutral[2])})`, leader, label: `${stateName}: ${candidateTheme[leader].name} lidera com ${leadingPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` };
}
