import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTADD from './DICTADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

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

    it('applies keyPrefix to the dictionary key without registering routing keys', () => {
      const parser = new BasicCommandParser('prefix:');
      DICTADD.parseCommand(parser, 'dictionary', 'term');
      assert.deepEqual(parser.redisArgs, ['FT.DICTADD', 'prefix:dictionary', 'term']);
      assert.deepEqual(parser.keys, []);
      assert.equal(parser.firstKey, undefined);
    });
  });

  testUtils.testWithClient('client.ft.dictAdd', async client => {
    assert.equal(
      await client.ft.dictAdd('dictionary', 'term'),
      1
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.dictAdd with keyPrefix', async client => {
    assert.equal(await client.ft.dictAdd('dictionary', 'term'), 1);
    assert.deepEqual(await client.ft.dictDump('dictionary'), ['term']);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      keyPrefix: 'prefix:'
    }
  });
});
