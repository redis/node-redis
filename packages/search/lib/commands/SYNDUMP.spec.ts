import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SYNDUMP from './SYNDUMP';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SYNDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SYNDUMP, 'index'),
      ['FT.SYNDUMP', 'index']
    );
  });

  testUtils.testWithClient('client.ft.synDump', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.synDump('index')
    ]);

    assert.deepEqual(reply, {});
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.synDump with data', async client => {
    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });

    await client.ft.synUpdate('index', 'group1', ['hello', 'hi']);

    const reply = await client.ft.synDump('index');

    // RESP2 returns a flat array that transformReply converts to an object
    // Each key should map to an array of synonym group IDs (as Buffer[])
    assert.ok(reply !== null && typeof reply === 'object');
    assert.ok('hello' in reply);
    assert.ok('hi' in reply);
    assert.ok(Array.isArray(reply.hello));
    assert.ok(Array.isArray(reply.hi));
    assert.ok(reply.hello.length > 0);
    assert.ok(reply.hi.length > 0);
  }, GLOBAL.SERVERS.OPEN);

});
