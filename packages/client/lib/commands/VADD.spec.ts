import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VADD from './VADD';
import { parseArgs } from './generic-transformers';

describe('VADD', () => {
  describe('transformArguments', () => {
    it('basic usage', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0, 3.0], 'element'),
        ['VADD', 'key', 'VALUES', '3', '1', '2', '3', 'element']
      );
    });

    it('with REDUCE option', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2], 'element', { REDUCE: 50 }),
        ['VADD', 'key', 'REDUCE', '50', 'VALUES', '2', '1', '2', 'element']
      );
    });

    it('with quantization options', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', { QUANT: 'Q8' }),
        ['VADD', 'key', 'VALUES', '2', '1', '2', 'element', 'Q8']
      );

      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', { QUANT: 'BIN' }),
        ['VADD', 'key', 'VALUES', '2', '1', '2', 'element', 'BIN']
      );

      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', { QUANT: 'NOQUANT' }),
        ['VADD', 'key', 'VALUES', '2', '1', '2', 'element', 'NOQUANT']
      );
    });

    it('with all options', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', {
          REDUCE: 50,
          CAS: true,
          QUANT: 'Q8',
          EF: 200,
          SETATTR: { name: 'test', value: 42 },
          M: 16
        }),
        [
          'VADD', 'key', 'REDUCE', '50', 'VALUES', '2', '1', '2', 'element',
          'CAS', 'Q8', 'EF', '200', 'SETATTR', '{"name":"test","value":42}', 'M', '16'
        ]
      );
    });
  });

  testUtils.testAll('vAdd', async client => {
    assert.equal(
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element'),
      true
    );

    // same element should not be added again
    assert.equal(
      await client.vAdd('key', [1, 2 , 3], 'element'),
      false
    );

  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] },
  });

  testUtils.testWithClient('vAdd with RESP3', async client => {
    // Test basic functionality with RESP3
    assert.equal(
      await client.vAdd('resp3-key', [1.5, 2.5, 3.5], 'resp3-element'),
      true
    );

    // same element should not be added again
    assert.equal(
      await client.vAdd('resp3-key', [1, 2 , 3], 'resp3-element'),
      false
    );

    // Test with options to ensure complex parameters work with RESP3
    assert.equal(
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'resp3-element2', {
        QUANT: 'Q8',
        CAS: true,
        SETATTR: { type: 'test', value: 123 }
      }),
      true
    );

    // Verify the vector set was created correctly
    assert.equal(
      await client.vCard('resp3-key'),
      2
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
