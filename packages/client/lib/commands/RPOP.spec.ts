import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPOP from './RPOP';
import { parseArgs } from './generic-transformers';

describe('RPOP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RPOP, 'key'),
      ['RPOP', 'key']
    );
  });

  testUtils.testAll('rPop', async client => {
    assert.equal(
      await client.rPop('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
