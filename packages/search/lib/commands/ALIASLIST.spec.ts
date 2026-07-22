import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALIASLIST from './ALIASLIST';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.ALIASLIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ALIASLIST, 'index'),
      ['FT.ALIASLIST', 'index']
    );
  });

  testUtils.testWithClient('client.ft.aliasList on index without aliases', async client => {
    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });

    assert.deepEqual(
      await client.ft.aliasList('index'),
      []
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.aliasList with aliases', async client => {
    await client.ft.create('index', {
      field: SCHEMA_FIELD_TYPE.TEXT
    });
    await client.ft.aliasAdd('alias1', 'index');
    await client.ft.aliasAdd('alias2', 'index');

    const reply = await client.ft.aliasList('index');
    // ordering is not part of the contract
    assert.deepEqual(
      [...reply].sort(),
      ['alias1', 'alias2']
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.aliasList on missing index rejects with index-not-found', async client => {
    await assert.rejects(
      client.ft.aliasList('nonexistent'),
      err => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.startsWith('SEARCH_INDEX_NOT_FOUND'),
          `expected SEARCH_INDEX_NOT_FOUND prefix, got: ${err.message}`
        );
        return true;
      }
    );
  }, GLOBAL.SERVERS.OPEN);
});
