import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'key'),
      ['TDIGEST.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.info', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.info('key')
    ]);

    assert(typeof reply, 'object');
    assert(typeof reply['Compression'], 'number');
    assert(typeof reply['Capacity'], 'number');
    assert(typeof reply['Merged nodes'], 'number');
    assert(typeof reply['Unmerged nodes'], 'number');
    assert(typeof reply['Merged weight'], 'number');
    assert(typeof reply['Unmerged weight'], 'number');
    assert(typeof reply['Observations'], 'number');
    assert(typeof reply['Total compressions'], 'number');
    assert(typeof reply['Memory usage'], 'number');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.tDigest.info structural response shape', async client => {
    await client.tDigest.create('key', { COMPRESSION: 100 });
    await client.tDigest.add('key', [1, 2, 3]);

    const reply = await client.tDigest.info('key');

    // Assert exact structure to catch RESP2 (Array) vs RESP3 (Map) differences
    assert.ok(reply !== null && typeof reply === 'object');
    assert.ok(!Array.isArray(reply)); // Should be object, not array
    assert.deepEqual(Object.keys(reply).sort(), [
      'Capacity',
      'Compression',
      'Memory usage',
      'Merged nodes',
      'Merged weight',
      'Observations',
      'Total compressions',
      'Unmerged nodes',
      'Unmerged weight'
    ].sort());

    // Verify all values are numbers
    assert.strictEqual(typeof reply['Compression'], 'number');
    assert.strictEqual(typeof reply['Capacity'], 'number');
    assert.strictEqual(typeof reply['Merged nodes'], 'number');
    assert.strictEqual(typeof reply['Unmerged nodes'], 'number');
    assert.strictEqual(typeof reply['Merged weight'], 'number');
    assert.strictEqual(typeof reply['Unmerged weight'], 'number');
    assert.strictEqual(typeof reply['Observations'], 'number');
    assert.strictEqual(typeof reply['Total compressions'], 'number');
    assert.strictEqual(typeof reply['Memory usage'], 'number');

    // Verify expected values based on setup
    assert.strictEqual(reply['Compression'], 100);
    assert.strictEqual(reply['Observations'], 3);
  }, GLOBAL.SERVERS.OPEN);
});
