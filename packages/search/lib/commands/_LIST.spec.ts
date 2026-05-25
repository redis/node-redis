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

  testUtils.testWithClient('client.ft._list with indexes', async client => {
    const indexName = 'test-index';
    await client.ft.create(indexName, {
      field: {
        type: 'TEXT'
      }
    });

    const reply = await client.ft._list();

    // Assert RESP2 structure: Array of strings
    assert.ok(Array.isArray(reply), 'reply should be an array');
    assert.ok(reply.includes(indexName), `reply should include ${indexName}`);
    assert.equal(typeof reply[0], 'string', 'array elements should be strings');
  }, GLOBAL.SERVERS.OPEN);
});
