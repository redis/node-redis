import { strict as assert } from 'node:assert';
import { Buffer } from 'node:buffer';
import { testUtils, GLOBAL } from '../test-utils';
import { InterceptorDescription, RedisProxy } from './redis-proxy';
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

    }, GLOBAL.SERVERS.OPEN_RESP_3);

  describe("Middleware", () => {
    testUtils.testWithProxiedClient(
      "Modify request/response via middleware",
      async (
        proxiedClient: RedisClientType<any, any, any, any, any>,
        proxy: RedisProxy,
      ) => {

        // Intercept PING commands and modify the response
        const pingInterceptor: InterceptorDescription = {
          name: `ping`,
          fn: async (data, next) => {
            if (data.includes('PING')) {
              return Buffer.from("+PINGINTERCEPTED\r\n");
            }
            return next(data);
          }
        };

        // Only intercept GET responses and double numeric values
        // Does not modify other commands or non-numeric GET responses
        const doubleNumberGetInterceptor: InterceptorDescription = {
          name: `double-number-get`,
          fn: async (data, next) => {
            const response = await next(data);

            // Not a GET command, return original response
            if (!data.includes("GET")) return response;

            const value = (response.toString().split("\r\n"))[1];
            const number = Number(value);
            // Not a number, return original response
            if(isNaN(number)) return response;

            const doubled = String(number * 2);
            return Buffer.from(`$${doubled.length}\r\n${doubled}\r\n`);
          }
        };

        proxy.setGlobalInterceptors([ pingInterceptor, doubleNumberGetInterceptor ])

        const pingResponse = await proxiedClient.ping();
        assert.equal(pingResponse, 'PINGINTERCEPTED', 'Response should be modified by middleware');

        await proxiedClient.set('foo', 1);
        const getResponse1 = await proxiedClient.get('foo');
        assert.equal(getResponse1, '2', 'GET response should be doubled for numbers by middleware');

        await proxiedClient.set('bar', 'Hi');
        const getResponse2 = await proxiedClient.get('bar');
        assert.equal(getResponse2, 'Hi', 'GET response should not be modified for strings by middleware');

        await proxiedClient.hSet('baz', 'foo', 'dictvalue');
        const hgetResponse = await proxiedClient.hGet('baz', 'foo');
        assert.equal(hgetResponse, 'dictvalue', 'HGET response should not be modified by middleware');

      },
      GLOBAL.SERVERS.OPEN_RESP_3,
    );

    testUtils.testWithProxiedClient(
      "Stats reflect middleware activity",
      async (
        proxiedClient: RedisClientType<any, any, any, any, any>,
        proxy: RedisProxy,
      ) => {
        const PING = `ping`;
        const SKIPPED = `skipped`;
        proxy.setGlobalInterceptors([
          {
            name: PING,
            matchLimit: 3,
            fn: async (data, next, state) => {
              state.invokeCount++;
              if(state.matchCount === state.matchLimit) return next(data);
              if (data.includes("PING")) {
                state.matchCount++;
                return Buffer.from("+PINGINTERCEPTED\r\n");
              }
              return next(data);
            },
          },
          {
            name: SKIPPED,
            fn: async (data, next, state) => {
              state.invokeCount++;
              state.matchCount++;
              // This interceptor does not match anything
              return next(data);
            },
          },
        ]);

        await proxiedClient.ping();
        await proxiedClient.ping();
        await proxiedClient.ping();

        let stats = proxy.getStats();
        let pingInterceptor = stats.globalInterceptors.find(
          (i) => i.name === PING,
        );
        assert.ok(pingInterceptor, "PING interceptor stats should be present");
        assert.equal(pingInterceptor.invokeCount, 3);
        assert.equal(pingInterceptor.matchCount, 3);

        let skipInterceptor = stats.globalInterceptors.find(
          (i) => i.name === SKIPPED,
        );
        assert.ok(skipInterceptor, "SKIPPED interceptor stats should be present");
        assert.equal(skipInterceptor.invokeCount, 0);
        assert.equal(skipInterceptor.matchCount, 0);

        await proxiedClient.set("foo", "bar");
        await proxiedClient.get("foo");

        stats = proxy.getStats();
        pingInterceptor = stats.globalInterceptors.find(
          (i) => i.name === PING,
        );
        assert.ok(pingInterceptor, "PING interceptor stats should be present");
        assert.equal(pingInterceptor.invokeCount, 5);
        assert.equal(pingInterceptor.matchCount, 3);

        await proxiedClient.ping();

        stats = proxy.getStats();
        pingInterceptor = stats.globalInterceptors.find(
          (i) => i.name === PING,
        );
        assert.ok(pingInterceptor, "PING interceptor stats should be present");
        assert.equal(pingInterceptor.invokeCount, 6);
        assert.equal(pingInterceptor.matchCount, 3, 'Should not match more than limit');

        skipInterceptor = stats.globalInterceptors.find(
          (i) => i.name === SKIPPED,
        );
        assert.ok(skipInterceptor, "PING interceptor stats should be present");
        assert.equal(skipInterceptor.invokeCount, 3);
        assert.equal(skipInterceptor.matchCount, 3);
      },
      GLOBAL.SERVERS.OPEN_RESP_3,
    );

    testUtils.testWithProxiedClient(
      "Middleware is given exactly one RESP message at a time",
      async (
        proxiedClient: RedisClientType<any, any, any, any, any>,
        proxy: RedisProxy,
      ) => {
        proxy.setGlobalInterceptors([
          {
            name: `ping`,
            fn: async (data, next, state) => {
              state.invokeCount++;
              if (data.equals(Buffer.from("*1\r\n$4\r\nPING\r\n"))) {
                state.matchCount++;
              }
              return next(data);
            },
          },
        ]);

        await Promise.all([proxiedClient.ping(), proxiedClient.ping()]);

        const stats = proxy.getStats();
        const pingInterceptor = stats.globalInterceptors.find(
          (i) => i.name === `ping`,
        );
        assert.ok(pingInterceptor, "PING interceptor stats should be present");
        assert.equal(pingInterceptor.invokeCount, 2);
        assert.equal(pingInterceptor.matchCount, 2);
      },
      GLOBAL.SERVERS.OPEN_RESP_3,
    );

    testUtils.testWithProxiedClient(
      "Proxy passes through push messages",
      async (
        proxiedClient: RedisClientType<any, any, any, any, any>,
        proxy: RedisProxy,
      ) => {
        let resolve: (value: string) => void;
        const promise = new Promise((rs) => { resolve = rs; });
        await proxiedClient.subscribe("test-push-channel", (message) => {
          resolve(message);
        });

        await proxiedClient.publish("test-push-channel", "hello");
        const result = await promise;
        assert.equal(result, "hello", "Should receive push message through proxy");
      },
      {
        ...GLOBAL.SERVERS.OPEN_RESP_3,
        clientOptions: {
          maintNotifications: 'disabled',
          disableClientInfo: true,
          RESP: 3
        }
      },
    );
  });


});
