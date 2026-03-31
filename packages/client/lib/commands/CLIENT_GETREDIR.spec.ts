import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_GETREDIR from './CLIENT_GETREDIR';
import { parseArgs } from './generic-transformers';

describe('CLIENT GETREDIR', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_GETREDIR),
      ['CLIENT', 'GETREDIR']
    );
  });

  testUtils.testWithClient('client.clientGetRedir', async client => {
    assert.equal(
      await client.clientGetRedir(),
      -1
    );
  }, GLOBAL.SERVERS.OPEN);
});
