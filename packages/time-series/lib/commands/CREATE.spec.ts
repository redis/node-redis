import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CREATE from './CREATE';
import { TIME_SERIES_ENCODING, TIME_SERIES_DUPLICATE_POLICIES } from '.';

describe('TS.CREATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        CREATE.transformArguments('key'),
        ['TS.CREATE', 'key']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          RETENTION: 1
        }),
        ['TS.CREATE', 'key', 'RETENTION', '1']
      );
    });

    it('with ENCODING', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED
        }),
        ['TS.CREATE', 'key', 'ENCODING', 'UNCOMPRESSED']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          CHUNK_SIZE: 1
        }),
        ['TS.CREATE', 'key', 'CHUNK_SIZE', '1']
      );
    });

    it('with DUPLICATE_POLICY', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.CREATE', 'key', 'DUPLICATE_POLICY', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          LABELS: { label: 'value' }
        }),
        ['TS.CREATE', 'key', 'LABELS', 'label', 'value']
      );
    });

    it('with IGNORE', () => {
      testUtils.isVersionGreaterThanHook([7, 4]);
      
      it('no values', () => {
        assert.deepEqual(
          CREATE.transformArguments('key', {
            IGNORE: { }
          }),
          ['TS.CREATE', 'key', 'IGNORE', '0', '0']
        )
      });

      it('with MAX_TIME_DIFF', () => {
        assert.deepEqual(
          CREATE.transformArguments('key', {
            IGNORE: { MAX_TIME_DIFF: 1}
          }),
          ['TS.CREATE', 'IGNORE', '1', '0']
        )
      });

      it('with MAX_VAL_DIFF', () => {
        assert.deepEqual(
          CREATE.transformArguments('key', {
            IGNORE: { MAX_VAL_DIFF: 1}
          }),
          ['TS.CREATE', 'IGNORE', '0', '1']
        )
      });
    });

    it('with RETENTION, ENCODING, CHUNK_SIZE, DUPLICATE_POLICY, LABELS', () => {
      assert.deepEqual(
        CREATE.transformArguments('key', {
          RETENTION: 1,
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED,
          CHUNK_SIZE: 1,
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
        }),
        ['TS.CREATE', 'key', 'RETENTION', '1', 'ENCODING', 'UNCOMPRESSED', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value']
      );
    });
  });

  testUtils.testWithClient('client.ts.create', async client => {
    assert.equal(
      await client.ts.create('key'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
