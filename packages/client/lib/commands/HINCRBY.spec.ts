import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import HINCRBY from './HINCRBY';

describe('HINCRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HINCRBY.transformArguments('key', 'field', 1),
      ['HINCRBY', 'key', 'field', '1']
    );
  });

  testUtils.testAll('hIncrBy', async client => {
    assert.equal(
      await client.hIncrBy('key', 'field', 1),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
