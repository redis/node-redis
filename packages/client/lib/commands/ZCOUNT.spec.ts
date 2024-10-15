import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZCOUNT from './ZCOUNT';
import { parseArgs } from './generic-transformers';

describe('ZCOUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZCOUNT, 'key', 0, 1),
      ['ZCOUNT', 'key', '0', '1']
    );
  });

  testUtils.testAll('zCount', async client => {
    assert.equal(
      await client.zCount('key', 0, 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
