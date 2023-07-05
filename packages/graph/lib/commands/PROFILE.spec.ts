import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import PROFILE from './PROFILE';

describe('PROFILE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PROFILE.transformArguments('key', 'RETURN 0'),
      ['GRAPH.PROFILE', 'key', 'RETURN 0']
    );
  });

  testUtils.testWithClient('client.graph.profile', async client => {
    const reply = await client.graph.profile('key', 'RETURN 0');
    assert.ok(Array.isArray(reply));
    assert.ok(!reply.find(x => typeof x !== 'string'));
  }, GLOBAL.SERVERS.OPEN);
});
