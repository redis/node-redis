import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VEMB from './VEMB';
import { parseArgs } from './generic-transformers';

describe('VEMB', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VEMB, 'key', 'element'),
      ['VEMB', 'key', 'element']
    );
  });

  testUtils.testAll('vEmb', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const result = await client.vEmb('key', 'element');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 3);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('vEmb with RESP3', async client => {
    // Test retrieving embeddings with RESP3
    const originalVector = [1.5, 2.5, 3.5, 4.5];
    await client.vAdd('resp3-key', originalVector, 'resp3-element');

    const embedding = await client.vEmb('resp3-key', 'resp3-element');
    assert.ok(Array.isArray(embedding));
    assert.equal(embedding.length, 4);

    // Verify that all values are numbers (RESP3 should preserve numeric types)
    embedding.forEach(value => {
      assert.equal(typeof value, 'number');
    });

    // Test with quantized vector to ensure RESP3 handles different precision
    await client.vAdd('resp3-key', [10.0, 20.0, 30.0, 40.0], 'quantized-elem', { QUANT: 'Q8' });
    const quantizedEmbedding = await client.vEmb('resp3-key', 'quantized-elem');
    assert.ok(Array.isArray(quantizedEmbedding));
    assert.equal(quantizedEmbedding.length, 4);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
