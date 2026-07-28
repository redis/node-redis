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
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.aliasList('index')
    ]);

    assert.deepEqual(reply, []);
  }, { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 10] });

  testUtils.testWithClient('client.ft.aliasList with aliases', async client => {
    const [, , , reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.aliasAdd('alias1', 'index'),
      client.ft.aliasAdd('alias2', 'index'),
      client.ft.aliasList('index')
    ]);

    // ordering is not part of the contract
    assert.deepEqual(
      [...reply].sort(),
      ['alias1', 'alias2']
    );
  }, { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 10] });

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
  }, { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 10] });
});
