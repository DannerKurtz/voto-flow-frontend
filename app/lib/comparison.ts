export type CandidateKey = 'flavio' | 'lula';
export type CandidateResult = { key: CandidateKey; sqcand: string; name: string; ballotName: string; party?: string; votes: number; percentage: number };
export type RoundResult = { electionCode: string; totalizationPercentage: number; candidates: CandidateResult[] };
export type SecondRoundResult = RoundResult & { blankVotes: number; nullVotes: number; sections?: { total: number; totalized: number } };
export type PresidentialComparison = {
  scope: { code: string; level: 'national' | 'state' };
  availability: 'pending' | 'ready';
  firstRound: RoundResult | null;
  secondRound: SecondRoundResult | null;
  estimatedSurplus: { estimated: true; eligible: boolean; label: string; candidates: Array<{ key: CandidateKey; votes: number | null }> };
};
export type ComparisonList = { results: PresidentialComparison[] };

export function candidateFor(round: RoundResult | SecondRoundResult | null, key: CandidateKey): CandidateResult | null { return round?.candidates.find((candidate) => candidate.key === key) ?? null; }
export function estimatedVotes(comparison: PresidentialComparison | null, key: CandidateKey): number | null { return comparison?.estimatedSurplus.eligible ? comparison.estimatedSurplus.candidates.find((candidate) => candidate.key === key)?.votes ?? null : null; }
