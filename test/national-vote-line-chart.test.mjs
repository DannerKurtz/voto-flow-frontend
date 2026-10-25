import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoteHistory } from '../app/lib/national-vote-history.ts';
import { buildCandidateLine, nearestHistoryPoint, voteChartScale, voteChart, voteCoordinates } from '../app/components/map/national-vote-model.ts';

const point = (recordedAt, a, b) => ({ recordedAt, totalizationPercentage: 10, candidates: [
  { key: 'flavio', votes: a, percentage: 45 }, { key: 'lula', votes: b, percentage: 55 },
] });
const response = (points) => ({ scopeCode: 'br', electionCode: 'second', points });

test('national history uses persisted vote totals in chronological order and allows official corrections', () => {
  const history = parseVoteHistory(response([point('2026-10-25T20:10:00Z', 90, 150), point('2026-10-25T20:00:00Z', 100, 120)]));
  assert.deepEqual(history.points.map((p) => p.candidates[0].votes), [100, 90]);
  assert.equal(history.points[0].recordedAt, '2026-10-25T20:00:00Z');
  assert.throws(() => parseVoteHistory({ ...response([]), scopeCode: 'sp' }));
  assert.throws(() => parseVoteHistory(response([point('invalid', 1, 2)])));
  assert.throws(() => parseVoteHistory(response([point('2026-10-25T20:00:00Z', -1, 2)])));
  const duplicate = point('2026-10-25T20:00:00Z', 1, 2); duplicate.candidates[1].key = 'flavio';
  assert.throws(() => parseVoteHistory(response([duplicate])));
});

test('lines use elapsed time on x and official national percentages on y', () => {
  const points = [point('2026-10-25T20:00:00Z', 100, 120), point('2026-10-25T20:01:00Z', 150, 180), point('2026-10-25T20:10:00Z', 200, 250)];
  const scale = voteChartScale(points);
  const middle = voteCoordinates(points[1], 'flavio', scale);
  assert.equal(middle.x, voteChart.left + 0.1 * (voteChart.width - voteChart.left - voteChart.right));
  assert.equal(middle.y, voteChart.top + (1 - 45 / scale.maximum) * (voteChart.height - voteChart.top - voteChart.bottom));
  assert.equal(scale.maximum, 75);
  assert.match(buildCandidateLine(points, 'flavio'), /^M .* L .* L /);
  assert.notEqual(buildCandidateLine(points, 'flavio'), buildCandidateLine(points, 'lula'));
});

test('tooltip selects the nearest real timestamp and keeps both candidates at the same time', () => {
  const points = [point('2026-10-25T20:00:00Z', 100, 120), point('2026-10-25T20:01:00Z', 150, 180), point('2026-10-25T20:10:00Z', 200, 250)];
  const scale = voteChartScale(points);
  assert.equal(nearestHistoryPoint(points, voteChart.left + .1 * (voteChart.width - voteChart.left - voteChart.right), scale), 1);
  assert.equal(nearestHistoryPoint(points, -100, scale), 0);
  assert.equal(nearestHistoryPoint(points, voteChart.width + 100, scale), 2);
  assert.equal(nearestHistoryPoint([], 0), -1);
  points[2].candidates[0].percentage = 90;
  assert.equal(voteChartScale(points).maximum, 100);
});

test('empty and single-record histories never fabricate earlier votes or invalid coordinates', () => {
  assert.equal(buildCandidateLine([], 'flavio'), '');
  const points = [point('2026-10-25T20:00:00Z', 0, 0)];
  const path = buildCandidateLine(points, 'flavio');
  assert.match(path, /^M /); assert.doesNotMatch(path, /L|NaN|Infinity/);
  assert.equal(points.length, 1);
});
