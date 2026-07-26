import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { RedisClusterClientOptions } from './index';
import RedisClusterSlots from './cluster-slots';

describe('RedisClusterSlots', () => {
  describe('initialization', () => {
    describe('clientSideCache validation', () => {
      const mockEmit: EventEmitter['emit'] = () => true;
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

      it('should not throw when clientSideCache is enabled with RESP undefined', () => {
        assert.doesNotThrow(() =>
          new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
          }, mockEmit)
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
        }, () => true, 'client-id')
        slots.getRandomNode()
        slots.getRandomNode()
      });

    it('should only return replica nodes when useReplicas is "only"', () => {
      const slots = new RedisClusterSlots({
        rootNodes: [],
        useReplicas: 'only'
      }, () => true, 'client-id');
      
      const masterNode = { address: '127.0.0.1:7000', host: '127.0.0.1', port: 7000, id: 'master', readonly: false };
      const replicaNode1 = { address: '127.0.0.1:7001', host: '127.0.0.1', port: 7001, id: 'replica1', readonly: true };
      const replicaNode2 = { address: '127.0.0.1:7002', host: '127.0.0.1', port: 7002, id: 'replica2', readonly: true };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal stub nodes
      slots.masters.push(masterNode as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal stub nodes
      slots.replicas.push(replicaNode1 as any, replicaNode2 as any);
      
      for (let i = 0; i < 20; i++) {
        const node = slots.getRandomNode();
        assert.notEqual(node.address, masterNode.address);
        assert.strictEqual(node.readonly, true);
      }
    });

    it('should only return replica nodes for a slot when useReplicas is "only"', () => {
      const slots = new RedisClusterSlots({
        rootNodes: [],
        useReplicas: 'only'
      }, () => true, 'client-id');
      
      const masterNode = { address: '127.0.0.1:7000', host: '127.0.0.1', port: 7000, id: 'master', readonly: false };
      const replicaNode1 = { address: '127.0.0.1:7001', host: '127.0.0.1', port: 7001, id: 'replica1', readonly: true };
      const replicaNode2 = { address: '127.0.0.1:7002', host: '127.0.0.1', port: 7002, id: 'replica2', readonly: true };
      
      slots.slots[0] = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal stub nodes
        master: masterNode as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal stub nodes
        replicas: [replicaNode1 as any, replicaNode2 as any]
      };
      
      for (let i = 0; i < 20; i++) {
        const node = slots.getSlotRandomNode(0);
        assert.notEqual(node.address, masterNode.address);
        assert.strictEqual(node.readonly, true);
      }
    });
  });
});
