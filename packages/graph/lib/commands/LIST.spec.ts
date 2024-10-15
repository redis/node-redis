import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LIST from './LIST';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('GRAPH.LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LIST),
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
