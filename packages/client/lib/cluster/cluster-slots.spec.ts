import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { RedisClusterClientOptions } from './index';
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

    describe('topologyRefreshAfterReconnects validation', () => {
      const mockEmit = ((_event: string | symbol, ..._args: any[]): boolean => true) as EventEmitter['emit'];
      const rootNodes: Array<RedisClusterClientOptions> = [
        { socket: { host: 'localhost', port: 30001 } }
      ];

      for (const topologyRefreshAfterReconnects of [0, -1, 1.5, Number.NaN]) {
        it(`should throw when topologyRefreshAfterReconnects is ${topologyRefreshAfterReconnects}`, () => {
          assert.throws(
            () => new RedisClusterSlots({
              rootNodes,
              topologyRefreshAfterReconnects,
            }, mockEmit),
            new Error('topologyRefreshAfterReconnects must be a positive integer')
          );
        });
      }

      it('should allow positive integer topologyRefreshAfterReconnects', () => {
        assert.doesNotThrow(() =>
          new RedisClusterSlots({
            rootNodes,
            topologyRefreshAfterReconnects: 1,
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
