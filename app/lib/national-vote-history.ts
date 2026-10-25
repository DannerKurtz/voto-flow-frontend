import type { CandidateKey } from './comparison.ts';

export type VoteHistoryPoint = {
  recordedAt: string;
  totalizationPercentage: number;
  candidates: Array<{ key: CandidateKey; votes: number; percentage: number }>;
};
export type VoteHistory = { scopeCode: 'br'; electionCode: string; points: VoteHistoryPoint[] };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function percentage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}
function point(value: unknown): value is VoteHistoryPoint {
  if (!record(value) || typeof value.recordedAt !== 'string' || !Number.isFinite(Date.parse(value.recordedAt))
    || !percentage(value.totalizationPercentage) || !Array.isArray(value.candidates) || value.candidates.length !== 2) return false;
  return value.candidates.every((candidate) => record(candidate)
    && (candidate.key === 'flavio' || candidate.key === 'lula')
    && typeof candidate.votes === 'number' && Number.isSafeInteger(candidate.votes) && candidate.votes >= 0
    && percentage(candidate.percentage)) && new Set(value.candidates.map((candidate) => candidate.key)).size === 2;
}

export function parseVoteHistory(payload: unknown): VoteHistory {
  if (!record(payload) || payload.scopeCode !== 'br' || typeof payload.electionCode !== 'string'
    || !Array.isArray(payload.points) || !payload.points.every(point)) {
    throw new Error('O backend retornou um histórico nacional inválido.');
  }
  return { scopeCode: 'br', electionCode: payload.electionCode,
    points: [...payload.points].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)) };
}
