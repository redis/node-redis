import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VGETATTR from './VGETATTR';
import { parseArgs } from './generic-transformers';

describe('VGETATTR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VGETATTR, 'key', 'element'),
      ['VGETATTR', 'key', 'element']
    );
  });

  testUtils.testAll('vGetAttr', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');
    await client.vSetAttr('key', 'element', { name: 'test' });

    const result = await client.vGetAttr('key', 'element');
    assert.ok(result !== null);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
