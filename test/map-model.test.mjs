import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMapStates, buildMapBadges } from '../app/components/map/model.ts';

test('missing results remain neutral and cannot create competitive badges', () => {
  const states = buildMapStates({});
  assert.equal(states.length, 27);
  assert.ok(states.every((state) => state.appearance.shares === null));
  assert.deepEqual(buildMapBadges(states), { badgePlacements: [], disputedCount: 0 });
});

test('badges keep closest margins first, unique slots, and count all disputed states', () => {
  const states = buildMapStates({}).map((state, index) => ({
    ...state, closeMargin: index / 10,
    appearance: { ...state.appearance, shares: { flavio: 50 + index / 20, lula: 50 - index / 20 } },
  }));
  const model = buildMapBadges(states);
  assert.equal(model.disputedCount, 27);
  assert.equal(model.badgePlacements.length, 10);
  assert.equal(new Set(model.badgePlacements.map(({ x, y }) => `${x}:${y}`)).size, 10);
  assert.deepEqual(model.badgePlacements.map(({ state }) => state.margin), states.slice(0, 10).map((state) => state.closeMargin));
});
