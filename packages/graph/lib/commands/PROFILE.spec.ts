import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PROFILE from './PROFILE';

describe('GRAPH.PROFILE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PROFILE.transformArguments('key', 'RETURN 0'),
      ['GRAPH.PROFILE', 'key', 'RETURN 0']
    );
  });

  testUtils.testWithClient('client.graph.profile', async client => {
    const reply = await client.graph.profile('key', 'RETURN 0');
    assert.ok(Array.isArray(reply));
    for (const item of reply) {
      assert.equal(typeof item, 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
