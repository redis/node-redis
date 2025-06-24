import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VINFO from './VINFO';
import { BasicCommandParser } from '../client/parser';

describe('VINFO', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VINFO.parseCommand(parser, 'key');
    assert.deepEqual(
      parser.redisArgs,
      ['VINFO', 'key']
    );
  });

  testUtils.testAll('vInfo', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const result = await client.vInfo('key');
    assert.ok(typeof result === 'object' && result !== null);

    assert.equal(result['vector-dim'], 3);
    assert.equal(result['size'], 1);
    assert.ok('quant-type' in result);
    assert.ok('hnsw-m' in result);
    assert.ok('projection-input-dim' in result);
    assert.ok('max-level' in result);
    assert.ok('attributes-count' in result);
    assert.ok('vset-uid' in result);
    assert.ok('hnsw-max-node-uid' in result);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vInfo with RESP3', async client => {
    await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'resp3-element');

    const result = await client.vInfo('resp3-key');
    assert.ok(typeof result === 'object' && result !== null);

    assert.equal(result['vector-dim'], 3);
    assert.equal(result['size'], 1);
    assert.ok('quant-type' in result);
    assert.ok('hnsw-m' in result);
    assert.ok('projection-input-dim' in result);
    assert.ok('max-level' in result);
    assert.ok('attributes-count' in result);
    assert.ok('vset-uid' in result);
    assert.ok('hnsw-max-node-uid' in result);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
