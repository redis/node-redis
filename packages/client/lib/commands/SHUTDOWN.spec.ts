import { strict as assert } from 'node:assert';
import SHUTDOWN from './SHUTDOWN';
import { parseArgs } from './generic-transformers';

describe('SHUTDOWN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SHUTDOWN),
        ['SHUTDOWN']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(SHUTDOWN, {
          mode: 'NOSAVE'
        }),
        ['SHUTDOWN', 'NOSAVE']
      );
    });

    it('with NOW', () => {
      assert.deepEqual(
        parseArgs(SHUTDOWN, {
          NOW: true
        }),
        ['SHUTDOWN', 'NOW']
      );
    });

    it('with FORCE', () => {
      assert.deepEqual(
        parseArgs(SHUTDOWN, {
          FORCE: true
        }),
        ['SHUTDOWN', 'FORCE']
      );
    });

    it('with ABORT', () => {
      assert.deepEqual(
        parseArgs(SHUTDOWN, {
          ABORT: true
        }),
        ['SHUTDOWN', 'ABORT']
      );
    });
  });
});
