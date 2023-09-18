import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUNIONSTORE from './SUNIONSTORE';

describe('SUNIONSTORE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        SUNIONSTORE.transformArguments('destination', 'key'),
        ['SUNIONSTORE', 'destination', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        SUNIONSTORE.transformArguments('destination', ['1', '2']),
        ['SUNIONSTORE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('sUnionStore', async client => {
    assert.equal(
      await client.sUnionStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
