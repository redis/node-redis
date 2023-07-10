import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLEAR from './CLEAR';

describe('JSON.CLEAR', () => {
  describe('transformArguments', () => {
    it('key', () => {
      assert.deepEqual(
        CLEAR.transformArguments('key'),
        ['JSON.CLEAR', 'key']
      );
    });

    it('key, path', () => {
      assert.deepEqual(
        CLEAR.transformArguments('key', '$.path'),
        ['JSON.CLEAR', 'key', '$.path']
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
