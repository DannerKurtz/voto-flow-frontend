import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidateLine, buildStateVotePoints, stateVoteChart } from '../app/components/map/line-chart-model.ts';

function comparison(flavio, lula) {
  return {
    availability: 'ready',
    secondRound: { candidates: [
      { key: 'flavio', percentage: flavio },
      { key: 'lula', percentage: lula },
    ] },
  };
}

test('line chart uses official second-round percentages in UF order and keeps pending states empty', () => {
  const points = buildStateVotePoints({ sp: comparison(48.2, 51.8), ac: comparison(44, 56), df: { availability: 'pending', secondRound: null } });

  assert.equal(points.length, 27);
  assert.deepEqual(points.slice(0, 3).map(({ code }) => code), ['ac', 'al', 'am']);
  assert.equal(points.find(({ code }) => code === 'ac')?.lula, 56);
  assert.equal(points.find(({ code }) => code === 'sp')?.flavio, 48.2);
  assert.equal(points.find(({ code }) => code === 'df')?.flavio, null);
});

test('line path starts a new segment after a pending state instead of bridging missing data', () => {
  const points = [
    { code: 'ac', name: 'Acre', flavio: 40, lula: 60 },
    { code: 'al', name: 'Alagoas', flavio: null, lula: null },
    { code: 'am', name: 'Amazonas', flavio: 55, lula: 45 },
  ];

  const path = buildCandidateLine(points, 'flavio');
  const xLast = stateVoteChart.width - stateVoteChart.right;
  const yFirst = stateVoteChart.top + ((100 - 40) / 100) * (stateVoteChart.height - stateVoteChart.top - stateVoteChart.bottom);
  const yLast = stateVoteChart.top + ((100 - 55) / 100) * (stateVoteChart.height - stateVoteChart.top - stateVoteChart.bottom);

  assert.match(path, /^M /);
  assert.match(path, / M /);
  assert.doesNotMatch(path, / L /);
  assert.ok(path.includes(`${xLast.toFixed(2)} ${yLast.toFixed(2)}`));
  assert.ok(path.includes(yFirst.toFixed(2)));
});
