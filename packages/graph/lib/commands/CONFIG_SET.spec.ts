import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_SET from './CONFIG_SET';

describe('GRAPH.CONFIG SET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_SET.transformArguments('TIMEOUT', 0),
      ['GRAPH.CONFIG', 'SET', 'TIMEOUT', '0']
    );
  });

  testUtils.testWithClient('client.graph.configSet', async client => {
    assert.equal(
      await client.graph.configSet('TIMEOUT', 0),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
