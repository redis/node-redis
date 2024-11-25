import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LMPOP from './LMPOP';
import { parseArgs } from './generic-transformers';

describe('LMPOP', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LMPOP, 'key', 'LEFT'),
        ['LMPOP', '1', 'key', 'LEFT']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(LMPOP, 'key', 'LEFT', {
          COUNT: 2
        }),
        ['LMPOP', '1', 'key', 'LEFT', 'COUNT', '2']
      );
    });
  });

  testUtils.testAll('lmPop - null', async client => {
    assert.equal(
      await client.lmPop('key', 'RIGHT'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });

  testUtils.testAll('lmPop - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('key', 'element'),
      client.lmPop('key', 'RIGHT')
    ]);

    assert.deepEqual(reply, [
      'key',
      ['element']
    ]);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
