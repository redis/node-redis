import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SINTERSTORE from './SINTERSTORE';
import { parseArgs } from './generic-transformers';

describe('SINTERSTORE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SINTERSTORE, 'destination', 'key'),
        ['SINTERSTORE', 'destination', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SINTERSTORE, 'destination', ['1', '2']),
        ['SINTERSTORE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('sInterStore', async client => {
    assert.equal(
      await client.sInterStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
