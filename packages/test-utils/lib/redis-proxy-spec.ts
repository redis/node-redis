import { strict as assert } from 'node:assert';
import { Buffer } from 'node:buffer';
import { testUtils, GLOBAL } from './test-utils';
import { RedisProxy } from './redis-proxy';
import type { RedisClientType } from '@redis/client/lib/client/index.js';

describe('RedisSocketProxy', function () {
  testUtils.testWithClient('basic proxy functionality', async (client: RedisClientType<any, any, any, any, any>) => {
    const socketOptions = client?.options?.socket;
    //@ts-ignore
    assert(socketOptions?.port, 'Test requires a TCP connection to Redis');

    const proxyPort = 50000 + Math.floor(Math.random() * 10000);
    const proxy = new RedisProxy({
      listenHost: '127.0.0.1',
      listenPort: proxyPort,
      //@ts-ignore
      targetPort: socketOptions.port,
      //@ts-ignore
      targetHost: socketOptions.host || '127.0.0.1',
      enableLogging: true
    });

    const proxyEvents = {
      connections: [] as any[],
      dataTransfers: [] as any[]
    };

    proxy.on('connection', (connectionInfo) => {
      proxyEvents.connections.push(connectionInfo);
    });

    proxy.on('data', (connectionId, direction, data) => {
      proxyEvents.dataTransfers.push({ connectionId, direction, dataLength: data.length });
    });

    try {
      await proxy.start();

      const proxyClient = client.duplicate({
        socket: {
          port: proxyPort,
          host: '127.0.0.1'
        },
      });

      await proxyClient.connect();

      const stats = proxy.getStats();
      assert.equal(stats.activeConnections, 1, 'Should have one active connection');
      assert.equal(proxyEvents.connections.length, 1, 'Should have recorded one connection event');

      const pingResult = await proxyClient.ping();
      assert.equal(pingResult, 'PONG', 'Client should be able to communicate with Redis through the proxy');

      const clientToServerTransfers = proxyEvents.dataTransfers.filter(t => t.direction === 'client->server');
      const serverToClientTransfers = proxyEvents.dataTransfers.filter(t => t.direction === 'server->client');

      assert(clientToServerTransfers.length > 0, 'Should have client->server data transfers');
      assert(serverToClientTransfers.length > 0, 'Should have server->client data transfers');

      const testKey = `test:proxy:${Date.now()}`;
      const testValue = 'proxy-test-value';

      await proxyClient.set(testKey, testValue);
      const retrievedValue = await proxyClient.get(testKey);
      assert.equal(retrievedValue, testValue, 'Should be able to set and get values through proxy');

      proxyClient.destroy();


    } finally {
      await proxy.stop();
    }
  }, GLOBAL.SERVERS.OPEN_RESP_3);

  testUtils.testWithProxiedClient('custom message injection via proxy client',
    async (proxiedClient: RedisClientType<any, any, any, any, any>, proxy: RedisProxy) => {
      const customMessageTransfers: any[] = [];

      proxy.on('data', (connectionId, direction, data) => {
        if (direction === 'server->client') {
          customMessageTransfers.push({ connectionId, dataLength: data.length, data });
        }
      });


      const stats = proxy.getStats();
      assert.equal(stats.activeConnections, 1, 'Should have one active connection');

      // Send a resp3 push
      const customMessage = Buffer.from('>4\r\n$6\r\nMOVING\r\n:1\r\n:2\r\n$6\r\nhost:3\r\n');

      const sendResults = proxy.sendToAllClients(customMessage);
      assert.equal(sendResults.length, 1, 'Should send to one client');
      assert.equal(sendResults[0].success, true, 'Custom message send should succeed');


      const customMessageFound = customMessageTransfers.find(transfer =>
        transfer.dataLength === customMessage.length
      );
      assert(customMessageFound, 'Should have recorded the custom message transfer');

      assert.equal(customMessageFound.dataLength, customMessage.length,
        'Custom message length should match');

      const pingResult = await proxiedClient.ping();
      assert.equal(pingResult, 'PONG', 'Client should be able to communicate with Redis through the proxy');

    }, GLOBAL.SERVERS.OPEN_RESP_3)
});
