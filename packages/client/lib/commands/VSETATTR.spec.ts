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
});
