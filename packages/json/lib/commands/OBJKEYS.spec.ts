import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJKEYS from './OBJKEYS';

describe('JSON.OBJKEYS', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        OBJKEYS.transformArguments('key'),
        ['JSON.OBJKEYS', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        OBJKEYS.transformArguments('key', {
          path: '$'
        }),
        ['JSON.OBJKEYS', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.objKeys', async client => {
    assert.equal(
      await client.json.objKeys('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
