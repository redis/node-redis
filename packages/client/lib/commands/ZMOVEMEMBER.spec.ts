import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZMOVEMEMBER from './ZMOVEMEMBER';
import { parseArgs } from './generic-transformers';

describe('ZMOVEMEMBER', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ZMOVEMEMBER, 'source', 'destination', 'member'),
        ['ZMOVEMEMBER', 'source', 'destination', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ZMOVEMEMBER, 'source', 'destination', ['1', '2']),
        ['ZMOVEMEMBER', 'source', 'destination', 'MEMBERS', '2', '1', '2']
      );
    });

    it('with condition', () => {
      assert.deepEqual(
        parseArgs(ZMOVEMEMBER, 'source', 'destination', ['1', '2'], { condition: 'NX' }),
        ['ZMOVEMEMBER', 'source', 'destination', 'NX', 'MEMBERS', '2', '1', '2']
      );
    });
  });

  testUtils.testAll('zMoveMember - null', async client => {
    assert.equal(
      await client.zMoveMember('{tag}source', '{tag}destination', 'member'),
      null
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testAll('zMoveMember - argument order, duplicates and missing members', async client => {
    await client.zAdd('{tag}source', [
      { value: 'a', score: 1 },
      { value: 'b', score: 2 }
    ]);

    assert.deepEqual(
      await client.zMoveMember('{tag}source', '{tag}destination', ['b', 'a', 'b', 'missing']),
      [{ value: 'b', score: 2 }, { value: 'a', score: 1 }]
    );
    assert.equal(await client.exists('{tag}source'), 0);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });

  testUtils.testAll('zMoveMember - NX', async client => {
    await Promise.all([
      client.zAdd('{tag}source', [
        { value: 'a', score: 1 },
        { value: 'b', score: 2 }
      ]),
      client.zAdd('{tag}destination', { value: 'a', score: 10 })
    ]);

    assert.deepEqual(
      await client.zMoveMember('{tag}source', '{tag}destination', ['a', 'b'], { condition: 'NX' }),
      [{ value: 'b', score: 2 }]
    );
    assert.deepEqual(
      await client.zRangeWithScores('{tag}source', 0, -1),
      [{ value: 'a', score: 1 }]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 12] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 12] }
  });
});
