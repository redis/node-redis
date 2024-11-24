import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import STRLEN from './STRLEN';
import { parseArgs } from './generic-transformers';

describe('STRLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(STRLEN, 'key'),
      ['STRLEN', 'key']
    );
  });

  testUtils.testAll('strLen', async client => {
    assert.equal(
      await client.strLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
