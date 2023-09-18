import { strict as assert } from 'node:assert';
import EXPLAIN from './EXPLAIN';

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
});
