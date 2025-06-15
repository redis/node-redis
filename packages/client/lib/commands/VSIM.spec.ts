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
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
