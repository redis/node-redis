import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VSIM from './VSIM';
import { parseArgs } from './generic-transformers';

describe('VSIM', () => {
  describe('transformArguments', () => {
    it('with vector', () => {
      assert.deepEqual(
        parseArgs(VSIM, 'key', [1.0, 2.0, 3.0]),
        ['VSIM', 'key', 'VALUES', '3', '1', '2', '3']
      );
    });

    it('with element', () => {
      assert.deepEqual(
        parseArgs(VSIM, 'key', 'element'),
        ['VSIM', 'key', 'ELE', 'element']
      );
    });

    it('with options', () => {
      assert.deepEqual(
        parseArgs(VSIM, 'key', 'element', {
          COUNT: 5,
          EF: 100,
          FILTER: '.price > 20',
          'FILTER-EF': 50,
          TRUTH: true,
          NOTHREAD: true
        }),
        [
          'VSIM', 'key', 'ELE', 'element',
          'COUNT', '5', 'EF', '100', 'FILTER', '.price > 20',
          'FILTER-EF', '50', 'TRUTH', 'NOTHREAD'
        ]
      );
    });
  });

  testUtils.testAll('vSim', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vSim('key', 'element1');
    assert.ok(Array.isArray(result));
    assert.ok(result.includes('element1'));
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vSim with RESP3', async client => {
    await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('resp3-key', [1.1, 2.1, 3.1], 'element2');
    await client.vAdd('resp3-key', [2.0, 3.0, 4.0], 'element3');

    // Test similarity search with vector
    const resultWithVector = await client.vSim('resp3-key', [1.05, 2.05, 3.05]);
    assert.ok(Array.isArray(resultWithVector));
    assert.ok(resultWithVector.length > 0);

    // Test similarity search with element
    const resultWithElement = await client.vSim('resp3-key', 'element1');
    assert.ok(Array.isArray(resultWithElement));
    assert.ok(resultWithElement.includes('element1'));

    // Test with options
    const resultWithOptions = await client.vSim('resp3-key', 'element1', { COUNT: 2 });
    assert.ok(Array.isArray(resultWithOptions));
    assert.ok(resultWithOptions.length <= 2);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
