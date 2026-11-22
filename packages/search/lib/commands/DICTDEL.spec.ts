import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTDEL from './DICTDEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

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

    it('applies keyPrefix to the dictionary key without registering routing keys', () => {
      const parser = new BasicCommandParser('prefix:');
      DICTDEL.parseCommand(parser, 'dictionary', 'term');
      assert.deepEqual(parser.redisArgs, ['FT.DICTDEL', 'prefix:dictionary', 'term']);
      assert.deepEqual(parser.keys, []);
      assert.equal(parser.firstKey, undefined);
    });
  });

  testUtils.testWithClient('client.ft.dictDel', async client => {
    assert.equal(
      await client.ft.dictDel('dictionary', 'term'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.dictDel with keyPrefix', async client => {
    await client.ft.dictAdd('dictionary', 'term');
    assert.equal(await client.ft.dictDel('dictionary', 'term'), 1);
    assert.deepEqual(await client.ft.dictDump('dictionary'), []);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      keyPrefix: 'prefix:'
    }
  });
});
