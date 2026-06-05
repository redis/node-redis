import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, waitTillBeenCalled } from '../test-utils';
import RedisClient, { RedisClientOptions, RedisClientType } from '.';
import { AbortError, ClientClosedError, ClientOfflineError, ConnectionTimeoutError, DisconnectsClientError, ErrorReply, MultiErrorReply, TimeoutError, WatchError } from '../errors';
import { defineScript } from '../lua-script';
import { spy, stub } from 'sinon';
import EventEmitter, { once } from 'node:events';
import { MATH_FUNCTION, loadMathFunction } from '../commands/FUNCTION_LOAD.spec';
import { RESP_TYPES } from '../RESP/decoder';
import { BlobStringReply, NumberReply } from '../RESP/types';
import { SortedSetMember } from '../commands/generic-transformers';
import { HASH_EXPIRATION } from '../commands/HEXPIRE';
import { CommandParser } from './parser';
import { RedisSocketOptions } from './socket';
import { getFreePortNumber } from '@redis/test-utils/lib/proxy/redis-proxy';
import { createClient } from '../../';
import net from 'node:net'

export const SQUARE_SCRIPT = defineScript({
  SCRIPT:
    `local number = redis.call('GET', KEYS[1])
    return number * number`,
  NUMBER_OF_KEYS: 1,
  FIRST_KEY_INDEX: 0,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
});

