import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLEAR from './CLEAR';

describe('JSON.CLEAR', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        CLEAR.transformArguments('key'),
        ['JSON.CLEAR', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        CLEAR.transformArguments('key', {
          path: '$'
        }),
        ['JSON.CLEAR', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.clear', async client => {
    assert.deepEqual(
      await client.json.clear('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
