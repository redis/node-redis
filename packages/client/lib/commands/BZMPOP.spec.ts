import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BZMPOP from './BZMPOP';

describe('BZMPOP', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        BZMPOP.transformArguments(0, 'key', 'MIN'),
        ['BZMPOP', '0', '1', 'key', 'MIN']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        BZMPOP.transformArguments(0, 'key', 'MIN', {
          COUNT: 2
        }),
        ['BZMPOP', '0', '1', 'key', 'MIN', 'COUNT', '2']
      );
    });
  });

  testUtils.testAll('bzmPop - null', async client => {
    assert.equal(
      await client.bzmPop(BLOCKING_MIN_VALUE, 'key', 'MAX'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });

  testUtils.testAll('bzmPop - with member', async client => {
    const key = 'key',
      member = {
        value: 'a',
        score: 1
      },
      [, reply] = await Promise.all([
        client.zAdd(key, member),
        client.bzmPop(BLOCKING_MIN_VALUE, key, 'MAX')
      ]);

    assert.deepEqual(reply, {
      key,
      members: [member]
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
