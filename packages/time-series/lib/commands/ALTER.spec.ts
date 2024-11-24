import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ALTER from './ALTER';
import { TIME_SERIES_DUPLICATE_POLICIES } from '.';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.ALTER', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key'),
        ['TS.ALTER', 'key']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          RETENTION: 1
        }),
        ['TS.ALTER', 'key', 'RETENTION', '1']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          CHUNK_SIZE: 1
        }),
        ['TS.ALTER', 'key', 'CHUNK_SIZE', '1']
      );
    });

    it('with DUPLICATE_POLICY', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.ALTER', 'key', 'DUPLICATE_POLICY', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          LABELS: { label: 'value' }
        }),
        ['TS.ALTER', 'key', 'LABELS', 'label', 'value']
      );
    });

    it('with IGNORE with MAX_TIME_DIFF', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          IGNORE: { 
            maxTimeDiff: 1,
            maxValDiff: 1
          }
        }),
        ['TS.ALTER', 'key', 'IGNORE', '1', '1']
      )
    });

    it('with RETENTION, CHUNK_SIZE, DUPLICATE_POLICY, LABELS, IGNORE', () => {
      assert.deepEqual(
        parseArgs(ALTER, 'key', {
          RETENTION: 1,
          CHUNK_SIZE: 1,
          DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
          IGNORE: { maxTimeDiff: 1, maxValDiff: 1}
        }),
        ['TS.ALTER', 'key', 'RETENTION', '1', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value', 'IGNORE', '1', '1']
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
