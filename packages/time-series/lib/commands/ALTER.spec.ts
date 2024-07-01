import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALTER from './ALTER';
import { TIME_SERIES_DUPLICATE_POLICIES } from '.';

describe('TS.ALTER', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        ALTER.transformArguments('key'),
        ['TS.ALTER', 'key']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        ALTER.transformArguments('key', {
          RETENTION: 1
        }),
        ['TS.ALTER', 'key', 'RETENTION', '1']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        ALTER.transformArguments('key', {
          CHUNK_SIZE: 1
        }),
        ['TS.ALTER', 'key', 'CHUNK_SIZE', '1']
      );
    });

    it('with DUPLICATE_POLICY', () => {
      assert.deepEqual(
        ALTER.transformArguments('key', {
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.ALTER', 'key', 'DUPLICATE_POLICY', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        ALTER.transformArguments('key', {
          LABELS: { label: 'value' }
        }),
        ['TS.ALTER', 'key', 'LABELS', 'label', 'value']
      );
    });

    it('with IGNORE', () => {
      testUtils.isVersionGreaterThanHook([7, 4]);
      
      it('no values', () => {
        assert.deepEqual(
          ALTER.transformArguments('key', {
            IGNORE: { }
          }),
          ['TS.ALTER', 'key', 'IGNORE', '0', '0']
        )
      });

      it('with MAX_TIME_DIFF', () => {
        assert.deepEqual(
          ALTER.transformArguments('key', {
            IGNORE: { MAX_TIME_DIFF: 1}
          }),
          ['TS.ALTER', 'key', 'IGNORE', '1', '0']
        )
      });

      it('with MAX_VAL_DIFF', () => {
        assert.deepEqual(
          ALTER.transformArguments('key', {
            IGNORE: { MAX_VAL_DIFF: 1}
          }),
          ['TS.ALTER', 'key', 'IGNORE', '0', '1']
        )
      });
    });

    it('with RETENTION, CHUNK_SIZE, DUPLICATE_POLICY, LABELS', () => {
      assert.deepEqual(
        ALTER.transformArguments('key', {
          RETENTION: 1,
          CHUNK_SIZE: 1,
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
        }),
        ['TS.ALTER', 'key', 'RETENTION', '1', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value']
      );
    });
  });

  testUtils.testWithClient('client.ts.alter', async client => {
    const [, reply] = await Promise.all([
      client.ts.create('key'),
      client.ts.alter('key')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
