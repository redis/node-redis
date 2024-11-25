import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SDIFFSTORE from './SDIFFSTORE';
import { parseArgs } from './generic-transformers';

describe('SDIFFSTORE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SDIFFSTORE, 'destination', 'key'),
        ['SDIFFSTORE', 'destination', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SDIFFSTORE, 'destination', ['1', '2']),
        ['SDIFFSTORE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('sDiffStore', async client => {
    assert.equal(
      await client.sDiffStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
