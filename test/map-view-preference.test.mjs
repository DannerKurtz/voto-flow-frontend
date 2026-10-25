import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapViewPreferenceKey, mapViewModes, parseMapViewMode, readMapViewPreference, writeMapViewPreference } from '../app/lib/map-view-preference.ts';

test('all available map views can be restored from storage', () => {
  assert.equal(mapViewPreferenceKey, 'voto-flow-map-view-mode');
  for (const mode of mapViewModes) assert.equal(parseMapViewMode(mode), mode);
});

test('unknown or empty stored values fall back to the default view', () => {
  assert.equal(parseMapViewMode(null), null);
  assert.equal(parseMapViewMode('unknown'), null);
  assert.equal(parseMapViewMode('Chart'), null);
});

test('saved view mode is restored and updated in browser storage', () => {
  const values = new Map([[mapViewPreferenceKey, 'chart']]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(readMapViewPreference(storage), 'chart');
  writeMapViewPreference(storage, 'leadership');
  assert.equal(readMapViewPreference(storage), 'leadership');
});

test('missing preference defaults to dispute', () => {
  assert.equal(readMapViewPreference({ getItem: () => null }), 'dispute');
});