describe('Client', () => {
  it('chained withCommandOptions(...).withTypeMapping(...) preserves earlier overrides at dispatch', () => {
    // Regression: `_commandOptionsProxy` used to layer `_commandOptions` via
    // `Object.create(this._commandOptions ?? null)`, which left earlier keys
    // (e.g. `asap`) on the prototype. At dispatch, `{...this._commandOptions, ...}`
    // only iterates *own* enumerable properties, so those inherited keys
    // silently disappeared in the spread.
    const client = RedisClient.create({});
    const proxy = client
      .withCommandOptions({ asap: true })
      .withTypeMapping({ [RESP_TYPES.SIMPLE_STRING]: Buffer });
    type WithOptions = { _commandOptions?: { asap?: boolean; typeMapping?: unknown } };
    const ownKeys = { ...(proxy as unknown as WithOptions)._commandOptions };
    assert.equal(ownKeys.asap, true);
    assert.deepEqual(ownKeys.typeMapping, { [RESP_TYPES.SIMPLE_STRING]: Buffer });
  });

  describe('default commandOptions', () => {
    type WithOptions = { _commandOptions?: { timeout?: number; asap?: boolean } };

    it('applies the 5s default timeout when no commandOptions are passed', () => {
      const client = RedisClient.create({});
      assert.equal((client as unknown as WithOptions)._commandOptions?.timeout, 5000);
    });

    it('merges the default timeout with a partial commandOptions override', () => {
      const client = RedisClient.create({ commandOptions: { asap: true } });
      const opts = (client as unknown as WithOptions)._commandOptions;
      assert.equal(opts?.timeout, 5000);
      assert.equal(opts?.asap, true);
    });

    it('allows opting out of the default timeout with `timeout: undefined`', () => {
      const client = RedisClient.create({ commandOptions: { timeout: undefined } });
      assert.equal((client as unknown as WithOptions)._commandOptions?.timeout, undefined);
    });

    it('preserves the default timeout through withCommandOptions(...)', () => {
      // Regression: `proxy._commandOptions = options` set the override as an own
      // property that shadowed the prototype's merged `_commandOptions`, dropping
      // the default at dispatch. The proxy must merge over the current effective
      // options instead.
      const client = RedisClient.create({});
      const proxy = client.withCommandOptions({ asap: true });
      const opts = (proxy as unknown as WithOptions)._commandOptions;
      assert.equal(opts?.timeout, 5000);
      assert.equal(opts?.asap, true);
    });

    it('lets withCommandOptions(...) opt out of the default timeout', () => {
      const client = RedisClient.create({});
      const proxy = client.withCommandOptions({ timeout: undefined });
      assert.equal((proxy as unknown as WithOptions)._commandOptions?.timeout, undefined);
    });
  });

  it('module/function namespaces resolve to the receiver, not the original', () => {
    // Regression: `attachNamespace` cached the namespace as an own property
    // on the receiver, leaking via the prototype chain into any
    // `withCommandOptions(...)` proxy. The proxy then dispatched module/function
    // commands through the original's `_self`, silently ignoring the override.
    const fakeModule = {
      noop: {
        parseCommand: () => {},
        transformReply: undefined as unknown as () => unknown
      }
    };
    const client = RedisClient.create({ modules: { fakeModule } });
    type WithNamespace = { fakeModule: { _self: unknown } };
    // Force the original to cache its namespace first — pre-fix this is what
    // poisoned every subsequent proxy access.
    const originalNamespace = (client as unknown as WithNamespace).fakeModule;
    assert.equal(originalNamespace._self, client);
    const proxy = client.withCommandOptions({});
    const proxyNamespace = (proxy as unknown as WithNamespace).fakeModule;
    assert.equal(proxyNamespace._self, proxy);
    assert.notEqual(proxyNamespace._self, client);
    // Per-receiver cache: subsequent accesses on the same receiver are stable.
    assert.equal((client as unknown as WithNamespace).fakeModule, originalNamespace);
    assert.equal((proxy as unknown as WithNamespace).fakeModule, proxyNamespace);
  });

  describe('initialization', () => {
    describe('clientSideCache validation', () => {
      const clientSideCacheConfig = { ttl: 0, maxEntries: 0 };

      it('should throw error when clientSideCache is enabled with RESP 2', () => {
        assert.throws(
          () => new RedisClient({
            clientSideCache: clientSideCacheConfig,
            RESP: 2,
          }),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should not throw when clientSideCache is enabled with RESP undefined', () => {
        assert.doesNotThrow(() =>
          new RedisClient({
            clientSideCache: clientSideCacheConfig,
          })
        );
      });

      it('should not throw when clientSideCache is enabled with RESP 3', () => {
        assert.doesNotThrow(() =>
          new RedisClient({
            clientSideCache: clientSideCacheConfig,
            RESP: 3,
          })
        );
      });
    });
  });

  describe('parseURL', () => {
    it('redis://user:secret@localhost:6379/0', async () => {
      const result = RedisClient.parseURL('redis://user:secret@localhost:6379/0');
      const expected: RedisClientOptions = {
        socket: {
          host: 'localhost',
          port: 6379,
          tls: false
        },
        username: 'user',
        password: 'secret',
        database: 0,
        credentialsProvider: {
          type: 'async-credentials-provider',
          credentials: async () => ({
            password: 'secret',
            username: 'user'
          })
        }
      };

      // Compare everything except the credentials function
      const { credentialsProvider: _resultCredProvider, ...resultRest } = result;
      const { credentialsProvider: _expectedCredProvider, ...expectedRest } = expected;

      // Compare non-function properties
      assert.deepEqual(resultRest, expectedRest);

      if (result?.credentialsProvider?.type === 'async-credentials-provider'
        && expected?.credentialsProvider?.type === 'async-credentials-provider') {

        // Compare the actual output of the credentials functions
        const resultCreds = await result.credentialsProvider?.credentials();
        const expectedCreds = await expected.credentialsProvider?.credentials();
        assert.deepEqual(resultCreds, expectedCreds);
      } else {
        assert.fail('Credentials provider type mismatch');
      }


    });

    it('rediss://user:secret@localhost:6379/0', async () => {
      const result = RedisClient.parseURL('rediss://user:secret@localhost:6379/0');
      const expected: RedisClientOptions = {
        socket: {
          host: 'localhost',
          port: 6379,
          tls: true
        },
        username: 'user',
        password: 'secret',
        database: 0,
        credentialsProvider: {
          credentials: async () => ({
            password: 'secret',
            username: 'user'
          }),
          type: 'async-credentials-provider'
        }
      };

      // Compare everything except the credentials function
      const { credentialsProvider: resultCredProvider, ...resultRest } = result;
      const { credentialsProvider: expectedCredProvider, ...expectedRest } = expected;

      // Compare non-function properties
      assert.deepEqual(resultRest, expectedRest);
      assert.equal(resultCredProvider?.type, expectedCredProvider?.type);

      if (result?.credentialsProvider?.type === 'async-credentials-provider' &&
        expected?.credentialsProvider?.type === 'async-credentials-provider') {

        // Compare the actual output of the credentials functions
        const resultCreds = await result.credentialsProvider.credentials();
        const expectedCreds = await expected.credentialsProvider.credentials();
        assert.deepEqual(resultCreds, expectedCreds);

      } else {
        assert.fail('Credentials provider type mismatch');
      }

    })

    it('Invalid protocol', () => {
      assert.throws(
        () => RedisClient.parseURL('redi://user:secret@localhost:6379/0'),
        TypeError
      );
    });

    it('Invalid pathname', () => {
      assert.throws(
        () => RedisClient.parseURL('redis://user:secret@localhost:6379/NaN'),
        TypeError
      );
    });

    it('redis://localhost', () => {
      assert.deepEqual(
        RedisClient.parseURL('redis://localhost'),
        {
          socket: {
            host: 'localhost',
            tls: false
          }
        }
      );
    });

    it('DB in URL should be parsed', async () => {
      const client = RedisClient.create({
        url: 'redis://user:secret@localhost:6379/5'
      });

      assert.equal(client?.options?.database, 5);
    });

    describe('should correctly parse IPv6 literals', () => {
      it('redis://[::1]:6379', () => {
        assert.deepEqual(
          RedisClient.parseURL('redis://[::1]:6379'),
          {
            socket: {
              host: '::1',
              port: 6379,
              tls: false
            }
          }
        );
      });

      it('redis://[2001:db8::1]:6379', () => {
        assert.deepEqual(
          RedisClient.parseURL('redis://[2001:db8::1]:6379'),
          {
            socket: {
              host: '2001:db8::1',
              port: 6379,
              tls: false
            }
          }
        );
      });

      it('rediss://[::1]:6379', () => {
        assert.deepEqual(
          RedisClient.parseURL('rediss://[::1]:6379'),
          {
            socket: {
              host: '::1',
              port: 6379,
              tls: true
            }
          }
        );
      });

      it('redis://[::1]', () => {
        assert.deepEqual(
          RedisClient.parseURL('redis://[::1]'),
          {
            socket: {
              host: '::1',
              tls: false
            }
          }
        );
      });

      it('redis://[::1]:6379/5', () => {
        assert.deepEqual(
          RedisClient.parseURL('redis://[::1]:6379/5'),
          {
            database: 5,
            socket: {
              host: '::1',
              port: 6379,
              tls: false,
            }
          }
        );
      });

      it('redis://user:secret@[::1]:6379', async () => {
        const result = RedisClient.parseURL('redis://user:secret@[::1]:6379');
        const expected: RedisClientOptions = {
          socket: {
            host: '::1',
            port: 6379,
            tls: false
          },
          username: 'user',
          password: 'secret',
          credentialsProvider: {
            credentials: async () => ({
              password: 'secret',
              username: 'user'
            }),
            type: 'async-credentials-provider'
          }
        };

        // Compare everything except the credentials function
        const { credentialsProvider: resultCredProvider, ...resultRest } = result;
        const { credentialsProvider: expectedCredProvider, ...expectedRest } = expected;

        // Compare non-function properties
        assert.deepEqual(resultRest, expectedRest);
        assert.equal(resultCredProvider?.type, expectedCredProvider?.type);

        if (result?.credentialsProvider?.type === 'async-credentials-provider' &&
          expected?.credentialsProvider?.type === 'async-credentials-provider') {

          // Compare the actual output of the credentials functions
          const resultCreds = await result.credentialsProvider.credentials();
          const expectedCreds = await expected.credentialsProvider.credentials();
          assert.deepEqual(resultCreds, expectedCreds);

        } else {
          assert.fail('Credentials provider type mismatch');
        }
      });
    });

    describe('unix socket URLs', () => {
      it('unix:///tmp/redis.sock', () => {
        assert.deepEqual(
          RedisClient.parseURL('unix:///tmp/redis.sock'),
          {
            socket: {
              path: '/tmp/redis.sock',
              tls: false
            }
          }
        );
      });

      it('unix:///tmp/redis.sock?db=2', () => {
        assert.deepEqual(
          RedisClient.parseURL('unix:///tmp/redis.sock?db=2'),
          {
            socket: {
              path: '/tmp/redis.sock',
              tls: false
            },
            database: 2
          }
        );
      });

      it('unix://user:secret@/tmp/redis.sock?db=2', async () => {
        const result = RedisClient.parseURL('unix://user:secret@/tmp/redis.sock?db=2');
        const expected: RedisClientOptions = {
          socket: {
            path: '/tmp/redis.sock',
            tls: false
          },
          username: 'user',
          password: 'secret',
          database: 2,
          credentialsProvider: {
            type: 'async-credentials-provider',
            credentials: async () => ({
              username: 'user',
              password: 'secret'
            })
          }
        };

        const { credentialsProvider: _r, ...resultRest } = result;
        const { credentialsProvider: _e, ...expectedRest } = expected;
        assert.deepEqual(resultRest, expectedRest);

        if (result.credentialsProvider?.type === 'async-credentials-provider'
          && expected.credentialsProvider?.type === 'async-credentials-provider') {
          assert.deepEqual(
            await result.credentialsProvider.credentials(),
            await expected.credentialsProvider.credentials()
          );
        } else {
          assert.fail('Credentials provider type mismatch');
        }
      });

      it('percent-encoded path is decoded', () => {
        assert.deepEqual(
          RedisClient.parseURL('unix:///var/run/redis%20test.sock'),
          {
            socket: {
              path: '/var/run/redis test.sock',
              tls: false
            }
          }
        );
      });

      it('missing path is rejected', () => {
        assert.throws(
          () => RedisClient.parseURL('unix://'),
          TypeError
        );
      });

      it('empty path is rejected', () => {
        assert.throws(
          () => RedisClient.parseURL('unix:///'),
          TypeError
        );
      });

      it('invalid db query parameter is rejected', () => {
        assert.throws(
          () => RedisClient.parseURL('unix:///tmp/redis.sock?db=NaN'),
          TypeError
        );
      });
    });
  });

  describe('parseOptions', () => {
    it('should throw error if tls socket option is set to true and the url protocol is "redis:"', () => {
      assert.throws(
        () => RedisClient.parseOptions({
          url: 'redis://localhost',
          socket: {
            tls: true
          }
        }),
        TypeError
      );
    });
    it('should throw error if tls socket option is set to false and the url protocol is "rediss:"', () => {
      assert.throws(
        () => RedisClient.parseOptions({
          url: 'rediss://localhost',
          socket: {
            tls: false
          }
        }),
        TypeError
      );
    });
    it('should not throw when tls socket option and url protocol matches"', () => {
      assert.equal(
        RedisClient.parseOptions({
          url: 'rediss://localhost',
          socket: {
            tls: true
          }
        }).socket.tls,
        true
      );
      assert.equal(
        RedisClient.parseOptions({
          url: 'redis://localhost',
          socket: {
            tls: false
          }
        }).socket.tls,
        false
      );
    });
  });

  describe('authentication', () => {
    testUtils.testWithClient('Client should be authenticated', async client => {
      assert.equal(
        await client.ping(),
        'PONG'
      );
    }, GLOBAL.SERVERS.PASSWORD);

    testUtils.testWithClient('Client can authenticate asynchronously ', async client => {
      assert.equal(
        await client.ping(),
        'PONG'
      );
    }, GLOBAL.SERVERS.ASYNC_BASIC_AUTH);

    testUtils.testWithClient('Client can authenticate using the streaming credentials provider for initial token acquisition',
      async client => {
        assert.equal(
          await client.ping(),
          'PONG'
        );
      }, GLOBAL.SERVERS.STREAMING_AUTH);

    testUtils.testWithClient('should execute AUTH before SELECT', async client => {
      assert.equal(
        (await client.clientInfo()).db,
        2
      );
    }, {
      ...GLOBAL.SERVERS.PASSWORD,
      clientOptions: {
        ...GLOBAL.SERVERS.PASSWORD.clientOptions,
        database: 2
      },
      minimumDockerVersion: [6, 2]
    });
  });

  testUtils.testWithClient('should set connection name', async client => {
    assert.equal(
      await client.clientGetName(),
      'name'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      name: 'name'
    }
  });

  // TODO: fix & uncomment
  // testUtils.testWithClient('connect, ready and end events', async client => {
  //   await Promise.all([
  //     once(client, 'connect'),
  //     once(client, 'ready'),
  //     client.connect()
  //   ]);

  //   await Promise.all([
  //     once(client, 'end'),
  //     client.close()
  //   ]);
  // }, {
  //   ...GLOBAL.SERVERS.OPEN,
  //   disableClientSetup: true
  // });

  describe('sendCommand', () => {
    testUtils.testWithClient('PING', async client => {
      assert.equal(await client.sendCommand(['PING']), 'PONG');
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('Unactivated AbortController should not abort', async client => {
      await client.sendCommand(['PING'], {
        abortSignal: new AbortController().signal
      });
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('AbortError', async client => {
        await blockSetImmediate(async () => {
          await assert.rejects(client.sendCommand(['PING'], {
            abortSignal: AbortSignal.timeout(5)
          }), AbortError);
        })
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('Timeout with custom timeout config', async client => {
      await blockSetImmediate(async () => {
        await assert.rejects(client.sendCommand(['PING'], {
          timeout: 5
        }), TimeoutError);
      })
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('Timeout with custom timeout config (cluster)', async cluster => {
      await blockSetImmediate(async () => {
        await assert.rejects(cluster.sendCommand(undefined, true, ['PING'], {
          timeout: 5
        }), TimeoutError);
      })
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithClientSentinel('Timeout with custom timeout config (sentinel)', async sentinel => {
      await blockSetImmediate(async () => {
        await assert.rejects(sentinel.sendCommand(true, ['PING'], {
          timeout: 5
        }), TimeoutError);
      })
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithClient('Timeout with global timeout config', async client => {
      await blockSetImmediate(async () => {
        await assert.rejects(client.ping(), TimeoutError);
        await assert.rejects(client.sendCommand(['PING']), TimeoutError);
      });
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        commandOptions: {
          timeout: 5
        }
      }
    });

    testUtils.testWithCluster('Timeout with global timeout config (cluster)', async cluster => {
      await blockSetImmediate(async () => {
        await assert.rejects(cluster.HSET('key', 'foo', 'value'), TimeoutError);
        await assert.rejects(cluster.sendCommand(undefined, true, ['PING']), TimeoutError);
      });
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        commandOptions: {
          timeout: 5
        }
      }
    });

    testUtils.testWithClientSentinel('Timeout with global timeout config (sentinel)', async sentinel => {
      await blockSetImmediate(async () => {
        await assert.rejects(sentinel.HSET('key', 'foo', 'value'), TimeoutError);
        await assert.rejects(sentinel.sendCommand(true, ['PING']), TimeoutError);
      });
    }, {
      ...GLOBAL.SENTINEL.OPEN,
      clientOptions: {
        commandOptions: {
          timeout: 5
        }
      }
    });

    testUtils.testWithClient('undefined and null should not break the client', async client => {
      await assert.rejects(
        // @ts-expect-error testing invalid inputs
        client.sendCommand([null, undefined]),
        TypeError
      );

      assert.equal(
        await client.ping(),
        'PONG'
      );
    }, GLOBAL.SERVERS.OPEN);
  });

  describe('multi', () => {
    testUtils.testWithClient('simple', async client => {
      assert.deepEqual(
        await client.multi()
          .ping()
          .set('key', 'value')
          .get('key')
          .exec(),
        ['PONG', 'OK', 'value']
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('multi sendCommand', async client => {
      assert.deepEqual(
        await client.multi()
          .sendCommand(['SET', 'key', 'value'])
          .sendCommand(['GET', 'key'])
          .exec(),
        ['OK', 'value']
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should reject the whole chain on error', client => {
      return assert.rejects(
        client.multi()
          .ping()
          .addCommand(['INVALID COMMAND'])
          .ping()
          .exec()
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should reject the whole chain upon client disconnect', async client => {
      await client.close();

      return assert.rejects(
        client.multi()
          .ping()
          .set('key', 'value')
          .get('key')
          .exec(),
        ClientClosedError
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with script', async client => {
      assert.deepEqual(
        await client.multi()
          .set('key', '2')
          .square('key')
          .exec(),
        ['OK', 4]
      );
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        scripts: {
          square: SQUARE_SCRIPT
        }
      }
    });

    testUtils.testWithClient('WatchError', async client => {
      await client.watch('key');

      const duplicate = await client.duplicate().connect();
      try {
        await client.set(
          'key',
          '1'
        );
      } finally {
        duplicate.destroy();
      }

      await assert.rejects(
        client.multi()
          .decr('key')
          .exec(),
        WatchError
      );
    }, GLOBAL.SERVERS.OPEN);

    describe('execAsPipeline', () => {
      testUtils.testWithClient('exec(true)', async client => {
        assert.deepEqual(
          await client.multi()
            .ping()
            .exec(true),
          ['PONG']
        );
      }, GLOBAL.SERVERS.OPEN);

      testUtils.testWithClient('empty execAsPipeline', async client => {
        assert.deepEqual(
          await client.multi().execAsPipeline(),
          []
        );
      }, GLOBAL.SERVERS.OPEN);
    });

    testUtils.testWithClient('should remember selected db', async client => {
      await client.multi()
        .select(1)
        .exec();
      await killClient(client);
      assert.equal(
        (await client.clientInfo()).db,
        1
      );
    }, {
      ...GLOBAL.SERVERS.OPEN,
      minimumDockerVersion: [6, 2] // CLIENT INFO
    });

    testUtils.testWithClient('should handle error replies (#2665)', async client => {
      await assert.rejects(
        client.multi()
          .set('key', 'value')
          .hGetAll('key')
          .exec(),
        err => {
          assert.ok(err instanceof MultiErrorReply);
          assert.equal(err.replies.length, 2);
          assert.deepEqual(err.errorIndexes, [1]);
          assert.ok(err.replies[1] instanceof ErrorReply);
          // @ts-expect-error its fine
          assert.deepEqual([...err.errors()], [err.replies[1]]);
          return true;
        }
      );
    }, GLOBAL.SERVERS.OPEN);
  });

  testUtils.testWithClient('scripts', async client => {
    const [, reply] = await Promise.all([
      client.set('key', '2'),
      client.square('key')
    ]);

    assert.equal(reply, 4);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      scripts: {
        square: SQUARE_SCRIPT
      }
    }
  });

  const module = {
    echo: {
      parseCommand(parser: CommandParser, message: string) {
        parser.push('ECHO', message);
      },
      transformReply: undefined as unknown as () => BlobStringReply
    }
  };

  testUtils.testWithClient('modules', async client => {
    assert.equal(
      await client.module.echo('message'),
      'message'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      modules: {
        module
      }
    }
  });

  testUtils.testWithClient('functions', async client => {
    const [, , reply] = await Promise.all([
      loadMathFunction(client),
      client.set('key', '2'),
      client.math.square('key')
    ]);

    assert.equal(reply, 4);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [7, 0],
    clientOptions: {
      functions: {
        math: MATH_FUNCTION.library
      }
    }
  });

  testUtils.testWithClient('duplicate should reuse command options', async client => {
    const duplicate = client.duplicate();

    await duplicate.connect();

    try {
      assert.deepEqual(
        await duplicate.ping(),
        Buffer.from('PONG')
      );
    } finally {
      duplicate.close();
    }
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      commandOptions: {
        typeMapping: {
          [RESP_TYPES.SIMPLE_STRING]: Buffer
        }
      }
    },
    disableClientSetup: true,
  });

  async function killClient(
    client: RedisClientType<{}, {}, {}, 2, {}>,
    errorClient: RedisClientType<{}, {}, {}, 2, {}> = client
  ): Promise<void> {
    const onceErrorPromise = once(errorClient, 'error');
    await client.sendCommand(['QUIT']);
    await Promise.all([
      onceErrorPromise,
      assert.rejects(client.ping())
    ]);
  }

  testUtils.testWithClient('should reconnect when socket disconnects', async client => {
    await killClient(client);
    await assert.doesNotReject(client.ping());
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('should remember selected db', async client => {
    await client.select(1);
    await killClient(client);
    assert.equal(
      (await client.clientInfo()).db,
      1
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [6, 2] // CLIENT INFO
  });

  testUtils.testWithClient('scanIterator', async client => {
    const entries: Array<string> = [],
      keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const key = i.toString();
      keys.add(key);
      entries.push(key, '');
    }

    await client.mSet(entries);

    const results = new Set();
    for await (const keys of client.scanIterator()) {
      for (const key of keys) {
        results.add(key);
      }
    }

    assert.deepEqual(keys, results);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('hScanIterator', async client => {
    const hash: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      hash[i.toString()] = i.toString();
    }

    await client.hSet('key', hash);

    const results: Record<string, string> = {};
    for await (const entries of client.hScanIterator('key')) {
      for (const { field, value } of entries) {
        results[field] = value;
      }
    }

    assert.deepEqual(hash, results);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('hScanNoValuesIterator', async client => {
    const hash: Record<string, string> = {};
    const expectedFields: Array<string> = [];
    for (let i = 0; i < 100; i++) {
      hash[i.toString()] = i.toString();
      expectedFields.push(i.toString());
    }

    await client.hSet('key', hash);

    const actualFields: Array<string> = [];
    for await (const fields of client.hScanNoValuesIterator('key')) {
      for (const field of fields) {
        actualFields.push(field);
      }
    }

    function sort(a: string, b: string) {
      return Number(a) - Number(b);
    }

    assert.deepEqual(actualFields.sort(sort), expectedFields);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [7, 4]
  });

  testUtils.testWithClient('sScanIterator', async client => {
    const members = new Set<string>();
    for (let i = 0; i < 100; i++) {
      members.add(i.toString());
    }

    await client.sAdd('key', Array.from(members));

    const results = new Set<string>();
    for await (const members of client.sScanIterator('key')) {
      for (const member of members) {
        results.add(member);
      }
    }

    assert.deepEqual(members, results);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('zScanIterator', async client => {
    const members: Array<SortedSetMember> = [],
      map = new Map<string, number>();
    for (let i = 0; i < 100; i++) {
      const member = {
        value: i.toString(),
        score: 1
      };
      map.set(member.value, member.score);
      members.push(member);
    }

    await client.zAdd('key', members);

    const results = new Map<string, number>();
    for await (const members of client.zScanIterator('key')) {
      for (const { value, score } of members) {
        results.set(value, score);
      }
    }

    assert.deepEqual(map, results);
  }, GLOBAL.SERVERS.OPEN);

  describe('PubSub', () => {
    testUtils.testWithClient('should be able to publish and subscribe to messages', async publisher => {
      function assertStringListener(message: string, channel: string) {
        assert.equal(typeof message, 'string');
        assert.equal(typeof channel, 'string');
      }

      function assertBufferListener(message: Buffer, channel: Buffer) {
        assert.ok(message instanceof Buffer);
        assert.ok(channel instanceof Buffer);
      }

      const subscriber = await publisher.duplicate().connect();

      try {
        const channelListener1 = spy(assertBufferListener),
          channelListener2 = spy(assertStringListener),
          patternListener = spy(assertStringListener);

        await Promise.all([
          subscriber.subscribe('channel', channelListener1, true),
          subscriber.subscribe('channel', channelListener2),
          subscriber.pSubscribe('channel*', patternListener)
        ]);
        await Promise.all([
          waitTillBeenCalled(channelListener1),
          waitTillBeenCalled(channelListener2),
          waitTillBeenCalled(patternListener),
          publisher.publish(Buffer.from('channel'), Buffer.from('message'))
        ]);
        assert.ok(channelListener1.calledOnceWithExactly(Buffer.from('message'), Buffer.from('channel')));
        assert.ok(channelListener2.calledOnceWithExactly('message', 'channel'));
        assert.ok(patternListener.calledOnceWithExactly('message', 'channel'));

        await subscriber.unsubscribe('channel', channelListener1, true);
        await Promise.all([
          waitTillBeenCalled(channelListener2),
          waitTillBeenCalled(patternListener),
          publisher.publish('channel', 'message')
        ]);
        assert.ok(channelListener1.calledOnce);
        assert.ok(channelListener2.calledTwice);
        assert.ok(channelListener2.secondCall.calledWithExactly('message', 'channel'));
        assert.ok(patternListener.calledTwice);
        assert.ok(patternListener.secondCall.calledWithExactly('message', 'channel'));
        await subscriber.unsubscribe('channel');
        await Promise.all([
          waitTillBeenCalled(patternListener),
          publisher.publish('channel', 'message')
        ]);
        assert.ok(channelListener1.calledOnce);
        assert.ok(channelListener2.calledTwice);
        assert.ok(patternListener.calledThrice);
        assert.ok(patternListener.thirdCall.calledWithExactly('message', 'channel'));

        await subscriber.pUnsubscribe();
        await publisher.publish('channel', 'message');
        assert.ok(channelListener1.calledOnce);
        assert.ok(channelListener2.calledTwice);
        assert.ok(patternListener.calledThrice);

        // should be able to send commands when unsubsribed from all channels (see #1652)
        await assert.doesNotReject(subscriber.ping());
      } finally {
        subscriber.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should resubscribe', async publisher => {
      const subscriber = await publisher.duplicate().connect();

      try {
        // The forced reconnect below can emit `error` more than once
        // (e.g. SocketClosedUnexpectedlyError followed by a transient
        // ECONNREFUSED while the server tears the connection down). A
        // permanent listener swallows the extras so they never surface as
        // uncaught; a one-shot promise gate lets us still await the first
        // error deterministically.
        let resolveFirstError!: () => void;
        const firstError = new Promise<void>(resolve => {
          resolveFirstError = resolve;
        });
        subscriber.on('error', () => resolveFirstError());

        const channelListener = spy();
        await subscriber.subscribe('channel', channelListener);

        const patternListener = spy();
        await subscriber.pSubscribe('channe*', patternListener);

        await Promise.all([
          firstError,
          publisher.clientKill({
            filter: 'SKIPME',
            skipMe: true
          })
        ]);

        await once(subscriber, 'ready');

        await Promise.all([
          waitTillBeenCalled(channelListener),
          waitTillBeenCalled(patternListener),
          publisher.publish('channel', 'message')
        ]);
      } finally {
        subscriber.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should not fail when message arrives right after subscribe', async publisher => {
      const subscriber = await publisher.duplicate().connect();

      try {
        await assert.doesNotReject(Promise.all([
          subscriber.subscribe('channel', () => {
            // noop
          }),
          publisher.publish('channel', 'message')
        ]));
      } finally {
        subscriber.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should be able to quit in PubSub mode', async client => {
      await client.subscribe('channel', () => {
        // noop
      });

      await assert.doesNotReject(client.quit());

      assert.equal(client.isOpen, false);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'],
      'should receive hash field subkey notifications',
      async client => {
        const subscriber = await client.duplicate().connect();
        try {
          const previousNotifyConfig =
            (await client.configGet('notify-keyspace-events'))['notify-keyspace-events'];
          await client.configSet('notify-keyspace-events', 'STIVh');

          try {
            const HASH_KEY = 'skn:hash';
            const FIELD = 'field-alpha';
            const HEXPIRE_CHANNEL = '__subkeyevent@0__:hexpire';
            const EXPIRED_CHANNEL = '__subkeyevent@0__:hexpired';
            const SUBKEYSPACEITEM_CHANNEL = `__subkeyspaceitem@0__:${HASH_KEY}\n${FIELD}`;
            const SUBKEYSPACEEVENT_HEXPIRE_CHANNEL = `__subkeyspaceevent@0__:hexpire|${HASH_KEY}`;
            const SUBKEYSPACEEVENT_EXPIRED_CHANNEL = `__subkeyspaceevent@0__:hexpired|${HASH_KEY}`;
            const SUBKEYEVENT_PAYLOAD = '8:skn:hash|11:field-alpha';
            const SUBKEYSPACEEVENT_PAYLOAD = '11:field-alpha';

            await client.del(HASH_KEY);

            const expected = new Map<string, Set<string>>([
              [HEXPIRE_CHANNEL, new Set([SUBKEYEVENT_PAYLOAD])],
              [EXPIRED_CHANNEL, new Set([SUBKEYEVENT_PAYLOAD])],
              [SUBKEYSPACEITEM_CHANNEL, new Set(['hexpire', 'hexpired'])],
              [SUBKEYSPACEEVENT_HEXPIRE_CHANNEL, new Set([SUBKEYSPACEEVENT_PAYLOAD])],
              [SUBKEYSPACEEVENT_EXPIRED_CHANNEL, new Set([SUBKEYSPACEEVENT_PAYLOAD])]
            ]);
            const received = new Map<string, Set<string>>();
            let totalExpected = 0;
            expected.forEach(s => totalExpected += s.size);
            let totalReceived = 0;

            let resolveAll!: () => void;
            let rejectAll!: (err: Error) => void;
            const allReceived = new Promise<void>((resolve, reject) => {
              resolveAll = resolve;
              rejectAll = reject;
            });
            const timer = setTimeout(
              () => rejectAll(new Error('Timed out waiting for hash subkey notifications')),
              10_000
            );

            const listener = (message: string, channel: string) => {
              const expectedForChannel = expected.get(channel);
              if (!expectedForChannel || !expectedForChannel.has(message)) return;
              let bucket = received.get(channel);
              if (!bucket) {
                bucket = new Set();
                received.set(channel, bucket);
              }
              if (bucket.has(message)) return;
              bucket.add(message);
              totalReceived++;
              if (totalReceived === totalExpected) {
                clearTimeout(timer);
                resolveAll();
              }
            };

            await Promise.all([
              subscriber.subscribe(HEXPIRE_CHANNEL, listener),
              subscriber.subscribe(EXPIRED_CHANNEL, listener),
              subscriber.subscribe(SUBKEYSPACEITEM_CHANNEL, listener),
              subscriber.subscribe(SUBKEYSPACEEVENT_HEXPIRE_CHANNEL, listener),
              subscriber.subscribe(SUBKEYSPACEEVENT_EXPIRED_CHANNEL, listener)
            ]);

            await client.hSet(HASH_KEY, FIELD, 'value');
            assert.deepEqual(
              await client.hpExpire(HASH_KEY, [FIELD], 50),
              [HASH_EXPIRATION.UPDATED]
            );

            await allReceived;

            for (const [channel, payloads] of expected) {
              assert.deepEqual(received.get(channel), payloads, `mismatch on ${channel}`);
            }
          } finally {
            await client.configSet('notify-keyspace-events', previousNotifyConfig);
          }
        } finally {
          subscriber.destroy();
        }
      }, GLOBAL.SERVERS.OPEN);
  });

  testUtils.testWithClient('ConnectionTimeoutError', async client => {
    const promise = assert.rejects(client.connect(), ConnectionTimeoutError),
      start = process.hrtime.bigint();

    // Block the event loop for well over `connectTimeout` so the underlying
    // socket's idle timer is guaranteed to have expired by the time the
    // event loop runs again. With a 1ms block and a 1ms timeout the two race
    // and on a fast host the TCP `connect` event can be processed before the
    // timeout callback, leaving the test with a successful connection.
    while (process.hrtime.bigint() - start < 50_000_000) {
      // block the event loop for 50ms, to make sure the connection will timeout
    }

    await promise;
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      socket: {
        connectTimeout: 1
      }
    },
    disableClientSetup: true
  });

  testUtils.testWithClient('client.quit', async client => {
    await client.connect();

    const pingPromise = client.ping(),
      quitPromise = client.quit();
    assert.equal(client.isOpen, false);

    const [ping, quit] = await Promise.all([
      pingPromise,
      quitPromise,
      assert.rejects(client.ping(), ClientClosedError)
    ]);

    assert.equal(ping, 'PONG');
    assert.equal(quit, 'OK');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    disableClientSetup: true
  });

  testUtils.testWithClient('client.disconnect', async client => {
    const pingPromise = client.ping(),
      disconnectPromise = client.disconnect();
    assert.equal(client.isOpen, false);
    await Promise.all([
      assert.rejects(pingPromise, DisconnectsClientError),
      assert.doesNotReject(disconnectPromise),
      assert.rejects(client.ping(), ClientClosedError)
    ]);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('should be able to connect after disconnect (see #1801)', async client => {
    await client.disconnect();
    await client.connect();
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('should be able to use ref and unref', client => {
    client.unref();
    client.ref();
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('pingInterval', async client => {
    assert.deepEqual(
      await once(client, 'ping-interval'),
      ['PONG']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      pingInterval: 1
    }
  });

  testUtils.testWithClient('should reject commands in connect phase when `disableOfflineQueue`', async client => {
    const connectPromise = client.connect();
    await assert.rejects(
      client.ping(),
      ClientOfflineError
    );
    await connectPromise;
    await client.disconnect();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      disableOfflineQueue: true
    },
    disableClientSetup: true
  });

  describe('MONITOR', () => {
    testUtils.testWithClient('should be able to monitor commands', async client => {
      const duplicate = await client.duplicate().connect(),
        listener = spy(message => assert.equal(typeof message, 'string'));
      await duplicate.monitor(listener);

      try {
        await Promise.all([
          waitTillBeenCalled(listener),
          client.ping()
        ]);
      } finally {
        duplicate.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should keep monitoring after reconnection', async client => {
      const duplicate = await client.duplicate().connect(),
        listener = spy(message => assert.equal(typeof message, 'string'));
      await duplicate.monitor(listener);

      try {
        await Promise.all([
          once(duplicate, 'error'),
          client.clientKill({
            filter: 'SKIPME',
            skipMe: true
          })
        ]);

        await once(duplicate, 'ready');

        await Promise.all([
          waitTillBeenCalled(listener),
          client.ping()
        ]);
      } finally {
        duplicate.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should be able to go back to "normal mode"', async client => {
      await Promise.all([
        client.monitor(() => { }),
        client.reset()
      ]);
      await assert.doesNotReject(client.ping());
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('should respect type mapping', async client => {
      const duplicate = await client.duplicate().connect(),
        listener = spy(message => assert.ok(message instanceof Buffer));
      await duplicate.withTypeMapping({
        [RESP_TYPES.SIMPLE_STRING]: Buffer
      }).monitor(listener);

      try {
        await Promise.all([
          waitTillBeenCalled(listener),
          client.ping()
        ]);
      } finally {
        duplicate.destroy();
      }
    }, GLOBAL.SERVERS.OPEN);
  });

  describe('withCommandOptions / withTypeMapping dispatch', () => {
    testUtils.testWithClient('withTypeMapping override reaches raw sendCommand', async client => {
      // Regression for `client/index.ts:1253` (`this._self._commandOptions` →
      // `this._commandOptions`): without this fix, the proxy's `withTypeMapping`
      // override was silently ignored at `sendCommand` dispatch.
      const typed = client.withTypeMapping({
        [RESP_TYPES.SIMPLE_STRING]: Buffer
      });
      const resp = await typed.sendCommand(['PING']);
      assert.deepEqual(resp, Buffer.from('PONG'));
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('withTypeMapping override reaches typed commands', async client => {
      const typed = client.withTypeMapping({
        [RESP_TYPES.SIMPLE_STRING]: Buffer
      });
      const resp = await typed.ping();
      assert.deepEqual(resp, Buffer.from('PONG'));
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('withCommandOptions full override reaches typed commands', async client => {
      // The `withCommandOptions` (full replace) path went through the same
      // proxy-dispatch fix; covered separately from `withTypeMapping` because
      // the two helpers store overrides differently on the proxy.
      const proxy = client.withCommandOptions({
        typeMapping: { [RESP_TYPES.SIMPLE_STRING]: Buffer }
      });
      const resp = await proxy.ping();
      assert.deepEqual(resp, Buffer.from('PONG'));
    }, GLOBAL.SERVERS.OPEN);
  });

  describe("socket errors during handshake", () => {

    it("should successfully connect when server accepts connection immediately", async () => {
      const { log, client, teardown } = await setup({}, 0);
      await client.connect();
      assert.deepEqual(["connect", "ready"], log);
      teardown();
    });

    it("should reconnect after multiple connection drops during handshake", async () => {
      const { log, client, teardown } = await setup({}, 2);
      await client.connect();

      // Some environments emit duplicate consecutive `error` events per dropped
      // socket during handshake. Normalize those duplicates before asserting
      // the reconnect sequence.
      const normalized = log.filter((event, index) => {
        return !(event === "error" && log[index - 1] === "error");
      });

      assert.deepEqual(
        [
          "connect",
          "error",
          "reconnecting",
          "connect",
          "error",
          "reconnecting",
          "connect",
          "ready",
        ],
        normalized,
      );
      teardown();
    });

    async function setup(
      socketOptions: Partial<RedisSocketOptions>,
      dropCount: number,
    ) {
      const port = await getFreePortNumber();
      const server = setupMockServer(dropCount);
      const options = {
        ...{
          socket: {
            host: "localhost",
            port,
          },
          ...socketOptions,
        },
      };
      const client = createClient(options);
      const log = setupLog(client);
      await once(server.listen(port), "listening");
      return {
        log,
        client,
        server,
        teardown: async function () {
          client.destroy();
          server.close();
        },
      };
    }

    function setupLog(client: EventEmitter): string[] {
      const log: string[] = [];
      client.on("connect", () => log.push("connect"));
      client.on("ready", () => log.push("ready"));
      client.on("reconnecting", () => log.push("reconnecting"));
      client.on("error", () => log.push("error"));
      return log;
    }

    function countRespCommands(chunk: Buffer): number {
      let commands = 0;

      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 42 && (i === 0 || chunk[i - 1] === 10)) {
          commands++;
        }
      }

      return commands;
    }

    // Create a TCP server that accepts connections but immediately drops them <dropImmediately> times.
    // For accepted connections, reply with one `+OK` per incoming RESP command.
    function setupMockServer(dropImmediately: number) {
      const server = net.createServer((socket) => {
        socket.on("data", (chunk: Buffer) => {
          if (dropImmediately > 0) {
            dropImmediately--;
            socket.destroy();
            return;
          }

          const commands = countRespCommands(chunk);
          if (commands > 0) {
            socket.write("+OK\r\n".repeat(commands));
          }
        });
      });
      return server;
    }

  });
});

/**
 * Executes the provided function in a context where setImmediate is stubbed to not do anything.
 * This blocks setImmediate callbacks from executing
 */
async function blockSetImmediate(fn: () => Promise<unknown>) {
  let setImmediateStub: ReturnType<typeof stub> | undefined;

  try {
    setImmediateStub = stub(global, 'setImmediate');
    setImmediateStub.callsFake(() => {
      //Dont call the callback, effectively blocking execution
    });
    await fn();
  } finally {
    if (setImmediateStub) {
      setImmediateStub.restore();
    }
  }
}
