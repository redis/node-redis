import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITCOUNT from './BITCOUNT';

describe('BITCOUNT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        BITCOUNT.transformArguments('key'),
        ['BITCOUNT', 'key']
      );
    });

    describe('with range', () => {
      it('simple', () => {
        assert.deepEqual(
          BITCOUNT.transformArguments('key', {
            start: 0,
            end: 1
          }),
          ['BITCOUNT', 'key', '0', '1']
        );
      });

      it('with mode', () => {
        assert.deepEqual(
          BITCOUNT.transformArguments('key', {
            start: 0,
            end: 1,
            mode: 'BIT'
          }),
          ['BITCOUNT', 'key', '0', '1', 'BIT']
        );
      });
    });
  });

  testUtils.testAll('bitCount', async client => {
    assert.equal(
      await client.bitCount('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
