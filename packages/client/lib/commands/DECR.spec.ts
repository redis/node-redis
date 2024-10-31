import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DECR from './DECR';
import { parseArgs } from './generic-transformers';

describe('DECR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DECR, 'key'),
      ['DECR', 'key']
    );
  });

  testUtils.testAll('decr', async client => {
    assert.equal(
      await client.decr('key'),
      -1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
