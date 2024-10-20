import { EventEmitter } from 'stream';
import RedisClient, { RedisClientType } from '.';
import { RedisArgument, ReplyUnion, TransformReply, TypeMapping } from '../RESP/types';
import { BasicCommandParser } from './parser';

type CachingClient = RedisClient<any, any, any, any, any>;
type CachingClientType = RedisClientType<any, any, any, any, any>;
type CmdFunc = () => Promise<ReplyUnion>;

export interface ClientSideCacheConfig {
  ttl: number;
  maxEntries: number;
  lru: boolean;
}

type CacheCreator = {
  epoch: number;
  client: CachingClient;
};

interface ClientSideCacheEntry {
  invalidate(): void;
  validate(): boolean;
}

abstract class ClientSideCacheEntryBase implements ClientSideCacheEntry {
  #invalidated = false;
  readonly #expireTime: number;

  constructor(ttl: number) {
    if (ttl == 0) {
      this.#expireTime = 0;
    } else {
      this.#expireTime = Date.now() + ttl;
    }
  }

  invalidate(): void {
    this.#invalidated = true;
  }

  validate(): boolean {
    return !this.#invalidated && (this.#expireTime == 0 || (Date.now() < this.#expireTime))
  }
}

export class ClientSideCacheEntryValue extends ClientSideCacheEntryBase {
  readonly #value: any;

  get value() {
    return structuredClone(this.#value);
  }

  constructor(ttl: number, value: any) {
    super(ttl);
    this.#value = value;
  }
}

export class ClientSideCacheEntryPromise extends ClientSideCacheEntryBase {
  readonly #sendCommandPromise: Promise<ReplyUnion>;

  get promise() {
    return this.#sendCommandPromise;
  }

  constructor(ttl: number, sendCommandPromise: Promise<ReplyUnion>) {
    super(ttl);
    this.#sendCommandPromise = sendCommandPromise;
  }
}

export abstract class ClientSideCacheProvider extends EventEmitter {
  abstract handleCache(client: CachingClient, parser: BasicCommandParser, fn: CmdFunc, transformReply: TransformReply | undefined, typeMapping: TypeMapping | undefined): Promise<any>;
  abstract trackingOn(): Array<string> | undefined;
  abstract invalidate(key: RedisArgument | null): void;
  abstract clear(): void;
  abstract cacheHits(): number;
  abstract cacheMisses(): number;
  abstract onError(): void;
  abstract onClose(): void;
  abstract onDestroy(): void;
}

export class BasicClientSideCache extends ClientSideCacheProvider {
  #cacheKeyToEntryMap: Map<string, ClientSideCacheEntry>;
  #keyToCacheKeySetMap: Map<string, Set<string>>;
  readonly ttl: number;
  readonly #maxEntries: number;
  readonly #lru: boolean;
  #cacheHits = 0;
  #cacheMisses = 0;

  constructor(config?: ClientSideCacheConfig) {
    super();

    this.#cacheKeyToEntryMap = new Map<string, ClientSideCacheEntry>();
    this.#keyToCacheKeySetMap = new Map<string, Set<string>>();
    this.ttl = config?.ttl ?? 0;
    this.#maxEntries = config?.maxEntries ?? 0;
    this.#lru = config?.lru ?? false;
  }

  /* logic of how caching works:

  1. every command that's cachable will be using CachableCommandParser
    it enables us to define/retrieve
      cacheKey - a unique key that corresponds to this command and its arguments
      redisKeys - an array of redis keys as strings that if the key is modified, will cause redis to invalidate this result when cached
  2. check if cacheKey is in our cache
    2b1. if its a value cacheEntry - return it
    2b2. if it's a promise cache entry - wait on promise and then go to 3c.
  3. if cacheEntry is not in cache
    3a. send the command save the promise into a a cacheEntry and then wait on result
    3b. check the cacheEntry is still valid - in cache and hasn't been deleted)
    3c. if valid - overwrite with value entry
  4. return previously non cached result
  */
  override async handleCache(
    client: CachingClient,
    parser: BasicCommandParser,
    fn: CmdFunc,
    transformReply: TransformReply | undefined,
    typeMapping: TypeMapping | undefined
  ) {
    console.log("handleCache: enter");
    let reply: ReplyUnion;

    const cacheKey = parser.cacheKey;

    // "2"
    let cacheEntry = this.get(cacheKey);
    if (cacheEntry) {
      // If instanceof is "too slow", can add a "type" and then use an "as" cast to call proper getters.
      if (cacheEntry instanceof ClientSideCacheEntryValue) { // "2b1"
        console.log("returning value from cache");
        this.#cacheHit();

        return cacheEntry.value;
      } else if (cacheEntry instanceof ClientSideCacheEntryPromise) { // 2b2
        // unsure if this should be considered a cache hit, a miss, or neither?
        reply = await cacheEntry.promise;
      } else {
        throw new Error("unknown cache entry type");
      }
    } else { // 3/3a
      this.#cacheMiss();
      
      const promise = fn();

      cacheEntry = this.createPromiseEntry(client, promise);
      this.set(cacheKey, cacheEntry, parser.keys);

      try {
        reply = await promise;
      } catch (err) {
        if (cacheEntry.validate()) { // on error, have to remove promise from cache
          this.delete(cacheKey!);
        }
        throw err;
      }
    }

    let val;
    if (transformReply) {
      val = transformReply(reply, parser.preserve, typeMapping);
    } else {
      val = reply;
    }

    // 3b
    if (cacheEntry.validate()) { // revalidating promise entry (dont save value, if promise entry has been invalidated)
      // 3c
      console.log("saving value to cache");
      cacheEntry = this.createValueEntry(client, val);
      this.set(cacheKey, cacheEntry, parser.keys);
      this.emit("cached-key", cacheKey);
    } else {
      console.log("cache entry for key got invalidated between execution and saving, so not saving");
    }

    return val;
  }

