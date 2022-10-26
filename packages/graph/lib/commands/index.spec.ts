import { strict as assert } from 'assert';
import { pushQueryArguments } from '.';

describe('pushQueryArguments', () => {
  it('simple', () => {
    assert.deepEqual(
      pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query'),
      ['GRAPH.QUERY', 'graph', 'query']
    );
  });

  describe('params', () => {
    it('all types', () => {
      assert.deepEqual(
        pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query', {
          params: {
            null: null,
            string: '"\\',
            number: 0,
            boolean: false,
            array: [0],
            object: {a: 0}
          }
        }),
        ['GRAPH.QUERY', 'graph', 'CYPHER null=null string="\\"\\\\" number=0 boolean=false array=[0] object={a:0} query']
      );
    });

    it('TypeError', () => {
      assert.throws(() => {
        pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query', {
          params: {
            a: undefined as any
          }
        })
      }, TypeError);
    });
  });

  it('TIMEOUT backward compatible', () => {
    assert.deepEqual(
      pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query', 1),
      ['GRAPH.QUERY', 'graph', 'query', 'TIMEOUT', '1']
    );
  });

  it('TIMEOUT', () => {
    assert.deepEqual(
      pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query', {
        TIMEOUT: 1
      }),
      ['GRAPH.QUERY', 'graph', 'query', 'TIMEOUT', '1']
    );
  });

  it('compact', () => {
    assert.deepEqual(
      pushQueryArguments(['GRAPH.QUERY'], 'graph', 'query', undefined, true),
      ['GRAPH.QUERY', 'graph', 'query', '--compact']
    );
  });
});
