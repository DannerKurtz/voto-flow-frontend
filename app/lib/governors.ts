export type GovernorCandidate = { sqcand: string; name: string; ballotName: string; votes: number; percentage: number };
export type GovernorResult = {
  scope: { code: string; level: 'state' };
  availability: 'pending' | 'ready';
  secondRound: null | {
    electionCode: string;
    totalizationPercentage: number;
    blankVotes: number;
    nullVotes: number;
    candidates: GovernorCandidate[];
  };
};
export type GovernorState = {
  results: Record<string, GovernorResult>;
  status: 'loading' | 'connected' | 'reconnecting' | 'unavailable';
  error: string | null;
};

const stateNames: Record<string, string> = {
  ac: 'Acre', am: 'Amazonas', df: 'Distrito Federal', es: 'Espírito Santo', rn: 'Rio Grande do Norte', to: 'Tocantins',
};
export function governorScopeName(code: string): string { return stateNames[code] ?? code.toUpperCase(); }
