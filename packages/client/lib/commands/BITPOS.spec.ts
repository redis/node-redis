import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITPOS from './BITPOS';

describe('BITPOS', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        BITPOS.transformArguments('key', 1),
        ['BITPOS', 'key', '1']
      );
    });

    it('with start', () => {
      assert.deepEqual(
        BITPOS.transformArguments('key', 1, 1),
        ['BITPOS', 'key', '1', '1']
      );
    });

    it('with start and end', () => {
      assert.deepEqual(
        BITPOS.transformArguments('key', 1, 1, -1),
        ['BITPOS', 'key', '1', '1', '-1']
      );
    });

    it('with start, end and mode', () => {
      assert.deepEqual(
        BITPOS.transformArguments('key', 1, 1, -1, 'BIT'),
        ['BITPOS', 'key', '1', '1', '-1', 'BIT']
      );
    });
  });

  testUtils.testAll('bitPos', async client => {
    assert.equal(
      await client.bitPos('key', 1, 1),
      -1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
