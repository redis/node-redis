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
    assert.equal(Array.isArray(result), false);
    assert.equal(result instanceof Map, false);

    const expectedKeys = [
      'quant-type',
      'hnsw-m',
      'vector-dim',
      'projection-input-dim',
      'size',
      'max-level',
      'attributes-count',
      'vset-uid',
      'hnsw-max-node-uid'
    ];

    assert.deepEqual(
      Object.keys(result).sort(),
      expectedKeys.sort()
    );

    assert.equal(result['vector-dim'], 3);
    assert.equal(result['size'], 1);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });
});
