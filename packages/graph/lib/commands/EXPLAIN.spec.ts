import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXPLAIN from './EXPLAIN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('GRAPH.EXPLAIN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXPLAIN, 'key', 'RETURN 0'),
      ['GRAPH.EXPLAIN', 'key', 'RETURN 0']
    );
  });

  testUtils.testWithClient('client.graph.explain', async client => {
    const [, reply] = await Promise.all([
      client.graph.query('key', 'RETURN 0'), // make sure to create a graph first
      client.graph.explain('key', 'RETURN 0')
    ]);
    assert.ok(Array.isArray(reply));
    for (const item of reply) {
      assert.equal(typeof item, 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
