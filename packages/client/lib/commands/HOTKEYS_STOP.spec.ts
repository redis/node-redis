import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_STOP from './HOTKEYS_STOP';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS STOP', () => {
  testUtils.isVersionGreaterThanHook([8, 4]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HOTKEYS_STOP),
      ['HOTKEYS', 'STOP']
    );
  });

  testUtils.testWithClient('client.hotkeysStop', async client => {
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
});

