import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VDIM from './VDIM';
import { parseArgs } from './generic-transformers';

describe('VDIM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VDIM, 'key'),
      ['VDIM', 'key']
    );
  });

  testUtils.testAll('vDim', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    assert.equal(
      await client.vDim('key'),
      3
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
