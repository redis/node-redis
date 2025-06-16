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

  testUtils.testWithClient('vGetAttr with RESP3', async client => {
    // Test getting attributes with RESP3
    await client.vAdd('resp3-key', [1.0, 2.0], 'resp3-element');

    // Test null case (no attributes set)
    const nullResult = await client.vGetAttr('resp3-key', 'resp3-element');
    assert.equal(nullResult, null);

    // Set complex attributes and retrieve them
    const complexAttrs = {
      name: 'test-item',
      category: 'electronics',
      price: 99.99,
      inStock: true,
      tags: ['new', 'featured']
    };
    await client.vSetAttr('resp3-key', 'resp3-element', complexAttrs);

    const result = await client.vGetAttr('resp3-key', 'resp3-element');
    assert.ok(result !== null);

    // Parse the JSON result and verify structure
    const parsedAttrs = JSON.parse(result.toString());
    assert.equal(parsedAttrs.name, 'test-item');
    assert.equal(parsedAttrs.price, 99.99);
    assert.equal(parsedAttrs.inStock, true);
    assert.ok(Array.isArray(parsedAttrs.tags));
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
