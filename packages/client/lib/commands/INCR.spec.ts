import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCR from './INCR';
import { parseArgs } from './generic-transformers';

describe('INCR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INCR, 'key'),
      ['INCR', 'key']
    );
  });

  testUtils.testAll('incr', async client => {
    assert.equal(
      await client.incr('key'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
