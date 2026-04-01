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

  testUtils.testAll('lcs with actual common substring', async client => {
    await Promise.all([
      client.set('{tag}key1', 'ohmytext'),
      client.set('{tag}key2', 'mynewtext')
    ]);

    const result = await client.lcs('{tag}key1', '{tag}key2');

    assert.equal(typeof result, 'string');
    assert.equal(result, 'mytext');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
