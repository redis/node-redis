import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZMOVE from './ZMOVE';
import { parseArgs } from './generic-transformers';

describe('ZMOVE', () => {
  describe('transformArguments', () => {
    it('MIN', () => {
      assert.deepEqual(
        parseArgs(ZMOVE, 'source', 'destination', 'MIN'),
        ['ZMOVE', 'source', 'destination', 'MIN']
      );
    });

    it('MAX with COUNT', () => {
      assert.deepEqual(
        parseArgs(ZMOVE, 'source', 'destination', 'MAX', { COUNT: 2 }),
        ['ZMOVE', 'source', 'destination', 'MAX', 'COUNT', '2']
      );
    });

    it('BYSCORE', () => {
      assert.deepEqual(
        parseArgs(ZMOVE, 'source', 'destination', { min: 1, max: '+inf' }),
        ['ZMOVE', 'source', 'destination', 'BYSCORE', '1', '+inf']
      );
    });

    it('BYSCORE with COUNT', () => {
      assert.deepEqual(
        parseArgs(ZMOVE, 'source', 'destination', { min: '(1', max: 2.5 }, { COUNT: 3 }),
        ['ZMOVE', 'source', 'destination', 'BYSCORE', '(1', '2.5', 'COUNT', '3']
      );
    });
  });

  testUtils.testAll('zMove - null', async client => {
    assert.equal(
      await client.zMove('{tag}source', '{tag}destination', 'MIN'),
      null
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testAll('zMove - MAX with COUNT', async client => {
    await client.zAdd('{tag}source', [
      { value: 'a', score: 1 },
      { value: 'b', score: 2 },
      { value: 'c', score: 3 }
    ]);

    assert.deepEqual(
      await client.zMove('{tag}source', '{tag}destination', 'MAX', { COUNT: 2 }),
      [{ value: 'c', score: 3 }, { value: 'b', score: 2 }]
    );
    assert.deepEqual(
      await client.zRangeWithScores('{tag}destination', 0, -1),
      [{ value: 'b', score: 2 }, { value: 'c', score: 3 }]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testAll('zMove - BYSCORE', async client => {
    await client.zAdd('{tag}source', [
      { value: 'a', score: 1 },
      { value: 'b', score: 2.5 },
      { value: 'c', score: 3 }
    ]);

    assert.deepEqual(
      await client.zMove('{tag}source', '{tag}destination', { min: '(1', max: '+inf' }),
      [{ value: 'b', score: 2.5 }, { value: 'c', score: 3 }]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testWithClient('zMove - RESP2', async client => {
    await client.zAdd('source', [
      { value: 'a', score: 1 },
      { value: 'b', score: 2.5 }
    ]);

    assert.deepEqual(
      await client.zMove('source', 'destination', 'MIN', { COUNT: 2 }),
      [{ value: 'a', score: 1 }, { value: 'b', score: 2.5 }]
    );
    assert.equal(
      await client.zMove('source', 'destination', 'MIN'),
      null
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 12],
    clientOptions: {
      RESP: 2
    }
  });
});
