import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { RedisClusterOptions, RedisClusterClientOptions } from './index';
import RedisClusterSlots from './cluster-slots';

describe('RedisClusterSlots', () => {
  describe('initialization', () => {
    describe('clientSideCache validation', () => {
      const mockEmit = ((_event: string | symbol, ..._args: any[]): boolean => true) as EventEmitter['emit'];
      const clientSideCacheConfig = { ttl: 0, maxEntries: 0 };
      const rootNodes: Array<RedisClusterClientOptions> = [
        { socket: { host: 'localhost', port: 30001 } }
      ];

      it('should throw error when clientSideCache is enabled with RESP 2', () => {
        assert.throws(
          () => new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
            RESP: 2 as const,
          }, mockEmit),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should throw error when clientSideCache is enabled with RESP undefined', () => {
        assert.throws(
          () => new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
          }, mockEmit),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should not throw when clientSideCache is enabled with RESP 3', () => {
        assert.doesNotThrow(() =>
          new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
            RESP: 3 as const,
          }, mockEmit)
        );
      });
    });
  });

  describe('getRandomNode', ()=> {
    it('should not enter infinite loop when no nodes', () => {
        const slots = new RedisClusterSlots({
          rootNodes: []
        }, () => true)
        slots.getRandomNode()
        slots.getRandomNode()
      });
  });
});
