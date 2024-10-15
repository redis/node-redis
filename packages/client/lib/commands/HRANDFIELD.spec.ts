import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HRANDFIELD from './HRANDFIELD';
import { parseArgs } from './generic-transformers';

describe('HRANDFIELD', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HRANDFIELD, 'key'),
      ['HRANDFIELD', 'key']
    );
  });

  testUtils.testAll('hRandField', async client => {
    assert.equal(
      await client.hRandField('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
