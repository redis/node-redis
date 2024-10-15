import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BZPOPMAX from './BZPOPMAX';
import { parseArgs } from './generic-transformers';

describe('BZPOPMAX', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(BZPOPMAX, 'key', 0),
        ['BZPOPMAX', 'key', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(BZPOPMAX, ['1', '2'], 0),
        ['BZPOPMAX', '1', '2', '0']
      );
    });
  });

  testUtils.testAll('bzPopMax - null', async client => {
    assert.equal(
      await client.bzPopMax('key', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });

  testUtils.testAll('bzPopMax - with member', async client => {
    const key = 'key',
      member = {
        value: 'a',
        score: 1
      },
      [, reply] = await Promise.all([
        client.zAdd(key, member),
        client.bzPopMax(key, BLOCKING_MIN_VALUE)
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
