import { strict as assert } from 'node:assert';
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
    const [, reply] = await Promise.all([
      client.json.set('key', '$', null),
      client.json.clear('key')
    ]);

    assert.equal(reply, 0);
  }, GLOBAL.SERVERS.OPEN);
});
