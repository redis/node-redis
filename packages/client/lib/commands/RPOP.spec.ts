import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPOP from './RPOP';

describe('RPOP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RPOP.transformArguments('key'),
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
