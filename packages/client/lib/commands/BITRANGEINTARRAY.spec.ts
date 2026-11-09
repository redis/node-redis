import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITRANGEINTARRAY from './BITRANGEINTARRAY';
import { parseArgs } from './generic-transformers';
import { RESP_TYPES } from '../RESP/decoder';

describe('BITRANGEINTARRAY', () => {
  describe('parseCommand', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 0, -1),
        ['BITRANGEINTARRAY', 'key', '0', '-1']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 0, -1, { mode: 'BIT' }),
        ['BITRANGEINTARRAY', 'key', '0', '-1', 'BIT']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 0, -1, { LIMIT: 10 }),
        ['BITRANGEINTARRAY', 'key', '0', '-1', 'LIMIT', '10']
      );
    });

    it('with LIMIT 0', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 0, -1, { LIMIT: 0 }),
        ['BITRANGEINTARRAY', 'key', '0', '-1', 'LIMIT', '0']
      );
    });

    it('with ZEROS', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 0, -1, { ZEROS: true }),
        ['BITRANGEINTARRAY', 'key', '0', '-1', 'ZEROS']
      );
    });

    it('with mode, LIMIT and ZEROS', () => {
      assert.deepEqual(
        parseArgs(BITRANGEINTARRAY, 'key', 5, 10, { mode: 'BIT', LIMIT: 2, ZEROS: true }),
        ['BITRANGEINTARRAY', 'key', '5', '10', 'BIT', 'LIMIT', '2', 'ZEROS']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('bitRangeIntArray', async client => {
      // The first and the last bit of each of four bytes are set.
      await client.set('key', Buffer.from([0x81, 0x81, 0x81, 0x81]));

      assert.deepEqual(
        await client.bitRangeIntArray('key', 0, -1),
        [0, 7, 8, 15, 16, 23, 24, 31]
      );
      assert.deepEqual(
        await client.bitRangeIntArray('key', 1, 1),
        [8, 15]
      );
      assert.deepEqual(
        await client.bitRangeIntArray('key', 7, 8, { mode: 'BIT' }),
        [7, 8]
      );
      assert.deepEqual(
        await client.bitRangeIntArray('key', 0, 7, { mode: 'BIT', ZEROS: true }),
        [1, 2, 3, 4, 5, 6]
      );
      assert.deepEqual(
        await client.bitRangeIntArray('key', 0, -1, { mode: 'BIT', LIMIT: 3 }),
        [0, 7, 8]
      );
      // In BYTE mode the reply completes the byte that holds the last offset.
      assert.deepEqual(
        await client.bitRangeIntArray('key', 0, -1, { LIMIT: 1 }),
        [0, 7]
      );
      assert.deepEqual(
        await client.bitRangeIntArray('missing', 0, -1),
        []
      );
      // Without LIMIT and ZEROS the reply holds as many offsets as BITCOUNT counts.
      assert.equal(
        (await client.bitRangeIntArray('key', 1, 2)).length,
        await client.bitCount('key', { start: 1, end: 2 })
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });

    testUtils.testWithClient('bitRangeIntArray on a native bitmap', async client => {
      await client.configSet('bitmap-default-roaring', 'yes');
      try {
        for (const offset of [0, 7, 8, 15]) {
          await client.setBit('key', offset, 1);
        }
        assert.equal(await client.type('key'), 'bitmap');

        assert.deepEqual(
          await client.bitRangeIntArray('key', 0, -1),
          [0, 7, 8, 15]
        );
        assert.deepEqual(
          await client.bitRangeIntArray('key', 0, 7, { mode: 'BIT', ZEROS: true }),
          [1, 2, 3, 4, 5, 6]
        );
        assert.deepEqual(
          await client.bitRangeIntArray('key', 0, -1, { mode: 'BIT', LIMIT: 3 }),
          [0, 7, 8]
        );
      } finally {
        await client.configSet('bitmap-default-roaring', 'no');
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('bitRangeIntArray offset above Number.MAX_SAFE_INTEGER', async client => {
      const [, protoMaxBulkLen] = Object.entries(await client.configGet('proto-max-bulk-len'))[0];
      await client.configSet({
        'bitmap-default-roaring': 'yes',
        'proto-max-bulk-len': '9223372036854775807'
      });
      try {
        // 2^53 + 1 is not representable as a number, so set it as a string.
        await client.sendCommand(['SETBIT', 'key', '9007199254740993', '1']);

        assert.deepEqual(
          await client.withTypeMapping({ [RESP_TYPES.NUMBER]: String })
            .bitRangeIntArray('key', 0, -1, { mode: 'BIT' }),
          ['9007199254740993']
        );
      } finally {
        await client.configSet({
          'bitmap-default-roaring': 'no',
          'proto-max-bulk-len': protoMaxBulkLen
        });
      }
    }, GLOBAL.SERVERS.OPEN);
  });
});
