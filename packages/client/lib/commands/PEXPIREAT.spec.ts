import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PEXPIREAT from './PEXPIREAT';

describe('PEXPIREAT', () => {
  describe('transformArguments', () => {
    it('number', () => {
      assert.deepEqual(
        PEXPIREAT.transformArguments('key', 1),
        ['PEXPIREAT', 'key', '1']
      );
    });

    it('date', () => {
      const d = new Date();
      assert.deepEqual(
        PEXPIREAT.transformArguments('key', d),
        ['PEXPIREAT', 'key', d.getTime().toString()]
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        PEXPIREAT.transformArguments('key', 1, 'XX'),
        ['PEXPIREAT', 'key', '1', 'XX']
      );
    });
  });

  testUtils.testAll('pExpireAt', async client => {
    assert.equal(
      await client.pExpireAt('key', 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
