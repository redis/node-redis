import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MEMORY_STATS from './MEMORY_STATS';
import { parseArgs } from './generic-transformers';

describe('MEMORY STATS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MEMORY_STATS),
      ['MEMORY', 'STATS']
    );
  });

  testUtils.testWithClient('client.memoryStats', async client => {
    const memoryStats = await client.memoryStats();
    assert.equal(typeof memoryStats['peak.allocated'], 'number');
    assert.equal(typeof memoryStats['total.allocated'], 'number');
    assert.equal(typeof memoryStats['startup.allocated'], 'number');
    assert.equal(typeof memoryStats['replication.backlog'], 'number');
    assert.equal(typeof memoryStats['clients.slaves'], 'number');
    assert.equal(typeof memoryStats['clients.normal'], 'number');
    assert.equal(typeof memoryStats['aof.buffer'], 'number');
    assert.equal(typeof memoryStats['lua.caches'], 'number');
    assert.equal(typeof memoryStats['overhead.total'], 'number');
    assert.equal(typeof memoryStats['keys.count'], 'number');
    assert.equal(typeof memoryStats['keys.bytes-per-key'], 'number');
    assert.equal(typeof memoryStats['dataset.bytes'], 'number');
    assert.equal(typeof memoryStats['dataset.percentage'], 'number');
    assert.equal(typeof memoryStats['peak.percentage'], 'number');
    assert.equal(typeof memoryStats['allocator.allocated'], 'number');
    assert.equal(typeof memoryStats['allocator.active'], 'number');
    assert.equal(typeof memoryStats['allocator.resident'], 'number');
    assert.equal(typeof memoryStats['allocator-fragmentation.ratio'], 'number', 'allocator-fragmentation.ratio');
    assert.equal(typeof memoryStats['allocator-fragmentation.bytes'], 'number');
    assert.equal(typeof memoryStats['allocator-rss.ratio'], 'number', 'allocator-rss.ratio');
    assert.equal(typeof memoryStats['allocator-rss.bytes'], 'number');
    assert.equal(typeof memoryStats['rss-overhead.ratio'], 'number', 'rss-overhead.ratio');
    assert.equal(typeof memoryStats['rss-overhead.bytes'], 'number');
    assert.equal(typeof memoryStats['fragmentation'], 'number', 'fragmentation');
    assert.equal(typeof memoryStats['fragmentation.bytes'], 'number');
    
    if (testUtils.isVersionGreaterThan([7])) {
      assert.equal(typeof memoryStats['cluster.links'], 'number');
      assert.equal(typeof memoryStats['functions.caches'], 'number');
    }
  }, GLOBAL.SERVERS.OPEN);
});
