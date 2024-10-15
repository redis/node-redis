import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRAPPEND from './ARRAPPEND';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.ARRAPPEND', () => {
  describe('transformArguments', () => {
    it('single element', () => {
      assert.deepEqual(
        parseArgs(ARRAPPEND, 'key', '$', 'value'),
        ['JSON.ARRAPPEND', 'key', '$', '"value"']
      );
    });

    it('multiple elements', () => {
      assert.deepEqual(
        parseArgs(ARRAPPEND, 'key', '$', 1, 2),
        ['JSON.ARRAPPEND', 'key', '$', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.json.arrAppend', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrAppend('key', '$', 'value')
    ]);

    assert.deepEqual(reply, [1]);
  }, GLOBAL.SERVERS.OPEN);
});
