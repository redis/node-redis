import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TAGVALS from './TAGVALS';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.TAGVALS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(TAGVALS, 'index', '@field'),
      ['FT.TAGVALS', 'index', '@field']
    );
  });

  testUtils.testWithClient('client.ft.tagVals', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TAG
      }),
      client.ft.tagVals('index', 'field')
    ]);

    assert.deepEqual(reply, []);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.tagVals with data', async client => {
    await client.ft.create('index', {
      tags: {
        type: SCHEMA_FIELD_TYPE.TAG,
        SEPARATOR: ','
      }
    });

    await Promise.all([
      client.hSet('doc:1', 'tags', 'alpha,beta'),
      client.hSet('doc:2', 'tags', 'beta,gamma'),
      client.hSet('doc:3', 'tags', 'alpha,delta')
    ]);

    const reply = await client.ft.tagVals('index', 'tags');

    // RESP2 returns an Array; RESP3 returns a Set
    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 4);
    const sorted = reply.slice().sort();
    assert.deepEqual(sorted, ['alpha', 'beta', 'delta', 'gamma']);
  }, GLOBAL.SERVERS.OPEN);
});
