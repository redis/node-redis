import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTDEL from './DICTDEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.DICTDEL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(DICTDEL, 'dictionary', 'term'),
        ['FT.DICTDEL', 'dictionary', 'term']
      );
    });

    it('Array', () => {
      assert.deepEqual(
        parseArgs(DICTDEL, 'dictionary', ['1', '2']),
        ['FT.DICTDEL', 'dictionary', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.ft.dictDel', async client => {
    assert.equal(
      await client.ft.dictDel('dictionary', 'term'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
