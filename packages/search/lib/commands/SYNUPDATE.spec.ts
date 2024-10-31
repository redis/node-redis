import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SYNUPDATE from './SYNUPDATE';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SYNUPDATE', () => {
  describe('transformArguments', () => {
    it('single term', () => {
      assert.deepEqual(
        parseArgs(SYNUPDATE, 'index', 'groupId', 'term'),
        ['FT.SYNUPDATE', 'index', 'groupId', 'term']
      );
    });

    it('multiple terms', () => {
      assert.deepEqual(
        parseArgs(SYNUPDATE, 'index', 'groupId', ['1', '2']),
        ['FT.SYNUPDATE', 'index', 'groupId', '1', '2']
      );
    });

    it('with SKIPINITIALSCAN', () => {
      assert.deepEqual(
        parseArgs(SYNUPDATE, 'index', 'groupId', 'term', {
          SKIPINITIALSCAN: true
        }),
        ['FT.SYNUPDATE', 'index', 'groupId', 'SKIPINITIALSCAN', 'term']
      );
    });
  });

  testUtils.testWithClient('client.ft.synUpdate', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.synUpdate('index', 'groupId', 'term')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
