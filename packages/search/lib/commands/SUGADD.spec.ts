import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGADD from './SUGADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SUGADD', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SUGADD, 'key', 'string', 1),
        ['FT.SUGADD', 'key', 'string', '1']
      );
    });

    it('with INCR', () => {
      assert.deepEqual(
        parseArgs(SUGADD, 'key', 'string', 1, { INCR: true }),
        ['FT.SUGADD', 'key', 'string', '1', 'INCR']
      );
    });

    it('with PAYLOAD', () => {
      assert.deepEqual(
        parseArgs(SUGADD, 'key', 'string', 1, { PAYLOAD: 'payload' }),
        ['FT.SUGADD', 'key', 'string', '1', 'PAYLOAD', 'payload']
      );
    });
  });

  testUtils.testWithClient('client.ft.sugAdd', async client => {
    assert.equal(
      await client.ft.sugAdd('key', 'string', 1),
      1
    );
  }, GLOBAL.SERVERS.OPEN);
});
