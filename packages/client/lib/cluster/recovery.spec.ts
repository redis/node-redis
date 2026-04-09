import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import { stub } from 'sinon';
import RedisClient from '../client';
import RedisClusterSlots from './cluster-slots';
import { RedisClusterClientOptions } from './index';

type ClusterSlotsReply = Array<{
  from: number;
  to: number;
  master: {
    host: string;
    port: number;
    id: string;
  };
  replicas: Array<{
    host: string;
    port: number;
    id: string;
  }>;
}>;

class FakeRedisClient extends EventEmitter {
  readonly options;
  readonly #getShards;
  readonly #readyOnConnect;
  #isReady = false;
  destroyed = false;

  constructor(
    options: unknown,
    getShards: () => ClusterSlotsReply,
    readyOnConnect = true
  ) {
    super();
    this.options = options;
    this.#getShards = getShards;
    this.#readyOnConnect = readyOnConnect;
    this
      .on('ready', () => {
        this.#isReady = true;
      })
      .on('reconnecting', () => {
        this.#isReady = false;
      })
      .on('end', () => {
        this.#isReady = false;
      });
  }

  _setIdentity() {
    // No-op for tests.
  }

  get isReady() {
    return this.#isReady;
  }

  async connect() {
    this.emit('connect');
    if (this.#readyOnConnect) {
      this.emit('ready');
    }
    return this as any;
  }

  async clusterSlots() {
    return this.#getShards();
  }

  destroy() {
    this.destroyed = true;
    this.emit('end');
    return this;
  }

  getPubSubListeners() {
    return new Map();
  }
}

describe('RedisClusterSlots recovery', () => {
  const rootNodes: Array<RedisClusterClientOptions> = [
    { socket: { host: '127.0.0.1', port: 7000 } }
  ];

  function createShards(addresses: Array<string>): ClusterSlotsReply {
    const slotSize = Math.floor(16384 / addresses.length);

    return addresses.map((address, index) => {
      const [host, port] = address.split(':');
      return {
        from: index * slotSize,
        to: index === addresses.length - 1 ? 16383 : ((index + 1) * slotSize) - 1,
        master: {
          host,
          port: Number(port),
          id: address
        },
        replicas: []
      };
    });
  }

  function createHarness(
    initialAddresses = ['127.0.0.1:7001'],
    {
      clusterOptions = {},
      readyOnConnectAddresses = initialAddresses
    }: {
      clusterOptions?: any;
      readyOnConnectAddresses?: Array<string>;
    } = {}
  ) {
    let currentAddresses = initialAddresses;
    let discoveryCalls = 0;
    const discoveryPorts: number[] = [];
    const clients: FakeRedisClient[] = [];
    const readyAddresses = new Set(readyOnConnectAddresses);
    const factoryStub = stub(RedisClient, 'factory').callsFake(() => {
      return ((clientOptions?: any) => {
        const address = `${clientOptions.socket.host}:${clientOptions.socket.port}`;
        const client = new FakeRedisClient(
          clientOptions,
          () => {
            discoveryCalls++;
            discoveryPorts.push(clientOptions.socket.port);
            return createShards(currentAddresses);
          },
          readyAddresses.has(address)
        );

        clients.push(client);
        return client as any;
      }) as any;
    });

    const slots = new RedisClusterSlots({
      rootNodes,
      ...clusterOptions
    }, (() => true) as any, 'cluster-id');

    return {
      clients,
      slots,
      restore() {
        factoryStub.restore();
      },
      getDiscoveryCalls() {
        return discoveryCalls;
      },
      getDiscoveryPorts() {
        return discoveryPorts;
      },
      setCurrentAddresses(addresses: Array<string>) {
        currentAddresses = addresses;
      }
    };
  }

  it('should trigger a topology refresh after repeated reconnects from a ready node', async () => {
    const harness = createHarness();

    try {
      await harness.slots.connect();
      assert.equal(harness.getDiscoveryCalls(), 1);

      const node = harness.slots.nodeByAddress.get('127.0.0.1:7001')!;
      const client = node.client as unknown as FakeRedisClient;

      client.emit('reconnecting');
      client.emit('reconnecting');
      await setImmediate();
      assert.equal(harness.getDiscoveryCalls(), 1);

      client.emit('reconnecting');
      await setImmediate();
      assert.equal(harness.getDiscoveryCalls(), 2);
    } finally {
      harness.restore();
    }
  });

  it('should reset the reconnect threshold after the node becomes ready again', async () => {
    const harness = createHarness();

    try {
      await harness.slots.connect();

      const node = harness.slots.nodeByAddress.get('127.0.0.1:7001')!;
      const client = node.client as unknown as FakeRedisClient;

      client.emit('reconnecting');
      client.emit('reconnecting');
      client.emit('ready');
      client.emit('reconnecting');
      client.emit('reconnecting');
      await setImmediate();
      assert.equal(harness.getDiscoveryCalls(), 1);

      client.emit('reconnecting');
      await setImmediate();
      assert.equal(harness.getDiscoveryCalls(), 2);
    } finally {
      harness.restore();
    }
  });

  it('should prefer healthy known nodes over the reconnecting node and root nodes', async () => {
    const randomStub = stub(Math, 'random').returns(0);
    const harness = createHarness([
      '127.0.0.1:7001',
      '127.0.0.1:7002'
    ]);

    try {
      await harness.slots.connect();
      assert.deepEqual(harness.getDiscoveryPorts(), [7000]);

      const suspectNode = harness.slots.nodeByAddress.get('127.0.0.1:7001')!;
      const suspectClient = suspectNode.client as unknown as FakeRedisClient;

      suspectClient.emit('reconnecting');
      suspectClient.emit('reconnecting');
      suspectClient.emit('reconnecting');
      await setImmediate();

      assert.deepEqual(harness.getDiscoveryPorts(), [7000, 7002]);
    } finally {
      harness.restore();
      randomStub.restore();
    }
  });

  it('should always probe ready known nodes before deferred ones', async () => {
    const randomStub = stub(Math, 'random').returns(0.99);
    const harness = createHarness(
      [
        '127.0.0.1:7001',
        '127.0.0.1:7002',
        '127.0.0.1:7003'
      ],
      {
        readyOnConnectAddresses: [
          '127.0.0.1:7001',
          '127.0.0.1:7002'
        ]
      }
    );

    try {
      await harness.slots.connect();
      assert.deepEqual(harness.getDiscoveryPorts(), [7000]);

      const suspectNode = harness.slots.nodeByAddress.get('127.0.0.1:7001')!;
      const suspectClient = suspectNode.client as unknown as FakeRedisClient;

      suspectClient.emit('reconnecting');
      suspectClient.emit('reconnecting');
      suspectClient.emit('reconnecting');
      await setImmediate();

      assert.deepEqual(harness.getDiscoveryPorts(), [7000, 7002]);
    } finally {
      harness.restore();
      randomStub.restore();
    }
  });
});
