import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGovernorList, parseGovernorUpdate } from '../app/lib/realtime/governor-parser.ts';

const result = {
  scope: { code: 'ac', level: 'state' },
  availability: 'ready',
  secondRound: {
    electionCode: 'runoff', totalizationPercentage: 72.5, blankVotes: 50, nullVotes: 20,
    candidates: [
      { sqcand: '1', name: 'Candidate A', ballotName: 'A', votes: 500, percentage: 55 },
      { sqcand: '2', name: 'Candidate B', ballotName: 'B', votes: 400, percentage: 45 },
    ],
  },
};

test('validates the governor result list and permits pending scopes', () => {
  assert.deepEqual(parseGovernorList({ results: [result, { scope: { code: 'to', level: 'state' }, availability: 'pending', secondRound: null }] }), [
    result, { scope: { code: 'to', level: 'state' }, availability: 'pending', secondRound: null },
  ]);
  assert.throws(() => parseGovernorList({ results: [{ ...result, secondRound: { ...result.secondRound, totalizationPercentage: 105 } }] }));
});

test('accepts optional official party labels and rejects invalid party types', () => {
  const withParty = structuredClone(result);
  withParty.secondRound.candidates[0].party = 'PL';
  assert.equal(parseGovernorList({ results: [withParty] })[0].secondRound.candidates[0].party, 'PL');
  withParty.secondRound.candidates[0].party = 22;
  assert.throws(() => parseGovernorList({ results: [withParty] }));
});

test('accepts matching governor websocket messages and ignores unrelated or inconsistent frames', () => {
  assert.deepEqual(parseGovernorUpdate(JSON.stringify({ type: 'second-round.governor.updated', data: { scopeCode: 'ac', result } })), result);
  assert.equal(parseGovernorUpdate(JSON.stringify({ type: 'second-round.governor.updated', data: { scopeCode: 'df', result } })), null);
  assert.equal(parseGovernorUpdate(JSON.stringify({ type: 'result.updated', data: { result } })), null);
});
