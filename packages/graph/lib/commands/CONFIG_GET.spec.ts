import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_GET from './CONFIG_GET';

describe('GRAPH.CONFIG GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_GET.transformArguments('TIMEOUT'),
      ['GRAPH.CONFIG', 'GET', 'TIMEOUT']
    );
  });

  testUtils.testWithClient('client.graph.configGet', async client => {
    assert.deepEqual(
      await client.graph.configGet('TIMEOUT'),
      [
        'TIMEOUT',
        0
      ]
    );
  }, GLOBAL.SERVERS.OPEN);
});
