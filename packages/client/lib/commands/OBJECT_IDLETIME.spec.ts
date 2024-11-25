import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJECT_IDLETIME from './OBJECT_IDLETIME';
import { parseArgs } from './generic-transformers';

describe('OBJECT IDLETIME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(OBJECT_IDLETIME, 'key'),
      ['OBJECT', 'IDLETIME', 'key']
    );
  });

  testUtils.testAll('client.objectIdleTime', async client => {
    assert.equal(
      await client.objectIdleTime('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
