import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FORGET from './FORGET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.FORGET', () => {
  describe('transformArguments', () => {
    it('key', () => {
      assert.deepEqual(
        parseArgs(FORGET, 'key'),
        ['JSON.FORGET', 'key']
      );
    });

    it('key, path', () => {
      assert.deepEqual(
        parseArgs(FORGET, 'key', {
          path: '$.path'
        }),
        ['JSON.FORGET', 'key', '$.path']
      );
    });
  });

  testUtils.testWithClient('client.json.forget', async client => {
    assert.equal(
      await client.json.forget('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
