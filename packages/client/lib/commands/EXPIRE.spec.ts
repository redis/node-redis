import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXPIRE from './EXPIRE';
import { parseArgs } from './generic-transformers';

describe('EXPIRE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(EXPIRE, 'key', 1),
        ['EXPIRE', 'key', '1']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(EXPIRE, 'key', 1, 'NX'),
        ['EXPIRE', 'key', '1', 'NX']
      );
    });
  });

  testUtils.testAll('expire', async client => {
    assert.equal(
      await client.expire('key', 0),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
