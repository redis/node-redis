import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';

describe('TDIGEST.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INFO.transformArguments('key'),
      ['TDIGEST.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.info', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.info('key')
    ]);

    assert(typeof reply.capacity, 'number');
    assert(typeof reply.mergedNodes, 'number');
    assert(typeof reply.unmergedNodes, 'number');
    assert(typeof reply.mergedWeight, 'number');
    assert(typeof reply.unmergedWeight, 'number');
    assert(typeof reply.totalCompression, 'number');
    assert(typeof reply.totalCompression, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
