import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PEXPIRE from './PEXPIRE';
import { parseArgs } from './generic-transformers';

describe('PEXPIRE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(PEXPIRE, 'key', 1),
        ['PEXPIRE', 'key', '1']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(PEXPIRE, 'key', 1, 'GT'),
        ['PEXPIRE', 'key', '1', 'GT']
      );
    });
  });

  testUtils.testAll('pExpire', async client => {
    assert.equal(
      await client.pExpire('key', 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
