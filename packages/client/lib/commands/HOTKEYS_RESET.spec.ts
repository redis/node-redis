import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_RESET from './HOTKEYS_RESET';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS RESET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HOTKEYS_RESET),
      ['HOTKEYS', 'RESET']
    );
  });

  testUtils.testWithClient('client.hotkeysReset', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start and stop tracking, then reset
    await client.hotkeysStart({ METRICS: { count: 1, CPU: true } });
    await client.hotkeysStop();
    assert.equal(
      await client.hotkeysReset(),
      'OK'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});

