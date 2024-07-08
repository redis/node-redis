import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPOP from './SPOP';
import { parseArgs } from './generic-transformers';

describe('SPOP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SPOP, 'key'),
      ['SPOP', 'key']
    );
  });

  testUtils.testAll('sPop', async client => {
    assert.equal(
      await client.sPop('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
