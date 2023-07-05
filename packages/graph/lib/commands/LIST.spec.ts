import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import LIST from './LIST';

describe('LIST', () => {
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
