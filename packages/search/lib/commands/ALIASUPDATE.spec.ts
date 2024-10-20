import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALIASUPDATE from './ALIASUPDATE';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.ALIASUPDATE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ALIASUPDATE, 'alias', 'index'),
      ['FT.ALIASUPDATE', 'alias', 'index']
    );
  });

  testUtils.testWithClient('client.ft.aliasUpdate', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.aliasUpdate('alias', 'index')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
