import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BZPOPMIN from './BZPOPMIN';
import { parseArgs } from './generic-transformers';

describe('BZPOPMIN', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(BZPOPMIN, 'key', 0),
        ['BZPOPMIN', 'key', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(BZPOPMIN, ['1', '2'], 0),
        ['BZPOPMIN', '1', '2', '0']
      );
    });
  });

  testUtils.testAll('bzPopMin - null', async client => {
    assert.equal(
      await client.bzPopMin('key', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });

  testUtils.testAll('bzPopMin - with member', async client => {
    const key = 'key',
      member = {
        value: 'a',
        score: 1
      },
      [, reply] = await Promise.all([
        client.zAdd(key, member),
        client.bzPopMin(key, BLOCKING_MIN_VALUE)
      ]);

    assert.deepEqual(reply, {
      key,
      ...member
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
