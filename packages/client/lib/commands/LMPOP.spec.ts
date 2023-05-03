import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import LMPOP from './LMPOP';

describe('LMPOP', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        LMPOP.transformArguments('key', 'LEFT'),
        ['LMPOP', '1', 'key', 'LEFT']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        LMPOP.transformArguments('key', 'LEFT', {
          COUNT: 2
        }),
        ['LMPOP', '1', 'key', 'LEFT', 'COUNT', '2']
      );
    });
  });

  testUtils.testAll('lmPop', async client => {
    assert.deepEqual(
      await client.lmPop('key', 'RIGHT'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
