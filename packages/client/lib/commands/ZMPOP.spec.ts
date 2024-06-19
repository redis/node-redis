import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZMPOP from './ZMPOP';
import { parseArgs } from './generic-transformers';

describe('ZMPOP', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZMPOP, 'key', 'MIN'),
        ['ZMPOP', '1', 'key', 'MIN']
      );
    });

    it('with count', () => {
      assert.deepEqual(
        parseArgs(ZMPOP, 'key', 'MIN', {
          COUNT: 2
        }),
        ['ZMPOP', '1', 'key', 'MIN', 'COUNT', '2']
      );
    });
  });

  testUtils.testAll('zmPop - null', async client => {
    assert.equal(
      await client.zmPop('key', 'MIN'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zmPop - with members', async client => {
    const members = [{
      value: '1',
      score: 1
    }];

    const [, reply] = await Promise.all([
      client.zAdd('key', members),
      client.zmPop('key', 'MIN')
    ]);

    assert.deepEqual(reply, {
      key: 'key',
      members
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
