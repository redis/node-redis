import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';

describe('CF.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INFO.transformArguments('cuckoo'),
      ['CF.INFO', 'cuckoo']
    );
  });

  testUtils.testWithClient('client.cf.info', async client => {
    const [, reply] = await Promise.all([
      client.cf.reserve('key', 4),
      client.cf.info('key')
    ]);

    assert.equal(typeof reply, 'object');
    assert.equal(typeof reply.size, 'number');
    assert.equal(typeof reply.numberOfBuckets, 'number');
    assert.equal(typeof reply.numberOfFilters, 'number');
    assert.equal(typeof reply.numberOfInsertedItems, 'number');
    assert.equal(typeof reply.numberOfDeletedItems, 'number');
    assert.equal(typeof reply.bucketSize, 'number');
    assert.equal(typeof reply.expansionRate, 'number');
    assert.equal(typeof reply.maxIteration, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
