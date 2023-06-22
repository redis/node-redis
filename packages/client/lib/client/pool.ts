// import COMMANDS from '../commands';
// import { RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
// import RedisClient, { RedisClientType, RedisClientOptions, RedisClientExtensions } from '.';
// import { EventEmitter } from 'events';
// import { DoublyLinkedNode, DoublyLinkedList, SinglyLinkedList } from './linked-list';

// export type RedisPoolOptions = typeof RedisClientPool['_DEFAULTS'];

// export type PoolTask<
//   M extends RedisModules,
//   F extends RedisFunctions,
//   S extends RedisScripts,
//   RESP extends RespVersions,
//   TYPE_MAPPING extends TypeMapping,
//   T = unknown
// > = (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => T;

// export type RedisClientPoolType<
//   M extends RedisModules = {},
//   F extends RedisFunctions = {},
//   S extends RedisScripts = {},
//   RESP extends RespVersions = 2,
//   TYPE_MAPPING extends TypeMapping = {}
// > = (
//     RedisClientPool<M, F, S, RESP, TYPE_MAPPING> &
//     RedisClientExtensions<M, F, S, RESP, TYPE_MAPPING>
//   );

// export class RedisClientPool<
//   M extends RedisModules = {},
//   F extends RedisFunctions = {},
//   S extends RedisScripts = {},
//   RESP extends RespVersions = 2,
//   TYPE_MAPPING extends TypeMapping = {}
// > extends EventEmitter {
//   static fromClient<
//     M extends RedisModules,
//     F extends RedisFunctions,
//     S extends RedisScripts,
//     RESP extends RespVersions,
//     TYPE_MAPPING extends TypeMapping = {}
//   >(
//     client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
//     poolOptions: Partial<RedisPoolOptions>
//   ) {
//     return RedisClientPool.create(
//       () => client.duplicate(),
//       poolOptions
//     );
//   }

//   static fromOptions<
//     M extends RedisModules,
//     F extends RedisFunctions,
//     S extends RedisScripts,
//     RESP extends RespVersions,
//     TYPE_MAPPING extends TypeMapping = {}
//   >(
//     options: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>,
//     poolOptions: Partial<RedisPoolOptions>
//   ) {
//     return RedisClientPool.create(
//       RedisClient.factory(options),
//       poolOptions
//     );
//   }

//   static create<
//     M extends RedisModules,
//     F extends RedisFunctions,
//     S extends RedisScripts,
//     RESP extends RespVersions,
//     TYPE_MAPPING extends TypeMapping = {}
//   >(
//     clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
//     options?: Partial<RedisPoolOptions>
//   ) {
//     return new RedisClientPool(
//       clientFactory,
//       options
//     ) as RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>;
//   }

//   private static _DEFAULTS = {
//     /**
//      * The minimum number of clients to keep in the pool.
//      */
//     minimum: 0,
//     /**
//      * The maximum number of clients to keep in the pool.
//      */
//     maximum: 1,
//     /**
//      * The maximum time a task can wait for a client to become available.
//      */
//     acquireTimeout: 3000,
//     /**
//      * When there are `> minimum && < maximum` clients in the pool, the pool will wait for `cleanupDelay` milliseconds before closing the extra clients.
//      */
//     cleanupDelay: 3000
//   };

//   private readonly _clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
//   private readonly _options: Required<RedisPoolOptions>;
//   private readonly _idleClients = new SinglyLinkedList<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>();
//   private readonly _usedClients = new DoublyLinkedList<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>();
//   private readonly _tasksQueue = new SinglyLinkedList<{
//     resolve: <T>(value: T | PromiseLike<T>) => void;
//     reject: (reason?: unknown) => void;
//     fn: PoolTask<M, F, S, RESP, TYPE_MAPPING>;
//   }>();

//   constructor(
//     clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
//     options?: Partial<RedisPoolOptions>
//   ) {
//     super();

//     this._clientFactory = clientFactory;
//     this._options = {
//       ...RedisClientPool._DEFAULTS,
//       ...options
//     };
//     this._initate();
//   }

//   private async _initate() {
//     const promises = [];
//     while (promises.length < this._options.minimum) {
//       promises.push(this._create());
//     }

//     try {
//       await Promise.all(promises);
//     } catch (err) {
//       this.destroy();
//       this.emit('error', err);
//     }
//   }

//   private async _create() {
//     const client = this._clientFactory()
//       // TODO: more events?
//       .on('error', (err: Error) => this.emit('error', err));

//     const node = this._usedClients.push(client);

//     await client.connect();

//     this._usedClients.remove(node);

//     return client;
//   }

//   execute<T>(fn: PoolTask<M, F, S, RESP, TYPE_MAPPING, T>): Promise<T> {
//     return new Promise<T>((resolve, reject) => {
//       let client = this._idleClients.shift();
//       if (!client) {
//         this._tasksQueue.push({
//           // @ts-ignore
//           resolve,
//           reject,
//           fn
//         });

//         if (this._idleClients.length + this._usedClients.length < this._options.maximum) {
//           this._create();
//         }

//         return;
//       }

//       const node = this._usedClients.push(client);
//       // @ts-ignore
//       this._executeTask(node, resolve, reject, fn);
//     });
//   }

//   private _executeTask(
//     node: DoublyLinkedNode<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>,
//     resolve: <T>(value: T | PromiseLike<T>) => void,
//     reject: (reason?: unknown) => void,
//     fn: PoolTask<M, F, S, RESP, TYPE_MAPPING>
//   ) {
//     const result = fn(node.value);
//     if (result instanceof Promise) {
//       result.then(resolve, reject);
//       result.finally(() => this._returnClient(node))
//     } else {
//       resolve(result);
//       this._returnClient(node);
//     }
//   }

//   private _returnClient(node: DoublyLinkedListNode<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>) {
//     const task = this._tasksQueue.shift();
//     if (task) {
//       this._executeTask(node, task.resolve, task.reject, task.fn);
//       return;
//     }

//     if (this._idleClients.length >= this._options.minimum) {
//       node.client.destroy();
//       return;
//     }

//     this._usedClients.remove(node);
//     this._idleClients.push(node.client);
//   }

//   async close() {
//     const promises = [];

//     for (const client of this._idleClients) {
//       promises.push(client.close());
//     }

//     this._idleClients.reset();

//     for (const client of this._usedClients) {
//       promises.push(client.close());
//     }

//     this._usedClients.reset();

//     await Promise.all(promises);
//   }

//   destroy() {
//     for (const client of this._idleClients) {
//       client.destroy();
//     }

//     this._idleClients.reset();

//     for (const client of this._usedClients) {
//       client.destroy();
//     }

//     this._usedClients.reset();
//   }
// }
