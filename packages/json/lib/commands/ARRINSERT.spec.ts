import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRINSERT from './ARRINSERT';

describe('JSON.ARRINSERT', () => {
  describe('transformArguments', () => {
    it('single JSON', () => {
      assert.deepEqual(
        ARRINSERT.transformArguments('key', '$', 0, 'json'),
        ['JSON.ARRINSERT', 'key', '$', '0', '"json"']
      );
    });

    it('multiple JSONs', () => {
      assert.deepEqual(
        ARRINSERT.transformArguments('key', '$', 0, '1', '2'),
        ['JSON.ARRINSERT', 'key', '$', '0', '"1"', '"2"']
      );
    });
  });

  testUtils.testWithClient('client.json.arrInsert', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrInsert('key', '$', 0, 'json')
    ]);

    assert.deepEqual(reply, [1]);
  }, GLOBAL.SERVERS.OPEN);
});
