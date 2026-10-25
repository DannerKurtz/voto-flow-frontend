import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { analyticsBootstrap, analyticsMeasurementId } from '../app/lib/analytics.ts';

test('analytics stays disabled without valid production configuration', () => {
  assert.equal(analyticsMeasurementId(undefined, 'production'), null);
  assert.equal(analyticsMeasurementId('G-EXAMPLE123', 'development'), null);
  assert.equal(analyticsMeasurementId('G-EXAMPLE123', 'production'), 'G-EXAMPLE123');
  assert.equal(analyticsMeasurementId('G-X</script>', 'production'), null);
  assert.throws(() => analyticsBootstrap('G-X</script>'));
});

test('initialization queues GA configuration without replacing an existing data layer', () => {
  const window = { dataLayer: [['existing-event']] };
  runInNewContext(analyticsBootstrap('G-EXAMPLE123'), { window });
  assert.equal(window.dataLayer[0][0], 'existing-event');
  assert.equal(window.dataLayer[2][0], 'config');
  assert.equal(window.dataLayer[2][1], 'G-EXAMPLE123');
  assert.equal(window.dataLayer[2][2].allow_google_signals, false);
});
