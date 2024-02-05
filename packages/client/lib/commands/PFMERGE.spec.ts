import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PFMERGE from './PFMERGE';

describe('PFMERGE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        PFMERGE.transformArguments('destination', 'source'),
        ['PFMERGE', 'destination', 'source']
      );
    });

    it('array', () => {
      assert.deepEqual(
        PFMERGE.transformArguments('destination', ['1', '2']),
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
