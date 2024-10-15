import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJECT_REFCOUNT from './OBJECT_REFCOUNT';
import { parseArgs } from './generic-transformers';

describe('OBJECT REFCOUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(OBJECT_REFCOUNT, 'key'),
      ['OBJECT', 'REFCOUNT', 'key']
    );
  });

  testUtils.testAll('client.objectRefCount', async client => {
    assert.equal(
      await client.objectRefCount('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
