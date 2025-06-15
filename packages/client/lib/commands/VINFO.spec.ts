import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VINFO from './VINFO';
import { parseArgs } from './generic-transformers';

describe('VINFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VINFO, 'key'),
      ['VINFO', 'key']
    );
  });

  testUtils.testAll('vInfo', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const result = await client.vInfo('key');
    assert.ok(Array.isArray(result));
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
