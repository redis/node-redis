import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VEMB_RAW from './VEMB_RAW';
import { BasicCommandParser } from '../client/parser';

describe('VEMB_RAW', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VEMB_RAW.parseCommand(parser, 'key', 'element');
    assert.deepEqual(
      parser.redisArgs,
      ['VEMB', 'key', 'element', 'RAW']
    );
  });

  testUtils.testAll('vEmbRaw', async client => {
    await client.vAdd('key1', [1.0, 2.0, 3.0], 'element');
    const result1 = await client.vEmbRaw('key1', 'element');
    assert.equal(result1.quantization, 'int8');
    assert.ok(result1.quantizationRange !== undefined);

    await client.vAdd('key2', [1.0, 2.0, 3.0], 'element', { QUANT: 'Q8' });
    const result2 = await client.vEmbRaw('key2', 'element');
    assert.equal(result2.quantization, 'int8');
    assert.ok(result2.quantizationRange !== undefined);

    await client.vAdd('key3', [1.0, 2.0, 3.0], 'element', { QUANT: 'NOQUANT' });
    const result3 = await client.vEmbRaw('key3', 'element');
    assert.equal(result3.quantization, 'f32');
    assert.equal(result3.quantizationRange, undefined);

    await client.vAdd('key4', [1.0, 2.0, 3.0], 'element', { QUANT: 'BIN' });
    const result4 = await client.vEmbRaw('key4', 'element');
    assert.equal(result4.quantization, 'bin');
    assert.equal(result4.quantizationRange, undefined);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vEmbRaw with RESP3', async client => {
    await client.vAdd('key1', [1.0, 2.0, 3.0], 'element');
    const result1 = await client.vEmbRaw('key1', 'element');
    assert.equal(result1.quantization, 'int8');
    assert.ok(result1.quantizationRange !== undefined);

    await client.vAdd('key2', [1.0, 2.0, 3.0], 'element', { QUANT: 'Q8' });
    const result2 = await client.vEmbRaw('key2', 'element');
    assert.equal(result2.quantization, 'int8');
    assert.ok(result2.quantizationRange !== undefined);

    await client.vAdd('key3', [1.0, 2.0, 3.0], 'element', { QUANT: 'NOQUANT' });
    const result3 = await client.vEmbRaw('key3', 'element');
    assert.equal(result3.quantization, 'f32');
    assert.equal(result3.quantizationRange, undefined);

    await client.vAdd('key4', [1.0, 2.0, 3.0], 'element', { QUANT: 'BIN' });
    const result4 = await client.vEmbRaw('key4', 'element');
    assert.equal(result4.quantization, 'bin');
    assert.equal(result4.quantizationRange, undefined);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
