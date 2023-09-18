import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LIST from './LIST';

describe('GRAPH.LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LIST.transformArguments(),
      ['GRAPH.LIST']
    );
  });

  testUtils.testWithClient('client.graph.list', async client => {
    assert.deepEqual(
      await client.graph.list(),
      []
    );
  }, GLOBAL.SERVERS.OPEN);
});
