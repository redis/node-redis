import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import STRLEN from './STRLEN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.STRLEN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(STRLEN, 'key'),
        ['JSON.STRLEN', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(STRLEN, 'key', {
          path: '$'
        }),
        ['JSON.STRLEN', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.strLen', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', ''),
      client.json.strLen('key')
    ]);

    assert.deepEqual(reply, 0);
  }, GLOBAL.SERVERS.OPEN);
});
