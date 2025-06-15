import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VLINKS from './VLINKS';
import { parseArgs } from './generic-transformers';

describe('VLINKS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VLINKS, 'key', 'element'),
      ['VLINKS', 'key', 'element']
    );
  });

  testUtils.testAll('vLinks', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vLinks('key', 'element1');
    assert.ok(Array.isArray(result));
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
