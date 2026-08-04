import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'key'),
      ['TOPK.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.topK.info', async client => {
    const k = 3,
      [, reply] = await Promise.all([
        client.topK.reserve('key', 3),
        client.topK.info('key')
      ]);

    assert.equal(typeof reply, 'object');
    assert.equal(reply.k, k);
    assert.equal(typeof reply.width, 'number');
    assert.equal(typeof reply.depth, 'number');
    assert.equal(typeof reply.decay, 'number');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.topK.info - structural assertion', async client => {
    await client.topK.reserve('key', 5);
    const reply = await client.topK.info('key');

    // Structural assertion to ensure RESP2 array-to-object transformation
    assert.ok(reply !== null && typeof reply === 'object' && !Array.isArray(reply));
    assert.ok('k' in reply && typeof reply.k === 'number');
    assert.ok('width' in reply && typeof reply.width === 'number');
    assert.ok('depth' in reply && typeof reply.depth === 'number');
    assert.ok('decay' in reply && typeof reply.decay === 'number');

    // Verify the structure matches the expected object shape
    const expectedKeys = ['k', 'width', 'depth', 'decay'];
    const actualKeys = Object.keys(reply).sort();
    assert.deepStrictEqual(actualKeys, expectedKeys.sort());
  }, GLOBAL.SERVERS.OPEN);
});
