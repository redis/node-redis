import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RANDOMKEY from './RANDOMKEY';
import { parseArgs } from './generic-transformers';

describe('RANDOMKEY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RANDOMKEY),
      ['RANDOMKEY']
    );
  });

  testUtils.testAll('randomKey', async client => {
    assert.equal(
      await client.randomKey(),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
