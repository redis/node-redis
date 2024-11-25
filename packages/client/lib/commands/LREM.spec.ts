import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LREM from './LREM';
import { parseArgs } from './generic-transformers';

describe('LREM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LREM, 'key', 0, 'element'),
      ['LREM', 'key', '0', 'element']
    );
  });

  testUtils.testAll('lRem', async client => {
    assert.equal(
      await client.lRem('key', 0, 'element'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
