import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZDIFFSTORE from './ZDIFFSTORE';

describe('ZDIFFSTORE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        ZDIFFSTORE.transformArguments('destination', 'key'),
        ['ZDIFFSTORE', 'destination', '1', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        ZDIFFSTORE.transformArguments('destination', ['1', '2']),
        ['ZDIFFSTORE', 'destination', '2', '1', '2']
      );
    });
  });

  testUtils.testAll('zDiffStore', async client => {
    assert.equal(
      await client.zDiffStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
