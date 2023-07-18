import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRAPPEND from './ARRAPPEND';

describe('ARRAPPEND', () => {
  describe('transformArguments', () => {
    it('single JSON', () => {
      assert.deepEqual(
        ARRAPPEND.transformArguments('key', '$', 1),
        ['JSON.ARRAPPEND', 'key', '$', '1']
      );
    });

    it('multiple JSONs', () => {
      assert.deepEqual(
        ARRAPPEND.transformArguments('key', '$', 1, 2),
        ['JSON.ARRAPPEND', 'key', '$', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.json.arrAppend', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrAppend('key', '$', 1)
    ]);

    assert.deepEqual(reply, [1]);
  }, GLOBAL.SERVERS.OPEN);
});
