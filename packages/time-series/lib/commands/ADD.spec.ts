import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ADD from './ADD';
import { TIME_SERIES_ENCODING, TIME_SERIES_DUPLICATE_POLICIES } from '.';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.ADD', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1),
        ['TS.ADD', 'key', '*', '1']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          RETENTION: 1
        }),
        ['TS.ADD', 'key', '*', '1', 'RETENTION', '1']
      );
    });

    it('with ENCODING', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED
        }),
        ['TS.ADD', 'key', '*', '1', 'ENCODING', 'UNCOMPRESSED']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          CHUNK_SIZE: 1
        }),
        ['TS.ADD', 'key', '*', '1', 'CHUNK_SIZE', '1']
      );
    });

    it('with ON_DUPLICATE', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          ON_DUPLICATE: TIME_SERIES_DUPLICATE_POLICIES.BLOCK
        }),
        ['TS.ADD', 'key', '*', '1', 'ON_DUPLICATE', 'BLOCK']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          LABELS: { label: 'value' }
        }),
        ['TS.ADD', 'key', '*', '1', 'LABELS', 'label', 'value']
      );
    });

    it ('with IGNORE', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          IGNORE: { 
            maxTimeDiff: 1,
            maxValDiff: 1
           }
        }),
        ['TS.ADD', 'key', '*', '1', 'IGNORE', '1', '1']
      )
    });

    it('with RETENTION, ENCODING, CHUNK_SIZE, ON_DUPLICATE, LABELS, IGNORE', () => {
      assert.deepEqual(
        parseArgs(ADD, 'key', '*', 1, {
          RETENTION: 1,
          ENCODING: TIME_SERIES_ENCODING.UNCOMPRESSED,
          CHUNK_SIZE: 1,
          ON_DUPLICATE: TIME_SERIES_DUPLICATE_POLICIES.BLOCK,
          LABELS: { label: 'value' },
          IGNORE: { maxTimeDiff: 1, maxValDiff: 1}
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
