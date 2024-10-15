import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXPIREAT from './EXPIREAT';

describe('EXPIREAT', () => {
  describe('transformArguments', () => {
    it('number', () => {
      assert.deepEqual(
        EXPIREAT.transformArguments('key', 1),
        ['EXPIREAT', 'key', '1']
      );
    });

    it('date', () => {
      const d = new Date();
      assert.deepEqual(
        EXPIREAT.transformArguments('key', d),
        ['EXPIREAT', 'key', Math.floor(d.getTime() / 1000).toString()]
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        EXPIREAT.transformArguments('key', 1, 'GT'),
        ['EXPIREAT', 'key', '1', 'GT']
      );
    });
  });

  testUtils.testAll('expireAt', async client => {
    assert.equal(
      await client.expireAt('key', 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
