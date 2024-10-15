import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';

describe('JSON.DEL', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        DEL.transformArguments('key'),
        ['JSON.DEL', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        DEL.transformArguments('key', {
          path: '$.path'
        }),
        ['JSON.DEL', 'key', '$.path']
      );
    });
  });

  testUtils.testWithClient('client.json.del', async client => {
    assert.equal(
      await client.json.del('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});

