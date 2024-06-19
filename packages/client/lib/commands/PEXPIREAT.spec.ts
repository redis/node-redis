import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PEXPIREAT from './PEXPIREAT';
import { parseArgs } from './generic-transformers';

describe('PEXPIREAT', () => {
  describe('transformArguments', () => {
    it('number', () => {
      assert.deepEqual(
        parseArgs(PEXPIREAT, 'key', 1),
        ['PEXPIREAT', 'key', '1']
      );
    });

    it('date', () => {
      const d = new Date();
      assert.deepEqual(
        parseArgs(PEXPIREAT, 'key', d),
        ['PEXPIREAT', 'key', d.getTime().toString()]
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(PEXPIREAT, 'key', 1, 'XX'),
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
