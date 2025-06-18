import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITOP, { BitOperations } from './BITOP';
import { parseArgs } from './generic-transformers';

describe('BITOP', () => {
  describe('transformArguments', () => {
    it('single key', () => {
      assert.deepEqual(
        parseArgs(BITOP, 'AND', 'destKey', 'key'),
        ['BITOP', 'AND', 'destKey', 'key']
      );
    });

    it('multiple keys', () => {
      assert.deepEqual(
        parseArgs(BITOP, 'AND', 'destKey', ['1', '2']),
        ['BITOP', 'AND', 'destKey', '1', '2']
      );
    });
  });

  for (const op of ['AND', 'OR', 'XOR'] as BitOperations[]) {
    testUtils.testAll(`bitOp ${op} with non-existing keys`, async client => {
      assert.equal(
        await client.bitOp(op, '{tag}destKey', ['{tag}key1', '{tag}key2']),
        0
      );
      }, {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN
    });

    testUtils.testAll(`bitOp ${op} with existing keys`, async client => {
        await client.set('{tag}key1', 'value1');
        await client.set('{tag}key2', 'value2');

        assert.equal(
          await client.bitOp(op, '{tag}destKey', ['{tag}key1', '{tag}key2']),
          6
        );
      }, {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN
    });
  }
  
  // NOT operation requires only one key
  testUtils.testAll('bitOp NOT with non-existing keys', async client => {
    assert.equal(
      await client.bitOp('NOT', '{tag}destKey', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('bitOp NOT with existing keys', async client => {
    await client.set('{tag}key', 'value');

    assert.equal(
      await client.bitOp('NOT', '{tag}destKey', '{tag}key'),
      5
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // newer operations supported since Redis 8.2
  for (const op of ['DIFF', 'DIFF1', 'ANDOR', 'ONE'] as BitOperations[]) {
    testUtils.testAll(`bitOp ${op} with non-existing keys`, async client => {
      assert.equal(
        await client.bitOp(op, '{tag}destKey', ['{tag}key1', '{tag}key2']),
        0
      );
      }, {
        client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
        cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    });

    testUtils.testAll(`bitOp ${op} with existing keys`, async client => {
        await client.set('{tag}key1', 'value1');
        await client.set('{tag}key2', 'value2');

        assert.equal(
          await client.bitOp(op, '{tag}destKey', ['{tag}key1', '{tag}key2']),
          6
        );
      }, {
        client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
        cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    });
  }
});
