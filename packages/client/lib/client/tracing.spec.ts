import { strict as assert } from 'node:assert';
import dc from 'node:diagnostics_channel';
import testUtils, { GLOBAL } from '../test-utils';
import { sanitizeArgs } from './tracing';

describe('sanitizeArgs', () => {
  // Empty / edge cases
  it('should return empty array for empty args', () => {
    assert.deepEqual([...sanitizeArgs([])], []);
  });

  it('should return command name only for command with no arguments', () => {
    assert.deepEqual([...sanitizeArgs(['PING'])], ['PING']);
  });

  // args=0: command name only
  it('should redact all args for ECHO', () => {
    assert.deepEqual(
      [...sanitizeArgs(['ECHO', 'hello world'])],
      ['ECHO', '?']
    );
  });

  // args=1: key only
  it('should keep key but redact value for SET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['SET', 'user:123', 'hunter2'])],
      ['SET', 'user:123', '?']
    );
  });

  it('should keep key but redact value for SET with flags', () => {
    assert.deepEqual(
      [...sanitizeArgs(['SET', 'key', 'secret', 'EX', '300', 'NX'])],
      ['SET', 'key', '?', '?', '?', '?']
    );
  });

  it('should keep key but redact value for SETEX (prefix match on SET)', () => {
    assert.deepEqual(
      [...sanitizeArgs(['SETEX', 'key', '300', 'secret'])],
      ['SETEX', 'key', '?', '?']
    );
  });

  it('should keep key but redact values for LPUSH with multiple elements', () => {
    assert.deepEqual(
      [...sanitizeArgs(['LPUSH', 'mylist', 'a', 'b', 'c'])],
      ['LPUSH', 'mylist', '?', '?', '?']
    );
  });

  it('should keep key but redact message for PUBLISH', () => {
    assert.deepEqual(
      [...sanitizeArgs(['PUBLISH', 'channel', 'secret message'])],
      ['PUBLISH', 'channel', '?']
    );
  });

  it('should keep key but redact values for MSET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['MSET', 'k1', 'v1', 'k2', 'v2'])],
      ['MSET', 'k1', '?', '?', '?']
    );
  });

  it('should keep key but redact member and score for ZADD', () => {
    assert.deepEqual(
      [...sanitizeArgs(['ZADD', 'myzset', '1', 'member1'])],
      ['ZADD', 'myzset', '?', '?']
    );
  });

  it('should keep key but redact fields and values for XADD', () => {
    assert.deepEqual(
      [...sanitizeArgs(['XADD', 'stream', '*', 'field', 'value'])],
      ['XADD', 'stream', '?', '?', '?']
    );
  });

  // args=2: key + field
  it('should keep key and field but redact value for HSET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['HSET', 'hash', 'field', 'secret'])],
      ['HSET', 'hash', 'field', '?']
    );
  });

  it('should keep key and field but redact remaining for HMSET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['HMSET', 'hash', 'f1', 'v1', 'f2', 'v2'])],
      ['HMSET', 'hash', 'f1', '?', '?', '?']
    );
  });

  it('should keep key and index but redact value for LSET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['LSET', 'mylist', '0', 'newvalue'])],
      ['LSET', 'mylist', '0', '?']
    );
  });

  it('should keep key and pivot position for LINSERT', () => {
    assert.deepEqual(
      [...sanitizeArgs(['LINSERT', 'mylist', 'BEFORE', 'pivot', 'newvalue'])],
      ['LINSERT', 'mylist', 'BEFORE', '?', '?']
    );
  });

  // args=-1: all args visible
  it('should show all args for GET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['GET', 'user:123'])],
      ['GET', 'user:123']
    );
  });

  it('should show all args for DEL', () => {
    assert.deepEqual(
      [...sanitizeArgs(['DEL', 'key1', 'key2', 'key3'])],
      ['DEL', 'key1', 'key2', 'key3']
    );
  });

  it('should show all args for SUBSCRIBE', () => {
    assert.deepEqual(
      [...sanitizeArgs(['SUBSCRIBE', 'ch1', 'ch2'])],
      ['SUBSCRIBE', 'ch1', 'ch2']
    );
  });

  it('should show all args for CONFIG GET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['CONFIG', 'GET', 'maxmemory'])],
      ['CONFIG', 'GET', 'maxmemory']
    );
  });

  it('should show all args for EVAL', () => {
    assert.deepEqual(
      [...sanitizeArgs(['EVAL', 'return 1', '0'])],
      ['EVAL', 'return 1', '0']
    );
  });

  it('should show all args for HMGET', () => {
    assert.deepEqual(
      [...sanitizeArgs(['HMGET', 'hash', 'f1', 'f2'])],
      ['HMGET', 'hash', 'f1', 'f2']
    );
  });

  // Default: command name only
  it('should redact all args for AUTH (unlisted, falls to default)', () => {
    assert.deepEqual(
      [...sanitizeArgs(['AUTH', 'password123'])],
      ['AUTH', '?']
    );
  });

  it('should redact all args for AUTH with username', () => {
    assert.deepEqual(
      [...sanitizeArgs(['AUTH', 'user', 'password123'])],
      ['AUTH', '?', '?']
    );
  });

  it('should redact all args for HELLO with auth', () => {
    assert.deepEqual(
      [...sanitizeArgs(['HELLO', '3', 'AUTH', 'user', 'pass'])],
      ['HELLO', '?', '?', '?', '?']
    );
  });

  it('should redact all args for unknown/custom commands', () => {
    assert.deepEqual(
      [...sanitizeArgs(['CUSTOMCMD', 'arg1', 'arg2'])],
      ['CUSTOMCMD', '?', '?']
    );
  });

  // Case insensitivity
  it('should be case-insensitive for command matching', () => {
    assert.deepEqual(
      [...sanitizeArgs(['set', 'key', 'value'])],
      ['set', 'key', '?']
    );
    assert.deepEqual(
      [...sanitizeArgs(['get', 'key'])],
      ['get', 'key']
    );
    assert.deepEqual(
      [...sanitizeArgs(['hSet', 'hash', 'field', 'value'])],
      ['hSet', 'hash', 'field', '?']
    );
  });

  // Non-string args (Buffer, number)
  it('should stringify non-string args', () => {
    assert.deepEqual(
      [...sanitizeArgs(['GET', Buffer.from('key')])],
      ['GET', String(Buffer.from('key'))]
    );
  });

  it('should stringify numeric args', () => {
    assert.deepEqual(
      [...sanitizeArgs(['DEL', 42])],
      ['DEL', '42']
    );
  });
});

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

        // SET: value redacted
        const setStart = startEvents[0].context;
        assert.equal(setStart.command, 'SET');
        assert.deepEqual([...setStart.args], ['SET', 'tracing-test', '?']);
        assert.equal(typeof setStart.database, 'number');
        assert.equal(typeof setStart.serverAddress, 'string');
        assert.equal(typeof setStart.clientId, 'string');
        assert.ok(setStart.clientId.length > 0);

        // GET: all args visible
        const getStart = startEvents[1].context;
        assert.equal(getStart.command, 'GET');
        assert.deepEqual([...getStart.args], ['GET', 'tracing-test']);

        // Verify asyncEnd has same context reference
        const setEnd = asyncEndEvents[0].context;
        assert.equal(setEnd.command, 'SET');

        const getEnd = asyncEndEvents[1].context;
        assert.equal(getEnd.command, 'GET');
      } finally {
        dc.unsubscribe('tracing:node-redis:command:start', onStart);
        dc.unsubscribe('tracing:node-redis:command:asyncEnd', onAsyncEnd);
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should sanitize sensitive command arguments', async client => {
      const events: Array<any> = [];

      const onStart = (message: any) => {
        events.push(message);
      };

      dc.subscribe('tracing:node-redis:command:start', onStart);

      try {
        await client.set('key', 'secret-value');
        await client.hSet('hash', 'field', 'secret');
        await client.get('key');
        await client.del('key');

        // SET: args=1, key visible, value redacted
        assert.deepEqual([...events[0].args], ['SET', 'key', '?']);

        // HSET: args=2, key+field visible, value redacted
        assert.deepEqual([...events[1].args], ['HSET', 'hash', 'field', '?']);

        // GET: args=-1, all visible
        assert.deepEqual([...events[2].args], ['GET', 'key']);

        // DEL: args=-1, all visible
        assert.deepEqual([...events[3].args], ['DEL', 'key']);
      } finally {
        dc.unsubscribe('tracing:node-redis:command:start', onStart);
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

    testUtils.testWithClient('should trace MULTI as a single batch operation', async client => {
      const batchStartEvents: Array<any> = [];
      const commandStartEvents: Array<any> = [];

      const onBatchStart = (message: any) => {
        batchStartEvents.push(message);
      };
      const onCommandStart = (message: any) => {
        commandStartEvents.push(message);
      };

      dc.subscribe('tracing:node-redis:batch:start', onBatchStart);
      dc.subscribe('tracing:node-redis:command:start', onCommandStart);

      try {
        await client.multi()
          .set('multi-key-1', 'val1')
          .set('multi-key-2', 'val2')
          .get('multi-key-1')
          .exec();

        // MULTI is traced as a single batch, not per-command
        assert.equal(batchStartEvents.length, 1);
        assert.equal(batchStartEvents[0].batchMode, 'MULTI');
        assert.equal(batchStartEvents[0].batchSize, 3);
        assert.equal(typeof batchStartEvents[0].clientId, 'string');

        // No per-command traces for MULTI
        const multiCommandEvents = commandStartEvents.filter((e: any) => e.batchMode === 'MULTI');
        assert.equal(multiCommandEvents.length, 0);
      } finally {
        dc.unsubscribe('tracing:node-redis:batch:start', onBatchStart);
        dc.unsubscribe('tracing:node-redis:command:start', onCommandStart);
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
      // No subscribers: should not error
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
        assert.equal(typeof startEvents[0].clientId, 'string');
        assert.ok(startEvents[0].clientId.length > 0);

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
        if (badClient.isOpen) {
          await badClient.destroy();
        }
      }
    }, GLOBAL.SERVERS.OPEN);
  });
});
