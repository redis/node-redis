import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import QUERY from './QUERY';

describe('QUERY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      QUERY.transformArguments('key', 'query'),
      ['GRAPH.QUERY', 'key', 'query']
    );
  });

  testUtils.testWithClient('client.graph.query', async client => {
    const { data } = await client.graph.query('key', 'RETURN 0');
    assert.deepEqual(data, [[0]]);
  }, GLOBAL.SERVERS.OPEN);
});
