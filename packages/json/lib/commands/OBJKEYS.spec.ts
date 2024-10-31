import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJKEYS from './OBJKEYS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.OBJKEYS', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(OBJKEYS, 'key'),
        ['JSON.OBJKEYS', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(OBJKEYS, 'key', {
          path: '$'
        }),
        ['JSON.OBJKEYS', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.objKeys', async client => {
    assert.equal(
      await client.json.objKeys('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
