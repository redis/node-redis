import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CREATE from './CREATE';
import { TIME_SERIES_ENCODING, TIME_SERIES_DUPLICATE_POLICIES } from '.';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.CREATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key'),
        ['TS.CREATE', 'key']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          RETENTION: 1
        }),
        ['TS.CREATE', 'key', 'RETENTION', '1']
      );
    });

    it('with ENCODING', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED
        }),
        ['TS.CREATE', 'key', 'ENCODING', 'UNCOMPRESSED']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          CHUNK_SIZE: 1
        }),
        ['TS.CREATE', 'key', 'CHUNK_SIZE', '1']
      );
    });

    it('with DUPLICATE_POLICY', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.CREATE', 'key', 'DUPLICATE_POLICY', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          LABELS: { label: 'value' }
        }),
        ['TS.CREATE', 'key', 'LABELS', 'label', 'value']
      );
    });

    it('with IGNORE with MAX_TIME_DIFF', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          IGNORE: { 
            maxTimeDiff: 1,
            maxValDiff: 1
          }
        }),
        ['TS.CREATE', 'key', 'IGNORE', '1', '1']
      )
    });

    it('with RETENTION, ENCODING, CHUNK_SIZE, DUPLICATE_POLICY, LABELS, IGNORE', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          RETENTION: 1,
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED,
          CHUNK_SIZE: 1,
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
          IGNORE: { maxTimeDiff: 1, maxValDiff: 1}
        }),
        ['TS.CREATE', 'key', 'RETENTION', '1', 'ENCODING', 'UNCOMPRESSED', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value', 'IGNORE', '1', '1']
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
