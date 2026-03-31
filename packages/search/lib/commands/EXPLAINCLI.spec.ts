import { strict as assert } from 'node:assert';
import EXPLAINCLI from './EXPLAINCLI';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import testUtils, { GLOBAL } from '../test-utils';
import { SCHEMA_FIELD_TYPE } from './CREATE';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('EXPLAINCLI', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXPLAINCLI, 'index', '*'),
      ['FT.EXPLAINCLI', 'index', '*', 'DIALECT', DEFAULT_DIALECT]
    );
  });

  it('with dialect', () => {
    assert.deepEqual(
      parseArgs(EXPLAINCLI, 'index', '*', {DIALECT: 1}),
      ['FT.EXPLAINCLI', 'index', '*', 'DIALECT', '1']
    );
  });

  testUtils.testWithClient('client.ft.explainCli', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.explainCli('index', '*')
    ]);

    assert.ok(Array.isArray(reply));
    assert.ok(reply.includes('<WILDCARD>'));
  }, GLOBAL.SERVERS.OPEN);
});