  override trackingOn() {
    return ['CLIENT', 'TRACKING', 'ON'];
  }

  override invalidate(key: RedisArgument | null) {
    if (key === null) {
      this.clear(false);
      return;
    }
    const set = this.#keyToCacheKeySetMap.get(key.toString());
    if (set) {
     for (const cacheKey of set) {
        console.log(`invalidate: got ${cacheKey} from key ${key.toString()} set`);
        const entry = this.#cacheKeyToEntryMap.get(cacheKey);
        if (entry) {
          entry.invalidate();
        }
        this.#cacheKeyToEntryMap.delete(cacheKey);
        this.emit("invalidate", cacheKey);
      }
      this.#keyToCacheKeySetMap.delete(key.toString());
    }
  }

  override clear(reset = true) {
    this.#cacheKeyToEntryMap.clear();
    this.#keyToCacheKeySetMap.clear();
    if (reset) {
      this.#cacheHits = 0;
      this.#cacheMisses = 0;
    }
  }

  get(cacheKey?: string | undefined) {
    if (cacheKey === undefined) {
      return undefined
    }

    const val = this.#cacheKeyToEntryMap.get(cacheKey);

    if (val && !val.validate()) {
      this.delete(cacheKey);
      this.emit("invalidate", cacheKey);

      return undefined;
    }

    if (val !== undefined && this.#lru) {
      this.#cacheKeyToEntryMap.delete(cacheKey);
      this.#cacheKeyToEntryMap.set(cacheKey, val);
    }

    return val;
  }

  delete(cacheKey: string) {
    const entry = this.#cacheKeyToEntryMap.get(cacheKey);
    if (entry) {
      entry.invalidate();
      this.#cacheKeyToEntryMap.delete(cacheKey);
    }
  }

  has(cacheKey: string) {
    return this.#cacheKeyToEntryMap.has(cacheKey);
  }

  set(cacheKey: string, cacheEntry: ClientSideCacheEntry, keys: Array<RedisArgument>) {
    let count = this.#cacheKeyToEntryMap.size;
    const oldEntry = this.#cacheKeyToEntryMap.get(cacheKey);
    if (oldEntry) {
      count--; // overwriting, so not incrementig
      oldEntry.invalidate();
    }

    if (this.#maxEntries > 0 && count >= this.#maxEntries) {
      this.deleteOldest();
    }

    this.#cacheKeyToEntryMap.set(cacheKey, cacheEntry);

    for (const key of keys) {
      if (!this.#keyToCacheKeySetMap.has(key.toString())) {
        this.#keyToCacheKeySetMap.set(key.toString(), new Set<string>());
      }

      const cacheKeySet = this.#keyToCacheKeySetMap.get(key.toString());
      cacheKeySet!.add(cacheKey);
    }
  }

  size() {
    return this.#cacheKeyToEntryMap.size;
  }

  createValueEntry(client: CachingClient, value: any): ClientSideCacheEntryValue {
    return new ClientSideCacheEntryValue(this.ttl, value);
  }

  createPromiseEntry(client: CachingClient, sendCommandPromise: Promise<ReplyUnion>): ClientSideCacheEntryPromise {
    return new ClientSideCacheEntryPromise(this.ttl, sendCommandPromise);
  }

  #cacheHit(): void {
    this.#cacheHits++;
  }

  #cacheMiss(): void {
    this.#cacheMisses++;
  }

  override cacheHits(): number {
    return this.#cacheHits;
  }

  override cacheMisses(): number {
    return this.#cacheMisses;
  }

  override onError(): void {
    this.clear();
  }

  override onClose() { }
    
  override onDestroy() { }

  /**
   * @internal
   */
  deleteOldest() {
    const it = this.#cacheKeyToEntryMap[Symbol.iterator]();
    const n = it.next();
    if (!n.done) {
      this.#cacheKeyToEntryMap.delete(n.value[0]);
    }
  }

  /**
   * @internal
   */
  entryEntries() {
    return this.#cacheKeyToEntryMap.entries();
  }

  /**
   * @internal
   */
  keySetEntries() {
    return this.#keyToCacheKeySetMap.entries();
  }
}

