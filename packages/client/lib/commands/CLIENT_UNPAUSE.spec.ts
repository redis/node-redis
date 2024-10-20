import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_UNPAUSE from './CLIENT_UNPAUSE';
import { parseArgs } from './generic-transformers';

describe('CLIENT UNPAUSE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_UNPAUSE),
      ['CLIENT', 'UNPAUSE']
    );
  });

  testUtils.testWithClient('client.clientUnpause', async client => {
    assert.equal(
      await client.clientUnpause(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
