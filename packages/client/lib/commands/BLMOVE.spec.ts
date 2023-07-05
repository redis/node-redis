import { strict as assert } from 'assert';
import testUtils, { GLOBAL, MIN_BLOCKING_TIME } from '../test-utils';
import BLMOVE from './BLMOVE';

describe('BLMOVE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      BLMOVE.transformArguments('source', 'destination', 'LEFT', 'RIGHT', 0),
      ['BLMOVE', 'source', 'destination', 'LEFT', 'RIGHT', '0']
    );
  });

  testUtils.testAll('blMove - null', async client => {
    assert.equal(
      await client.blMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', MIN_BLOCKING_TIME),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('blMove - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('{tag}source', 'element'),
      client.blMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', MIN_BLOCKING_TIME)
    ]);
    assert.equal(reply, 'element');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
