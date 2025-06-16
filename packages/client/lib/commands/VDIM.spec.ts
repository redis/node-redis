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

  testUtils.testWithClient('vDim with RESP3', async client => {
    // Test with different vector dimensions
    await client.vAdd('resp3-2d', [1.0, 2.0], 'elem2d');
    assert.equal(
      await client.vDim('resp3-2d'),
      2
    );

    await client.vAdd('resp3-5d', [1.0, 2.0, 3.0, 4.0, 5.0], 'elem5d');
    assert.equal(
      await client.vDim('resp3-5d'),
      5
    );

    // Verify dimension consistency within the same vector set
    await client.vAdd('resp3-5d', [6.0, 7.0, 8.0, 9.0, 10.0], 'elem5d-2');
    assert.equal(
      await client.vDim('resp3-5d'),
      5
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
