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
});
