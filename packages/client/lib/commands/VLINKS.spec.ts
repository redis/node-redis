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
    assert.equal(result.length, 1)
    assert.ok(Array.isArray(result[0]));
    assert.equal(result[0].length, 1);
    assert.equal(result[0][0], 'element2');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('vLinks with RESP3', async client => {
    await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('resp3-key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vLinks('resp3-key', 'element1');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 1)
    assert.ok(Array.isArray(result[0]));
    assert.equal(result[0].length, 1);
    assert.equal(result[0][0], 'element2');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
