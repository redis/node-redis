import { strict as assert } from 'node:assert';
import EXPLAIN from './EXPLAIN';
import testUtils, { GLOBAL } from '../test-utils';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('EXPLAIN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        EXPLAIN.transformArguments('index', '*'),
        ['FT.EXPLAIN', 'index', '*']
      );
    });

    it('with PARAMS', () => {
      assert.deepEqual(
        EXPLAIN.transformArguments('index', '*', {
          PARAMS: {
            param: 'value'
          }
        }),
        ['FT.EXPLAIN', 'index', '*', 'PARAMS', '2', 'param', 'value']
      );
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        EXPLAIN.transformArguments('index', '*', {
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

    assert.equal('<WILDCARD>}\n', reply);
  }, GLOBAL.SERVERS.OPEN);
});
