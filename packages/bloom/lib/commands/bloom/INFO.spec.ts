import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'bloom'),
      ['BF.INFO', 'bloom']
    );
  });

  testUtils.testWithClient('client.bf.info', async client => {
    const [, reply] = await Promise.all([
      client.bf.reserve('key', 0.01, 100),
      client.bf.info('key')
    ]);

    assert.equal(typeof reply, 'object');
    assert.equal(reply['Capacity'], 100);
    assert.equal(typeof reply['Size'], 'number');
    assert.equal(typeof reply['Number of filters'], 'number');
    assert.equal(typeof reply['Number of items inserted'], 'number');
    assert.equal(typeof reply['Expansion rate'], 'number');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.bf.info - structural shape assertion', async client => {
    await client.bf.reserve('key', 0.01, 100);
    const reply = await client.bf.info('key');

    // Assert the exact RESP2 response structure (object with specific keys)
    // This would break if RESP3 returns a different shape
    assert.ok(reply !== null && typeof reply === 'object');
    assert.ok(!Array.isArray(reply));
    assert.ok(!(reply instanceof Map));
    assert.ok('Capacity' in reply);
    assert.ok('Size' in reply);
    assert.ok('Number of filters' in reply);
    assert.ok('Number of items inserted' in reply);
    assert.ok('Expansion rate' in reply);
    assert.equal(reply['Capacity'], 100);
    assert.equal(typeof reply['Size'], 'number');
    assert.equal(typeof reply['Number of filters'], 'number');
    assert.equal(typeof reply['Number of items inserted'], 'number');
    assert.equal(typeof reply['Expansion rate'], 'number');
  }, GLOBAL.SERVERS.OPEN);
});
