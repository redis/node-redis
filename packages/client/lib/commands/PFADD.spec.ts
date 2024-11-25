import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PFADD from './PFADD';
import { parseArgs } from './generic-transformers';

describe('PFADD', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(PFADD, 'key', 'element'),
        ['PFADD', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(PFADD, 'key', ['1', '2']),
        ['PFADD', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('pfAdd', async client => {
    assert.equal(
      await client.pfAdd('key', '1'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
