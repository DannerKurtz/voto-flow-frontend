import type { CandidateResult, PresidentialComparison, RoundResult } from '../comparison.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function percentage(value: unknown): value is number {
  return nonnegative(value) && value <= 100;
}
function candidate(value: unknown): value is CandidateResult {
  return isRecord(value) && (value.key === 'flavio' || value.key === 'lula')
    && typeof value.sqcand === 'string' && typeof value.name === 'string' && typeof value.ballotName === 'string'
    && nonnegative(value.votes) && percentage(value.percentage);
}
function round(value: unknown): value is RoundResult {
  return isRecord(value) && typeof value.electionCode === 'string' && percentage(value.totalizationPercentage)
    && Array.isArray(value.candidates) && value.candidates.length === 2 && value.candidates.every(candidate)
    && new Set(value.candidates.map((entry) => entry.key)).size === 2;
}
export function isComparison(value: unknown): value is PresidentialComparison {
  if (!isRecord(value) || !isRecord(value.scope) || typeof value.scope.code !== 'string'
    || !/^(br|ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)$/.test(value.scope.code)
    || !['national', 'state'].includes(String(value.scope.level))) return false;
  const surplus = value.estimatedSurplus;
  if (!isRecord(surplus) || surplus.estimated !== true || typeof surplus.eligible !== 'boolean'
    || typeof surplus.label !== 'string' || !Array.isArray(surplus.candidates)
    || !surplus.candidates.every((entry: unknown) => isRecord(entry)
      && (entry.key === 'flavio' || entry.key === 'lula') && (entry.votes === null || nonnegative(entry.votes)))) return false;
  if (value.availability === 'pending') return value.firstRound === null && value.secondRound === null;
  return value.availability === 'ready' && round(value.firstRound)
    && isRecord(value.secondRound) && nonnegative(value.secondRound.blankVotes) && nonnegative(value.secondRound.nullVotes)
    && round(value.secondRound);
}
export function parseComparisonList(payload: unknown): PresidentialComparison[] {
  if (!isRecord(payload) || !Array.isArray(payload.results) || !payload.results.every(isComparison)) {
    throw new Error('O backend retornou uma comparação inválida.');
  }
  return payload.results;
}
export function parseComparisonUpdate(raw: unknown): PresidentialComparison | null {
  if (typeof raw !== 'string') return null;
  try {
    const message: unknown = JSON.parse(raw);
    if (!isRecord(message) || message.type !== 'second-round.comparison.updated' || !isRecord(message.data)) return null;
    const value = message.data.comparison;
    return isComparison(value) && message.data.scopeCode === value.scope.code ? value : null;
  } catch { return null; }
}
