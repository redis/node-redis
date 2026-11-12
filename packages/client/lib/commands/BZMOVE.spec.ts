import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BZMOVE from './BZMOVE';
import { parseArgs } from './generic-transformers';

describe('BZMOVE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BZMOVE, 'source', 'destination', 'MIN', 0),
        ['BZMOVE', 'source', 'destination', 'MIN', '0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(BZMOVE, 'source', 'destination', 'MAX', 0.5, { COUNT: 2 }),
        ['BZMOVE', 'source', 'destination', 'MAX', '0.5', 'COUNT', '2']
      );
    });
  });

  testUtils.testAll('bzMove - null', async client => {
    assert.equal(
      await client.bzMove('{tag}source', '{tag}destination', 'MIN', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testAll('bzMove - with member', async client => {
    const member = { value: 'a', score: 1 },
      [, reply] = await Promise.all([
        client.zAdd('{tag}source', member),
        client.bzMove('{tag}source', '{tag}destination', 'MIN', BLOCKING_MIN_VALUE, { COUNT: 5 })
      ]);

    assert.deepEqual(reply, [member]);
    assert.deepEqual(
      await client.zRangeWithScores('{tag}destination', 0, -1),
      [member]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });
});
