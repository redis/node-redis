import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';

describe('DEL', () => {
  describe('transformArguments', () => {
    it('key', () => {
      assert.deepEqual(
        DEL.transformArguments('key'),
        ['JSON.DEL', 'key']
      );
    });

    it('key, path', () => {
      assert.deepEqual(
        DEL.transformArguments('key', '$.path'),
        ['JSON.DEL', 'key', '$.path']
      );
    });
  });

  testUtils.testWithClient('client.json.del', async client => {
    assert.deepEqual(
      await client.json.del('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});

