import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTDUMP from './DICTDUMP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

describe('FT.DICTDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DICTDUMP, 'dictionary'),
      ['FT.DICTDUMP', 'dictionary']
    );
  });

  it('applies keyPrefix to the dictionary key without registering routing keys', () => {
    const parser = new BasicCommandParser('prefix:');
    DICTDUMP.parseCommand(parser, 'dictionary');
    assert.deepEqual(parser.redisArgs, ['FT.DICTDUMP', 'prefix:dictionary']);
    assert.deepEqual(parser.keys, []);
    assert.equal(parser.firstKey, undefined);
  });

  testUtils.testWithClient('client.ft.dictDump', async client => {
    const [, reply] = await Promise.all([
      client.ft.dictAdd('dictionary', 'string'),
      client.ft.dictDump('dictionary')
    ]);

    assert.deepEqual(reply, ['string']);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.dictDump with keyPrefix', async client => {
    await client.ft.dictAdd('dictionary', 'string');
    assert.deepEqual(await client.ft.dictDump('dictionary'), ['string']);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      keyPrefix: 'prefix:'
    }
  });
});
