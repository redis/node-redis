import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJECT_FREQ from './OBJECT_FREQ';
import { parseArgs } from './generic-transformers';

describe('OBJECT FREQ', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(OBJECT_FREQ, 'key'),
      ['OBJECT', 'FREQ', 'key']
    );
  });

  testUtils.testAll('client.objectFreq', async client => {
    assert.equal(
      await client.objectFreq('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
