import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import FORGET from './FORGET';

describe('FORGET', () => {
  describe('transformArguments', () => {
    it('key', () => {
      assert.deepEqual(
        FORGET.transformArguments('key'),
        ['JSON.FORGET', 'key']
      );
    });

    it('key, path', () => {
      assert.deepEqual(
        FORGET.transformArguments('key', '$.path'),
        ['JSON.FORGET', 'key', '$.path']
      );
    });
  });

  testUtils.testWithClient('client.json.forget', async client => {
    assert.deepEqual(
      await client.json.forget('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
