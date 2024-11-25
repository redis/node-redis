import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import STRAPPEND from './STRAPPEND';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.STRAPPEND', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(STRAPPEND, 'key', 'append'),
        ['JSON.STRAPPEND', 'key', '"append"']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(STRAPPEND, 'key', 'append', {
          path: '$'
        }),
        ['JSON.STRAPPEND', 'key', '$', '"append"']
      );
    });
  });

  testUtils.testWithClient('client.json.strAppend', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', ''),
      client.json.strAppend('key', 'append')
    ]);

    assert.deepEqual(reply, 6);
  }, GLOBAL.SERVERS.OPEN);
});
