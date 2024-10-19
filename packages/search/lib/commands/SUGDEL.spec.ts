import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGDEL from './SUGDEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SUGDEL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SUGDEL, 'key', 'string'),
      ['FT.SUGDEL', 'key', 'string']
    );
  });

  testUtils.testWithClient('client.ft.sugDel', async client => {
    assert.equal(
      await client.ft.sugDel('key', 'string'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
