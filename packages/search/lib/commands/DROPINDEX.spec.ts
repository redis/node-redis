import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DROPINDEX from './DROPINDEX';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.DROPINDEX', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(DROPINDEX, 'index'),
        ['FT.DROPINDEX', 'index']
      );
    });

    it('with DD', () => {
      assert.deepEqual(
        parseArgs(DROPINDEX, 'index', { DD: true }),
        ['FT.DROPINDEX', 'index', 'DD']
      );
    });
  });

  testUtils.testWithClient('client.ft.dropIndex', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.dropIndex('index')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
