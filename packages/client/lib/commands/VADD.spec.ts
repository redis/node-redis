import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VADD from './VADD';
import { parseArgs } from './generic-transformers';

describe('VADD', () => {
  describe('transformArguments', () => {
    it('with VALUES', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0, 3.0], 'element'),
        ['VADD', 'key', 'VALUES', '3', '1', '2', '3', 'element']
      );
    });

    it('with FP32', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', Buffer.from([0x3f, 0x80, 0x00, 0x00]), 'element'),
        ['VADD', 'key', 'FP32', Buffer.from([0x3f, 0x80, 0x00, 0x00]), 'element']
      );
    });

    it('with options', () => {
      assert.deepEqual(
        parseArgs(VADD, 'key', [1.0, 2.0], 'element', {
          REDUCE: 50,
          CAS: true,
          Q8: true,
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
