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
});
