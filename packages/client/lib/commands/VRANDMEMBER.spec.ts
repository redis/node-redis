import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VRANDMEMBER from './VRANDMEMBER';
import { parseArgs } from './generic-transformers';

describe('VRANDMEMBER', () => {
  describe('transformArguments', () => {
    it('without count', () => {
      assert.deepEqual(
        parseArgs(VRANDMEMBER, 'key'),
        ['VRANDMEMBER', 'key']
      );
    });

    it('with count', () => {
      assert.deepEqual(
        parseArgs(VRANDMEMBER, 'key', 2),
        ['VRANDMEMBER', 'key', '2']
      );
    });
  });

  testUtils.testAll('vRandMember', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');

    const result = await client.vRandMember('key', 1);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
