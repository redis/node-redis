import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTDUMP from './DICTDUMP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.DICTDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DICTDUMP, 'dictionary'),
      ['FT.DICTDUMP', 'dictionary']
    );
  });

  testUtils.testWithClient('client.ft.dictDump', async client => {
    const [, reply] = await Promise.all([
      client.ft.dictAdd('dictionary', 'string'),
      client.ft.dictDump('dictionary')
    ]);

    assert.deepEqual(reply, ['string']);
  }, GLOBAL.SERVERS.OPEN);
});
