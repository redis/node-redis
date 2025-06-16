import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VSETATTR from './VSETATTR';
import { parseArgs } from './generic-transformers';

describe('VSETATTR', () => {
  describe('transformArguments', () => {
    it('with object', () => {
      assert.deepEqual(
        parseArgs(VSETATTR, 'key', 'element', { name: 'test', value: 42 }),
        ['VSETATTR', 'key', 'element', '{"name":"test","value":42}']
      );
    });

    it('with string', () => {
      assert.deepEqual(
        parseArgs(VSETATTR, 'key', 'element', '{"name":"test"}'),
        ['VSETATTR', 'key', 'element', '{"name":"test"}']
      );
    });
  });

  testUtils.testAll('vSetAttr', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    assert.equal(
      await client.vSetAttr('key', 'element', { name: 'test', value: 42 }),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('vSetAttr with RESP3 - returns boolean', async client => {
    await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'resp3-element');

    const result = await client.vSetAttr('resp3-key', 'resp3-element', {
      name: 'test-item',
      category: 'electronics',
      price: 99.99
    });

    // RESP3 returns boolean instead of number
    assert.equal(typeof result, 'boolean');
    assert.equal(result, true);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
