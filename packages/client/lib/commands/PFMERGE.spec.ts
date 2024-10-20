import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PFMERGE from './PFMERGE';
import { parseArgs } from './generic-transformers';

describe('PFMERGE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(PFMERGE, 'destination', 'source'),
        ['PFMERGE', 'destination', 'source']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(PFMERGE, 'destination', ['1', '2']),
        ['PFMERGE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('pfMerge', async client => {
    assert.equal(
      await client.pfMerge('{tag}destination', '{tag}source'),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
