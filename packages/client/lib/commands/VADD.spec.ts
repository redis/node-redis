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
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', { REDUCE: 50 }),
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
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
