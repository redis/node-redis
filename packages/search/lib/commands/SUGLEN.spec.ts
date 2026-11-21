import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGLEN from './SUGLEN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

describe('FT.SUGLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SUGLEN, 'key'),
      ['FT.SUGLEN', 'key']
    );
  });

  it('applies keyPrefix to the key', () => {
    const parser = new BasicCommandParser('prefix:');
    SUGLEN.parseCommand(parser, 'key');
    assert.deepEqual(parser.redisArgs, ['FT.SUGLEN', 'prefix:key']);
    assert.deepEqual(parser.keys, ['prefix:key']);
  });

  testUtils.testWithClient('client.ft.sugLen', async client => {
    assert.equal(
      await client.ft.sugLen('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.sugLen with keyPrefix', async client => {
    await client.ft.sugAdd('key', 'hello', 1);

    assert.equal(await client.ft.sugLen('key'), 1);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      keyPrefix: 'prefix:'
    }
  });
});
