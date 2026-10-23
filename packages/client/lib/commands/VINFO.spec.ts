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

  it('transforms a RESP2 reply', () => {
    assert.deepEqual(
      VINFO.transformReply[2](['quant-type', 'f32', 'vector-dim', 3]),
      { 'quant-type': 'f32', 'vector-dim': 3 }
    );
  });

  it('returns null for a nil RESP2 reply', () => {
    assert.equal(
      VINFO.transformReply[2](null),
      null
    );
  });

  it('returns null for a nil RESP3 reply', () => {
    const transform = VINFO.transformReply[3] as unknown as ((reply: unknown) => unknown) | undefined;
    assert.equal(
      typeof transform === 'function' ? transform(null) : null,
      null
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
