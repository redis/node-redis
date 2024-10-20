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
});
