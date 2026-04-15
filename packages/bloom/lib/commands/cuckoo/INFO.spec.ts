import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'cuckoo'),
      ['CF.INFO', 'cuckoo']
    );
  });

  testUtils.testWithClient('client.cf.info', async client => {
    const [, reply] = await Promise.all([
      client.cf.reserve('key', 4),
      client.cf.info('key')
    ]);

    assert.equal(typeof reply, 'object');
    assert.equal(typeof reply['Size'], 'number');
    assert.equal(typeof reply['Number of buckets'], 'number');
    assert.equal(typeof reply['Number of filters'], 'number');
    assert.equal(typeof reply['Number of items inserted'], 'number');
    assert.equal(typeof reply['Number of items deleted'], 'number');
    assert.equal(typeof reply['Bucket size'], 'number');
    assert.equal(typeof reply['Expansion rate'], 'number');
    assert.equal(typeof reply['Max iterations'], 'number');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.cf.info returns object structure', async client => {
    await client.cf.reserve('key', 4);
    const reply = await client.cf.info('key');

    // Structural assertion: response must be a plain object (not an array)
    assert.ok(!Array.isArray(reply), 'reply should not be an array');
    assert.equal(typeof reply, 'object');

    // Assert exact structure with all expected keys
    const expectedKeys = [
      'Size',
      'Number of buckets',
      'Number of filters',
      'Number of items inserted',
      'Number of items deleted',
      'Bucket size',
      'Expansion rate',
      'Max iterations'
    ];

    assert.deepEqual(Object.keys(reply).sort(), expectedKeys.sort());

    // Assert all values are numbers
    for (const key of expectedKeys) {
      assert.equal(typeof reply[key], 'number', `${key} should be a number`);
    }
  }, GLOBAL.SERVERS.OPEN);
});
