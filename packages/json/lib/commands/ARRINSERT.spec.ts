import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRINSERT from './ARRINSERT';

describe('JSON.ARRINSERT', () => {
  describe('transformArguments', () => {
    it('single element', () => {
      assert.deepEqual(
        ARRINSERT.transformArguments('key', '$', 0, 'value'),
        ['JSON.ARRINSERT', 'key', '$', '0', '"value"']
      );
    });

    it('multiple elements', () => {
      assert.deepEqual(
        ARRINSERT.transformArguments('key', '$', 0, '1', '2'),
        ['JSON.ARRINSERT', 'key', '$', '0', '"1"', '"2"']
      );
    });
  });

  testUtils.testWithClient('client.json.arrInsert', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrInsert('key', '$', 0, 'value')
    ]);

    assert.deepEqual(reply, [1]);
  }, GLOBAL.SERVERS.OPEN);
});
