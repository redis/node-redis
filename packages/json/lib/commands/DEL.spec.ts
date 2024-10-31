import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.DEL', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(DEL, 'key'),
        ['JSON.DEL', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(DEL, 'key', {
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

