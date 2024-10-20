import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTADD from './DICTADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.DICTADD', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(DICTADD, 'dictionary', 'term'),
        ['FT.DICTADD', 'dictionary', 'term']
      );
    });

    it('Array', () => {
      assert.deepEqual(
        parseArgs(DICTADD, 'dictionary', ['1', '2']),
        ['FT.DICTADD', 'dictionary', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.ft.dictAdd', async client => {
    assert.equal(
      await client.ft.dictAdd('dictionary', 'term'),
      1
    );
  }, GLOBAL.SERVERS.OPEN);
});
