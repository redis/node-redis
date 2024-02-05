import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALIASDEL from './ALIASDEL';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('FT.ALIASDEL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ALIASDEL.transformArguments('alias'),
      ['FT.ALIASDEL', 'alias']
    );
  });

  testUtils.testWithClient('client.ft.aliasAdd', async client => {
    const [, , reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.aliasAdd('alias', 'index'),
      client.ft.aliasDel('alias')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