export abstract class PooledClientSideCacheProvider extends BasicClientSideCache {
  #disabled = false;

  abstract updateRedirect(id: number): void;
  abstract addClient(client: CachingClientType): void;
  abstract removeClient(client: CachingClientType): void;

  disable() {
    this.#disabled = true;
  }

  enable() {
    this.#disabled = false;
  }

  override get(cacheKey: string) {
    if (this.#disabled) {
      return undefined;
    }

    return super.get(cacheKey);
  }

  override has(cacheKey: string) {
    if (this.#disabled) {
      return false;
    }

    return super.has(cacheKey);
  }  
  
  onConnect(factory: () => CachingClientType) {};
}

// doesn't do anything special in pooling, clears cache on every client disconnect
export class BasicPooledClientSideCache extends PooledClientSideCacheProvider {

  override updateRedirect(id: number): void {
    return;
  }

  override addClient(client: CachingClientType): void {
    return;
  }
  override removeClient(client: CachingClientType): void {
    return;
  }
}

class PooledClientSideCacheEntryValue extends ClientSideCacheEntryValue {
  #creator: CacheCreator;

  constructor(ttl: number, creator: CacheCreator, value: any) {
    super(ttl, value);

    this.#creator = creator;
  }

  override validate(): boolean {
    let ret = super.validate();
    if (this.#creator) {
      ret = ret && this.#creator.client.isReady && this.#creator.client.socketEpoch == this.#creator.epoch
    }

    return ret;
  }
}

class PooledClientSideCacheEntryPromise extends ClientSideCacheEntryPromise {
  #creator: CacheCreator;

  constructor(ttl: number, creator: CacheCreator, sendCommandPromise: Promise<ReplyUnion>) {
    super(ttl, sendCommandPromise);

    this.#creator = creator;
  }

  override validate(): boolean {
    let ret = super.validate();
    if (this.#creator) {
      ret = ret && this.#creator.client.isReady && this.#creator.client.socketEpoch == this.#creator.epoch
    }

    return ret;
  }
}

// Doesn't clear cache on client disconnect, validates entries on retrieval
export class PooledNoRedirectClientSideCache extends BasicPooledClientSideCache {
  override createValueEntry(client: CachingClient, value: any): ClientSideCacheEntryValue {
    const creator = {
      epoch: client.socketEpoch,
      client: client
    };

    return new PooledClientSideCacheEntryValue(this.ttl, creator, value);
  }

  override createPromiseEntry(client: CachingClient, sendCommandPromise: Promise<ReplyUnion>): ClientSideCacheEntryPromise {
    const creator = {
      epoch: client.socketEpoch,
      client: client
    };

    return new PooledClientSideCacheEntryPromise(this.ttl, creator, sendCommandPromise);
  }

  // don't clear cache on error here
  override onError(): void {}
}

// Only clears cache on "management"/"redirect" client disconnect
export class PooledRedirectClientSideCache extends PooledClientSideCacheProvider {
  #id?: number;
  #clients: Set<CachingClientType> = new Set();
  #redirectClient?: CachingClientType;

  constructor(config: ClientSideCacheConfig) {
    super(config);
    this.disable();
  }

  override trackingOn(): string[] {
    if (this.#id) {
      return ['CLIENT', 'TRACKING', 'ON', 'REDIRECT', this.#id.toString()];
    } else {
      return [];
    }
  }

  override updateRedirect(id: number) {
    this.#id = id;
    for (const client of this.#clients) {
      client.sendCommand(this.trackingOn()).catch(() => {});
    }
  }

  override addClient(client: CachingClientType) {
    this.#clients.add(client);
  }

  override removeClient(client: CachingClientType) {
    this.#clients.delete(client);
  }

  override onError(): void {};

  override async onConnect(factory: () => CachingClientType) {
    const client = factory();
    this.#redirectClient = client;

    client.on("error", () => {
      this.disable();
      this.clear();
    }).on("ready", async () => {
      const clientId = await client.withTypeMapping({}).clientId();
      this.updateRedirect(clientId);
      this.enable();
    })

    try {
      await client.connect();
    } catch (err) {
      throw err;
    }
  }

  onDestroy() {
    this.clear();

    if (this.#redirectClient) {
      this.#id = undefined;
      const client = this.#redirectClient;
      this.#redirectClient = undefined;

      client.destroy();
    }
  }

  override async onClose() {
    this.clear();

    if (this.#redirectClient) {
      this.#id = undefined;
      const client = this.#redirectClient;
      this.#redirectClient = undefined;

      return client.close();
    }
  }
}
