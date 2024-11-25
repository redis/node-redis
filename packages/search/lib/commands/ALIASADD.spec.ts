import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALIASADD from './ALIASADD';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.ALIASADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ALIASADD, 'alias', 'index'),
      ['FT.ALIASADD', 'alias', 'index']
    );
  });

  testUtils.testWithClient('client.ft.aliasAdd', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.aliasAdd('alias', 'index')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
