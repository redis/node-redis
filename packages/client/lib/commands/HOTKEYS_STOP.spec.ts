import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_STOP from './HOTKEYS_STOP';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS STOP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HOTKEYS_STOP),
      ['HOTKEYS', 'STOP']
    );
  });

  testUtils.testWithClient('client.hotkeysStop returns OK when stopping active session', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking, then stop
    await client.hotkeysStart({ METRICS: { count: 1, CPU: true } });
    assert.equal(
      await client.hotkeysStop(),
      'OK'
    );

    // Clean up
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.hotkeysStop returns null in empty state', async client => {
    // Ensure we're in EMPTY state
    await client.hotkeysStop();
    await client.hotkeysReset();

    // STOP on empty state should return null
    const result = await client.hotkeysStop();
    assert.equal(result, null);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});

