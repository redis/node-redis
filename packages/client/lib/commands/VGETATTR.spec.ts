import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VGETATTR from './VGETATTR';
import { BasicCommandParser } from '../client/parser';

describe('VGETATTR', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VGETATTR.parseCommand(parser, 'key', 'element');
    assert.deepEqual(
      parser.redisArgs,
      ['VGETATTR', 'key', 'element']
    );
  });

  testUtils.testAll('vGetAttr', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const nullResult = await client.vGetAttr('key', 'element');
    assert.equal(nullResult, null);

    await client.vSetAttr('key', 'element', { name: 'test' });

    const result = await client.vGetAttr('key', 'element');

    assert.ok(result !== null);
    assert.equal(typeof result, 'object')

    assert.deepEqual(result, {
      name: 'test'
    })


  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vGetAttr with RESP3', async client => {
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
    assert.equal(typeof result, 'object')

    assert.deepEqual(result, {
      name: 'test-item',
      category: 'electronics',
      price: 99.99,
      inStock: true,
      tags: ['new', 'featured']
    })

  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
