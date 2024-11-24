import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LINSERT from './LINSERT';
import { parseArgs } from './generic-transformers';

describe('LINSERT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LINSERT, 'key', 'BEFORE', 'pivot', 'element'),
      ['LINSERT', 'key', 'BEFORE', 'pivot', 'element']
    );
  });

  testUtils.testAll('lInsert', async client => {
    assert.equal(
      await client.lInsert('key', 'BEFORE', 'pivot', 'element'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
