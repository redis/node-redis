import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUNIONCARD from './SUNIONCARD';
import { parseArgs } from './generic-transformers';

describe('SUNIONCARD', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SUNIONCARD, ['1', '2']),
        ['SUNIONCARD', '2', '1', '2']
      );
    });

    it('with APPROX', () => {
      assert.deepEqual(
        parseArgs(SUNIONCARD, ['1', '2'], {
          APPROX: true
        }),
        ['SUNIONCARD', '2', '1', '2', 'APPROX']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SUNIONCARD, ['1', '2'], {
          LIMIT: 3
        }),
        ['SUNIONCARD', '2', '1', '2', 'LIMIT', '3']
      );
    });

    it('with APPROX and LIMIT', () => {
      assert.deepEqual(
        parseArgs(SUNIONCARD, ['1', '2'], {
          APPROX: true,
          LIMIT: 3
        }),
        ['SUNIONCARD', '2', '1', '2', 'APPROX', 'LIMIT', '3']
      );
    });
  });

  testUtils.testAll('sUnionCard', async client => {
    assert.equal(
      await client.sUnionCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
