import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BLMOVE from './BLMOVE';
import { parseArgs } from './generic-transformers';

describe('BLMOVE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BLMOVE, 'source', 'destination', 'LEFT', 'RIGHT', 0),
      ['BLMOVE', 'source', 'destination', 'LEFT', 'RIGHT', '0']
    );
  });

  testUtils.testAll('blMove - null', async client => {
    assert.equal(
      await client.blMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('blMove - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('{tag}source', 'element'),
      client.blMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', BLOCKING_MIN_VALUE)
    ]);
    assert.equal(reply, 'element');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
