import { strict as assert } from 'node:assert';
import FAILOVER from './FAILOVER';
import { parseArgs } from './generic-transformers';

describe('FAILOVER', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(FAILOVER),
        ['FAILOVER']
      );
    });

    describe('with TO', () => {
      it('simple', () => {
        assert.deepEqual(
          parseArgs(FAILOVER, {
            TO: {
              host: 'host',
              port: 6379
            }
          }),
          ['FAILOVER', 'TO', 'host', '6379']
        );
      });

      it('with FORCE', () => {
        assert.deepEqual(
          parseArgs(FAILOVER, {
            TO: {
              host: 'host',
              port: 6379,
              FORCE: true
            }
          }),
          ['FAILOVER', 'TO', 'host', '6379', 'FORCE']
        );
      });
    });

    it('with ABORT', () => {
      assert.deepEqual(
        parseArgs(FAILOVER, {
          ABORT: true
        }),
        ['FAILOVER', 'ABORT']
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(FAILOVER, {
          TIMEOUT: 1
        }),
        ['FAILOVER', 'TIMEOUT', '1']
      );
    });

    it('with TO, ABORT, TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(FAILOVER, {
          TO: {
            host: 'host',
            port: 6379
          },
          ABORT: true,
          TIMEOUT: 1
        }),
        ['FAILOVER', 'TO', 'host', '6379', 'ABORT', 'TIMEOUT', '1']
      );
    });
  });
});
