import { Pool, Options as PoolOptions, createPool } from 'generic-pool';
import { RedisFunctions, RedisModules, RedisScripts, RespVersions } from '../RESP/types';
import RedisClient, { RedisClientType, RedisClientOptions } from '.';
import { EventEmitter } from 'events';

type RedisClientPoolOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> = RedisClientOptions<M, F, S, RESP> & PoolOptions;

export class RedisClientPool<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> extends EventEmitter {
  _pool: Pool<RedisClientType<M, F, S, RESP>>;

  static fromClient<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts,
    RESP extends RespVersions
  >(
    client: RedisClientType<M, F, S, RESP>,
    poolOptions?: PoolOptions
  ) {
    return new RedisClientPool<M, F, S, RESP>(
      () => client.duplicate(),
      poolOptions
    );
  }

  static fromOptions<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts,
    RESP extends RespVersions
  >(
    options: RedisClientPoolOptions<M, F, S, RESP>,
    poolOptions?: PoolOptions
  ) {
    return new RedisClientPool(
      RedisClient.factory(options),
      poolOptions
    );
  }

  constructor(
    clientFactory: () => RedisClientType<M, F, S, RESP>,
    options?: PoolOptions
  ) {
    super();

    this._pool = createPool({
      create: async () => {
        const client = clientFactory();

        // TODO: more events?
        client.on('error', (err: Error) => this.emit('error', err));

        await client.connect();

        return client;
      },
      // TODO: destroy has to return a Promise?!
      destroy: async client => client.disconnect()
    }, options);
  }

  execute<T>(fn: () => T): Promise<T> {
    return this._pool.use(fn);
  }

  close() {
    // TODO
  }

  disconnect() {
    // TODO
  }
}
