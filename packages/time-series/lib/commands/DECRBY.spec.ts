import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DECRBY from './DECRBY';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.DECRBY', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1),
        ['TS.DECRBY', 'key', '1']
      );
    });

    it('with TIMESTAMP', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          TIMESTAMP: '*'
        }),
        ['TS.DECRBY', 'key', '1', 'TIMESTAMP', '*']
      );
    });

    it('with RETENTION', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          RETENTION: 1
        }),
        ['TS.DECRBY', 'key', '1', 'RETENTION', '1']
      );
    });

    it('with UNCOMPRESSED', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          UNCOMPRESSED: true
        }),
        ['TS.DECRBY', 'key', '1', 'UNCOMPRESSED']
      );
    });

    it('with CHUNK_SIZE', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          CHUNK_SIZE: 100
        }),
        ['TS.DECRBY', 'key', '1', 'CHUNK_SIZE', '100']
      );
    });

    it('with LABELS', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          LABELS: { label: 'value' }
        }),
        ['TS.DECRBY', 'key', '1', 'LABELS', 'label', 'value']
      );
    });

    it ('with IGNORE', () => {     
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          IGNORE: { 
            maxTimeDiff: 1,
            maxValDiff: 1
          }
        }),
        ['TS.DECRBY', 'key', '1', 'IGNORE', '1', '1']
      )
    });
  
    it('with TIMESTAMP, RETENTION, UNCOMPRESSED, CHUNK_SIZE and LABELS', () => {
      assert.deepEqual(
        parseArgs(DECRBY, 'key', 1, {
          TIMESTAMP: '*',
          RETENTION: 1,
          UNCOMPRESSED: true,
          CHUNK_SIZE: 2,
          LABELS: { label: 'value' },
          IGNORE: { maxTimeDiff: 1, maxValDiff: 1 }
        }),
        ['TS.DECRBY', 'key', '1', 'TIMESTAMP', '*', 'RETENTION', '1', 'UNCOMPRESSED', 'CHUNK_SIZE', '2', 'LABELS', 'label', 'value', 'IGNORE', '1', '1']
      );
    });
  });

  testUtils.testWithClient('client.ts.decrBy', async client => {
    assert.equal(
      typeof await client.ts.decrBy('key', 1),
      'number'
    );
  }, GLOBAL.SERVERS.OPEN);
});
