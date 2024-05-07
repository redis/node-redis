import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ADD from './ADD';
import { TIME_SERIES_ENCODING, TIME_SERIES_DUPLICATE_POLICIES } from '.';

describe('TS.ADD', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1),
        ['TS.ADD', 'key', '*', '1']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          RETENTION: 1
        }),
        ['TS.ADD', 'key', '*', '1', 'RETENTION', '1']
      );
    });

    it('with ENCODING', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED
        }),
        ['TS.ADD', 'key', '*', '1', 'ENCODING', 'UNCOMPRESSED']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          CHUNK_SIZE: 1
        }),
        ['TS.ADD', 'key', '*', '1', 'CHUNK_SIZE', '1']
      );
    });

    it('with ON_DUPLICATE', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          ON_DUPLICATE: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.ADD', 'key', '*', '1', 'ON_DUPLICATE', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          LABELS: { label: 'value' }
        }),
        ['TS.ADD', 'key', '*', '1', 'LABELS', 'label', 'value']
      );
    });

    it('with IGNORE no values', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          IGNORE: { }
        }),
        ['TS.ADD', 'key', '*', '1', 'IGNORE', '0', '0']
      )
    });

    it('with IGNORE with MAX_TIME_DIFF', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          IGNORE: { MAX_TIME_DIFF: 1}
        }),
        ['TS.ADD', 'key', '*', '1', 'IGNORE', '1', '0']
      )
    });

    it('with IGNORE with MAX_VAL_DIFF', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          IGNORE: { MAX_VAL_DIFF: 1}
        }),
        ['TS.ADD', 'key', '*', '1', 'IGNORE', '0', '1']
      )
    });

    it('with RETENTION, ENCODING, CHUNK_SIZE, ON_DUPLICATE, LABELS, IGNORE', () => {
      assert.deepEqual(
        ADD.transformArguments('key', '*', 1, {
          RETENTION: 1,
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED,
          CHUNK_SIZE: 1,
          ON_DUPLICATE: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
          IGNORE: { MAX_TIME_DIFF: 1, MAX_VAL_DIFF: 1}
        }),
        ['TS.ADD', 'key', '*', '1', 'RETENTION', '1', 'ENCODING', 'UNCOMPRESSED', 'CHUNK_SIZE', '1', 'ON_DUPLICATE', 'BLOCK', 'LABELS', 'label', 'value', 'IGNORE', '1', '1']
      );
    });
  });

  testUtils.testWithClient('client.ts.add', async client => {
    assert.equal(
      await client.ts.add('key', 0, 1),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
