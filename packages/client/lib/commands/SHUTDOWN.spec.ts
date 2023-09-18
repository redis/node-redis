import { strict as assert } from 'node:assert';
import SHUTDOWN from './SHUTDOWN';

describe('SHUTDOWN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        SHUTDOWN.transformArguments(),
        ['SHUTDOWN']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        SHUTDOWN.transformArguments({
          mode: 'NOSAVE'
        }),
        ['SHUTDOWN', 'NOSAVE']
      );
    });

    it('with NOW', () => {
      assert.deepEqual(
        SHUTDOWN.transformArguments({
          NOW: true
        }),
        ['SHUTDOWN', 'NOW']
      );
    });

    it('with FORCE', () => {
      assert.deepEqual(
        SHUTDOWN.transformArguments({
          FORCE: true
        }),
        ['SHUTDOWN', 'FORCE']
      );
    });

    it('with ABORT', () => {
      assert.deepEqual(
        SHUTDOWN.transformArguments({
          ABORT: true
        }),
        ['SHUTDOWN', 'ABORT']
      );
    });
  });
});
