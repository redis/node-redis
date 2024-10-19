import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import _LIST from './_LIST';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('_LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(_LIST),
      ['FT._LIST']
    );
  });

  testUtils.testWithClient('client.ft._list', async client => {
    assert.deepEqual(
      await client.ft._list(),
      []
    );
  }, GLOBAL.SERVERS.OPEN);
});
