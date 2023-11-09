import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';

describe('BF.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INFO.transformArguments('bloom'),
      ['BF.INFO', 'bloom']
    );
  });

  testUtils.testWithClient('client.bf.info', async client => {
    const [, reply] = await Promise.all([
      client.bf.reserve('key', 0.01, 100),
      client.bf.info('key')
    ]);

    assert.equal(typeof reply, 'object');
    assert.equal(reply.capacity, 100);
    assert.equal(typeof reply.size, 'number');
    assert.equal(typeof reply.numberOfFilters, 'number');
    assert.equal(typeof reply.numberOfInsertedItems, 'number');
    assert.equal(typeof reply.expansionRate, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
