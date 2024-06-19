import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LCS from './LCS';
import { parseArgs } from './generic-transformers';

describe('LCS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LCS, '1', '2'),
      ['LCS', '1', '2']
    );
  });

  testUtils.testAll('lcs', async client => {
    assert.equal(
      await client.lcs('{tag}1', '{tag}2'),
      ''
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
