import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import QUERY from './QUERY';

describe('GRAPH.QUERY', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        QUERY.transformArguments('key', 'query'),
        ['GRAPH.QUERY', 'key', 'query']
      );
    });
  
    describe('params', () => {
      it('all types', () => {
        assert.deepEqual(
          QUERY.transformArguments('key', 'query', {
            params: {
              null: null,
              string: '"\\',
              number: 0,
              boolean: false,
              array: [0],
              object: {a: 0}
            }
          }),
          ['GRAPH.QUERY', 'key', 'CYPHER null=null string="\\"\\\\" number=0 boolean=false array=[0] object={a:0} query']
        );
      });
  
      it('TypeError', () => {
        assert.throws(() => {
          QUERY.transformArguments('key', 'query', {
            params: {
              a: Symbol()
            }
          })
        }, TypeError);
      });
    });
  
    it('TIMEOUT', () => {
      assert.deepEqual(
        QUERY.transformArguments('key', 'query', {
          TIMEOUT: 1
        }),
        ['GRAPH.QUERY', 'key', 'query', 'TIMEOUT', '1']
      );
    });
  
    it('compact', () => {
      assert.deepEqual(
        QUERY.transformArguments('key', 'query', undefined, true),
        ['GRAPH.QUERY', 'key', 'query', '--compact']
      );
    });
  });
  
  testUtils.testWithClient('client.graph.query', async client => {
    const { data } = await client.graph.query('key', 'RETURN 0');
    assert.deepEqual(data, [[0]]);
  }, GLOBAL.SERVERS.OPEN);
});
