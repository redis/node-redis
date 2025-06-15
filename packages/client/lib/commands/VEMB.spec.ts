import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VEMB from './VEMB';
import { parseArgs } from './generic-transformers';

describe('VEMB', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VEMB, 'key', 'element'),
      ['VEMB', 'key', 'element']
    );
  });

  testUtils.testAll('vEmb', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const result = await client.vEmb('key', 'element');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 3);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
