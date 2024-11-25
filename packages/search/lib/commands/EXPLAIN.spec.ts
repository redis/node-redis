import { strict as assert } from 'node:assert';
import EXPLAIN from './EXPLAIN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import testUtils, { GLOBAL } from '../test-utils';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('EXPLAIN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(EXPLAIN, 'index', '*'),
        ['FT.EXPLAIN', 'index', '*']
      );
    });

    it('with PARAMS', () => {
      assert.deepEqual(
        parseArgs(EXPLAIN, 'index', '*', {
          PARAMS: {
            param: 'value'
          }
        }),
        ['FT.EXPLAIN', 'index', '*', 'PARAMS', '2', 'param', 'value']
      );
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        parseArgs(EXPLAIN, 'index', '*', {
          DIALECT: 1
        }),
        ['FT.EXPLAIN', 'index', '*', 'DIALECT', '1']
      );
    });
  });

  testUtils.testWithClient('client.ft.dropIndex', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.explain('index', '*')
    ]);

    assert.equal(reply, '<WILDCARD>\n');
  }, GLOBAL.SERVERS.OPEN);
});
