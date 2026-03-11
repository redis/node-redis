import { strict as assert } from 'node:assert';
import dc from 'node:diagnostics_channel';
import testUtils, { GLOBAL } from '../test-utils';

const hasTracingChannel = typeof dc.tracingChannel === 'function';

(hasTracingChannel ? describe : describe.skip)('Tracing Channel', () => {
  describe('node-redis:command', () => {
    testUtils.testWithClient('should trace a standalone command', async client => {
      const events: Array<{ name: string; context: any }> = [];

      const onStart = (message: any) => {
        events.push({ name: 'start', context: message });
      };
      const onAsyncEnd = (message: any) => {
        events.push({ name: 'asyncEnd', context: message });
      };

      dc.subscribe('tracing:node-redis:command:start', onStart);
      dc.subscribe('tracing:node-redis:command:asyncEnd', onAsyncEnd);

      try {
        await client.set('tracing-test', 'value');
        await client.get('tracing-test');

        const startEvents = events.filter(e => e.name === 'start');
        const asyncEndEvents = events.filter(e => e.name === 'asyncEnd');

        assert.equal(startEvents.length, 2);
        assert.equal(asyncEndEvents.length, 2);

        // Verify SET command context
        const setStart = startEvents[0].context;
        assert.equal(setStart.command, 'SET');
        assert.deepEqual([...setStart.args], ['SET', 'tracing-test', 'value']);
        assert.equal(typeof setStart.database, 'number');
        assert.equal(typeof setStart.serverAddress, 'string');
        assert.equal(typeof setStart.serverPort, 'number');

        // Verify GET command context
        const getStart = startEvents[1].context;
        assert.equal(getStart.command, 'GET');
        assert.deepEqual([...getStart.args], ['GET', 'tracing-test']);

        // Verify asyncEnd has result
        const setEnd = asyncEndEvents[0].context;
        assert.equal(setEnd.command, 'SET');

        const getEnd = asyncEndEvents[1].context;
        assert.equal(getEnd.command, 'GET');
      } finally {
        dc.unsubscribe('tracing:node-redis:command:start', onStart);
        dc.unsubscribe('tracing:node-redis:command:asyncEnd', onAsyncEnd);
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should trace command errors', async client => {
      const errors: Array<any> = [];

      const onError = (message: any) => {
        errors.push(message);
      };

      dc.subscribe('tracing:node-redis:command:error', onError);

      try {
        // SET a string value, then try LPUSH on same key (wrong type)
        await client.set('tracing-error-test', 'value');
        try {
          await client.lPush('tracing-error-test', 'item');
        } catch {
          // expected
        }

        assert.equal(errors.length, 1);
        assert.equal(errors[0].command, 'LPUSH');
      } finally {
        dc.unsubscribe('tracing:node-redis:command:error', onError);
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should trace MULTI commands with batch context', async client => {
      const startEvents: Array<any> = [];

      const onStart = (message: any) => {
        startEvents.push(message);
      };

      dc.subscribe('tracing:node-redis:command:start', onStart);

      try {
        await client.multi()
          .set('multi-key-1', 'val1')
          .set('multi-key-2', 'val2')
          .get('multi-key-1')
          .exec();

        const batchEvents = startEvents.filter((e: any) => e.batchMode === 'MULTI');
        assert.equal(batchEvents.length, 3);

        for (const event of batchEvents) {
          assert.equal(event.batchMode, 'MULTI');
          assert.equal(event.batchSize, 3);
        }

        assert.equal(batchEvents[0].command, 'SET');
        assert.equal(batchEvents[1].command, 'SET');
        assert.equal(batchEvents[2].command, 'GET');
      } finally {
        dc.unsubscribe('tracing:node-redis:command:start', onStart);
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should trace pipeline commands with batch context', async client => {
      const startEvents: Array<any> = [];

      const onStart = (message: any) => {
        startEvents.push(message);
      };

      dc.subscribe('tracing:node-redis:command:start', onStart);

      try {
        await client.multi()
          .set('pipe-key-1', 'val1')
          .get('pipe-key-1')
          .execAsPipeline();

        const batchEvents = startEvents.filter((e: any) => e.batchMode === 'PIPELINE');
        assert.equal(batchEvents.length, 2);

        for (const event of batchEvents) {
          assert.equal(event.batchMode, 'PIPELINE');
          assert.equal(event.batchSize, 2);
        }

        assert.equal(batchEvents[0].command, 'SET');
        assert.equal(batchEvents[1].command, 'GET');
      } finally {
        dc.unsubscribe('tracing:node-redis:command:start', onStart);
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should not emit events when there are no subscribers', async client => {
      // No subscribers registered — verify tracing code path doesn't error
      await client.ping();
    }, GLOBAL.SERVERS.OPEN);
  });

  describe('node-redis:connect', () => {
    testUtils.testWithClient('should trace client connection', async client => {
      const startEvents: Array<any> = [];
      const asyncEndEvents: Array<any> = [];

      const onStart = (message: any) => {
        startEvents.push(message);
      };
      const onAsyncEnd = (message: any) => {
        asyncEndEvents.push(message);
      };

      dc.subscribe('tracing:node-redis:connect:start', onStart);
      dc.subscribe('tracing:node-redis:connect:asyncEnd', onAsyncEnd);

      try {
        await client.connect();

        assert.equal(startEvents.length, 1);
        assert.equal(typeof startEvents[0].serverAddress, 'string');
        assert.equal(typeof startEvents[0].serverPort, 'number');

        assert.equal(asyncEndEvents.length, 1);
      } finally {
        dc.unsubscribe('tracing:node-redis:connect:start', onStart);
        dc.unsubscribe('tracing:node-redis:connect:asyncEnd', onAsyncEnd);
        if (client.isOpen) {
          await client.destroy();
        }
      }
    }, {
      ...GLOBAL.SERVERS.OPEN,
      disableClientSetup: true
    });

    testUtils.testWithClient('should trace connection errors', async client => {
      const errors: Array<any> = [];

      const onError = (message: any) => {
        errors.push(message);
      };

      dc.subscribe('tracing:node-redis:connect:error', onError);

      // Create a client pointing to a port that won't have Redis
      const badClient = client.duplicate({
        socket: {
          port: 1,
          host: '127.0.0.1',
          connectTimeout: 500,
          reconnectStrategy: false
        }
      });

      try {
        await badClient.connect();
      } catch {
        // expected
      }

      try {
        assert.equal(errors.length, 1);
        assert.equal(errors[0].serverAddress, '127.0.0.1');
        assert.equal(errors[0].serverPort, 1);
      } finally {
        dc.unsubscribe('tracing:node-redis:connect:error', onError);
        await badClient.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);
  });
});
