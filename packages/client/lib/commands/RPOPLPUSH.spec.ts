import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPOPLPUSH from './RPOPLPUSH';

describe('RPOPLPUSH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RPOPLPUSH.transformArguments('source', 'destination'),
      ['RPOPLPUSH', 'source', 'destination']
    );
  });

  testUtils.testAll('rPopLPush', async client => {
    assert.equal(
      await client.rPopLPush('{tag}source', '{tag}destination'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
