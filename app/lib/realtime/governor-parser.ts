import type { GovernorResult } from '../governors.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function nonnegative(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function isGovernorResult(value: unknown): value is GovernorResult {
  if (!isRecord(value) || !isRecord(value.scope) || typeof value.scope.code !== 'string' || value.scope.level !== 'state') return false;
  if (value.availability === 'pending') return value.secondRound === null;
  if (value.availability !== 'ready' || !isRecord(value.secondRound)) return false;
  const result = value.secondRound;
  return typeof result.electionCode === 'string' && nonnegative(result.totalizationPercentage) && result.totalizationPercentage <= 100
    && nonnegative(result.blankVotes) && nonnegative(result.nullVotes) && Array.isArray(result.candidates)
    && result.candidates.every((candidate: unknown) => isRecord(candidate) && typeof candidate.sqcand === 'string'
      && typeof candidate.name === 'string' && typeof candidate.ballotName === 'string'
      && (candidate.party === undefined || typeof candidate.party === 'string')
      && nonnegative(candidate.votes) && nonnegative(candidate.percentage) && candidate.percentage <= 100);
}
export function parseGovernorList(payload: unknown): GovernorResult[] {
  if (!isRecord(payload) || !Array.isArray(payload.results) || !payload.results.every(isGovernorResult)) {
    throw new Error('O backend retornou resultados de governador inválidos.');
  }
  return payload.results;
}
export function parseGovernorUpdate(raw: unknown): GovernorResult | null {
  if (typeof raw !== 'string') return null;
  try {
    const message: unknown = JSON.parse(raw);
    if (!isRecord(message) || message.type !== 'second-round.governor.updated' || !isRecord(message.data)) return null;
    const result = message.data.result;
    return isGovernorResult(result) && message.data.scopeCode === result.scope.code ? result : null;
  } catch { return null; }
}
