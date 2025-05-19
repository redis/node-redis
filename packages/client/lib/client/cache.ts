import { EventEmitter } from 'stream';
import RedisClient from '.';
import { RedisArgument, ReplyUnion, TransformReply, TypeMapping } from '../RESP/types';
import { BasicCommandParser } from './parser';

/**
 * A snapshot of cache statistics.
 *
 * This class provides an immutable view of the cache's operational statistics at a particular
 * point in time. It is heavily inspired by the statistics reporting capabilities found in
 * Ben Manes's Caffeine cache (https://github.com/ben-manes/caffeine).
 *
 * Instances of `CacheStats` are typically obtained from a {@link StatsCounter} and can be used
 * for performance monitoring, debugging, or logging. It includes metrics such as hit rate,
 * miss rate, load success/failure rates, average load penalty, and eviction counts.
 *
 * All statistics are non-negative. Rates and averages are typically in the range `[0.0, 1.0]`,
 * or `0` if the an operation has not occurred (e.g. hit rate is 0 if there are no requests).
 *
 * Cache statistics are incremented according to specific rules:
 * - When a cache lookup encounters an existing entry, hitCount is incremented.
 * - When a cache lookup encounters a missing entry, missCount is incremented.
 * - When a new entry is successfully loaded, loadSuccessCount is incremented and the
 *   loading time is added to totalLoadTime.
 * - When an entry fails to load, loadFailureCount is incremented and the
 *   loading time is added to totalLoadTime.
 * - When an entry is evicted due to size constraints or expiration,
 *   evictionCount is incremented.
 */
export class CacheStats {
  /**
   * Creates a new CacheStats instance with the specified statistics.
   */
  private constructor(
    public readonly hitCount: number,
    public readonly missCount: number,
    public readonly loadSuccessCount: number,
    public readonly loadFailureCount: number,
    public readonly totalLoadTime: number,
    public readonly evictionCount: number
  ) {
    if (
      hitCount < 0 ||
      missCount < 0 ||
      loadSuccessCount < 0 ||
      loadFailureCount < 0 ||
      totalLoadTime < 0 ||
      evictionCount < 0
    ) {
      throw new Error('All statistics values must be non-negative');
    }
  }

  /**
   * Creates a new CacheStats instance with the specified statistics.
   *
   * @param hitCount - Number of cache hits
   * @param missCount - Number of cache misses
   * @param loadSuccessCount - Number of successful cache loads
   * @param loadFailureCount - Number of failed cache loads
   * @param totalLoadTime - Total load time in milliseconds
   * @param evictionCount - Number of cache evictions
   */
  static of(
    hitCount = 0,
    missCount = 0,
    loadSuccessCount = 0,
    loadFailureCount = 0,
    totalLoadTime = 0,
    evictionCount = 0
  ): CacheStats {
    return new CacheStats(
      hitCount,
      missCount,
      loadSuccessCount,
      loadFailureCount,
      totalLoadTime,
      evictionCount
    );
  }

  /**
   * Returns a statistics instance where no cache events have been recorded.
   *
   * @returns An empty statistics instance
   */
  static empty(): CacheStats {
    return CacheStats.EMPTY_STATS;
  }

  /**
   * An empty stats instance with all counters set to zero.
   */
  private static readonly EMPTY_STATS = new CacheStats(0, 0, 0, 0, 0, 0);

  /**
  * Returns the total number of times cache lookup methods have returned
  * either a cached or uncached value.
  *
  * @returns Total number of requests (hits + misses)
  */
  requestCount(): number {
    return this.hitCount + this.missCount;
  }

  /**
   * Returns the hit rate of the cache.
   * This is defined as hitCount / requestCount, or 1.0 when requestCount is 0.
   *
   * @returns The ratio of cache requests that were hits (between 0.0 and 1.0)
   */
  hitRate(): number {
    const requestCount = this.requestCount();
    return requestCount === 0 ? 1.0 : this.hitCount / requestCount;
  }

  /**
   * Returns the miss rate of the cache.
   * This is defined as missCount / requestCount, or 0.0 when requestCount is 0.
   *
   * @returns The ratio of cache requests that were misses (between 0.0 and 1.0)
   */
  missRate(): number {
    const requestCount = this.requestCount();
    return requestCount === 0 ? 0.0 : this.missCount / requestCount;
  }

  /**
  * Returns the total number of load operations (successful + failed).
  *
  * @returns Total number of load operations
  */
  loadCount(): number {
    return this.loadSuccessCount + this.loadFailureCount;
  }

  /**
   * Returns the ratio of cache loading attempts that failed.
   * This is defined as loadFailureCount / loadCount, or 0.0 when loadCount is 0.
   *
   * @returns Ratio of load operations that failed (between 0.0 and 1.0)
   */
  loadFailureRate(): number {
    const loadCount = this.loadCount();
    return loadCount === 0 ? 0.0 : this.loadFailureCount / loadCount;
  }

  /**
   * Returns the average time spent loading new values, in milliseconds.
   * This is defined as totalLoadTime / loadCount, or 0.0 when loadCount is 0.
   *
   * @returns Average load time in milliseconds
   */
  averageLoadPenalty(): number {
    const loadCount = this.loadCount();
    return loadCount === 0 ? 0.0 : this.totalLoadTime / loadCount;
  }

  /**
  * Returns a new CacheStats representing the difference between this CacheStats
  * and another. Negative values are rounded up to zero.
  *
  * @param other - The statistics to subtract from this instance
  * @returns The difference between this instance and other
  */
  minus(other: CacheStats): CacheStats {
    return CacheStats.of(
      Math.max(0, this.hitCount - other.hitCount),
      Math.max(0, this.missCount - other.missCount),
      Math.max(0, this.loadSuccessCount - other.loadSuccessCount),
      Math.max(0, this.loadFailureCount - other.loadFailureCount),
      Math.max(0, this.totalLoadTime - other.totalLoadTime),
      Math.max(0, this.evictionCount - other.evictionCount)
    );
  }

  /**
   * Returns a new CacheStats representing the sum of this CacheStats and another.
   *
   * @param other - The statistics to add to this instance
   * @returns The sum of this instance and other
   */
  plus(other: CacheStats): CacheStats {
    return CacheStats.of(
      this.hitCount + other.hitCount,
      this.missCount + other.missCount,
      this.loadSuccessCount + other.loadSuccessCount,
      this.loadFailureCount + other.loadFailureCount,
      this.totalLoadTime + other.totalLoadTime,
      this.evictionCount + other.evictionCount
    );
  }
}

/**
 * An accumulator for cache statistics.
 *
 * This interface defines the contract for objects that record cache-related events
 * such as hits, misses, loads (successes and failures), and evictions. The design
 * is inspired by the statistics collection mechanisms in Ben Manes's Caffeine cache
 * (https://github.com/ben-manes/caffeine).
 *
 * Implementations of this interface are responsible for aggregating these events.
 * A snapshot of the current statistics can be obtained by calling the `snapshot()`
 * method, which returns an immutable {@link CacheStats} object.
 *
 * Common implementations include `DefaultStatsCounter` for active statistics collection
 * and `DisabledStatsCounter` for a no-op version when stats are not needed.
 */
export interface StatsCounter {
  /**
   * Records cache hits. This should be called when a cache request returns a cached value.
   *
   * @param count - The number of hits to record
   */
  recordHits(count: number): void;

  /**
   * Records cache misses. This should be called when a cache request returns a value that was not
   * found in the cache.
   *
   * @param count - The number of misses to record
   */
  recordMisses(count: number): void;

  /**
   * Records the successful load of a new entry. This method should be called when a cache request
   * causes an entry to be loaded and the loading completes successfully.
   *
   * @param loadTime - The number of milliseconds the cache spent computing or retrieving the new value
   */
  recordLoadSuccess(loadTime: number): void;

  /**
   * Records the failed load of a new entry. This method should be called when a cache request
   * causes an entry to be loaded, but an exception is thrown while loading the entry.
   *
   * @param loadTime - The number of milliseconds the cache spent computing or retrieving the new value
   *                   prior to the failure
   */
  recordLoadFailure(loadTime: number): void;

  /**
   * Records the eviction of an entry from the cache. This should only be called when an entry is
   * evicted due to the cache's eviction strategy, and not as a result of manual invalidations.
   *
   * @param count - The number of evictions to record
   */
  recordEvictions(count: number): void;

  /**
   * Returns a snapshot of this counter's values. Note that this may be an inconsistent view, as it
   * may be interleaved with update operations.
   *
   * @return A snapshot of this counter's values
   */
  snapshot(): CacheStats;
}

/**
 * A StatsCounter implementation that does nothing and always returns empty stats.
 */
class DisabledStatsCounter implements StatsCounter {
  static readonly INSTANCE = new DisabledStatsCounter();

  private constructor() { }

  recordHits(count: number): void { }
  recordMisses(count: number): void { }
  recordLoadSuccess(loadTime: number): void { }
  recordLoadFailure(loadTime: number): void { }
  recordEvictions(count: number): void { }
  snapshot(): CacheStats { return CacheStats.empty(); }
}

/**
 * Returns a StatsCounter that does not record any cache events.
 *
 * @return A StatsCounter that does not record metrics
 */
function disabledStatsCounter(): StatsCounter {
  return DisabledStatsCounter.INSTANCE;
}

/**
 * A StatsCounter implementation that maintains cache statistics.
 */
class DefaultStatsCounter implements StatsCounter {
  #hitCount = 0;
  #missCount = 0;
  #loadSuccessCount = 0;
  #loadFailureCount = 0;
  #totalLoadTime = 0;
  #evictionCount = 0;

  /**
   * Records cache hits.
   *
   * @param count - The number of hits to record
   */
  recordHits(count: number): void {
    this.#hitCount += count;
  }

  /**
   * Records cache misses.
   *
   * @param count - The number of misses to record
   */
  recordMisses(count: number): void {
    this.#missCount += count;
  }

  /**
   * Records the successful load of a new entry.
   *
   * @param loadTime - The number of milliseconds spent loading the entry
   */
  recordLoadSuccess(loadTime: number): void {
    this.#loadSuccessCount++;
    this.#totalLoadTime += loadTime;
  }

  /**
   * Records the failed load of a new entry.
   *
   * @param loadTime - The number of milliseconds spent attempting to load the entry
   */
  recordLoadFailure(loadTime: number): void {
    this.#loadFailureCount++;
    this.#totalLoadTime += loadTime;
  }

  /**
   * Records cache evictions.
   *
   * @param count - The number of evictions to record
   */
  recordEvictions(count: number): void {
    this.#evictionCount += count;
  }

  /**
   * Returns a snapshot of the current statistics.
   *
   * @returns A snapshot of the current statistics
   */
  snapshot(): CacheStats {
    return CacheStats.of(
      this.#hitCount,
      this.#missCount,
      this.#loadSuccessCount,
      this.#loadFailureCount,
      this.#totalLoadTime,
      this.#evictionCount
    );
  }

  /**
   * Creates a new DefaultStatsCounter.
   *
   * @returns A new DefaultStatsCounter instance
   */
  static create(): DefaultStatsCounter {
    return new DefaultStatsCounter();
  }
}

type CachingClient = RedisClient<any, any, any, any, any>;
type CmdFunc = () => Promise<ReplyUnion>;

type EvictionPolicy = "LRU" | "FIFO"

/**
 * Configuration options for Client Side Cache
 */
export interface ClientSideCacheConfig {
  /**
   * Time-to-live in milliseconds for cached entries.
   * Use 0 for no expiration.
   * @default 0
   */
  ttl?: number;

  /**
   * Maximum number of entries to store in the cache.
   * Use 0 for unlimited entries.
   * @default 0
   */
  maxEntries?: number;

  /**
   * Eviction policy to use when the cache reaches its capacity.
   * - "LRU" (Least Recently Used): Evicts least recently accessed entries first
   * - "FIFO" (First In First Out): Evicts oldest entries first
   * @default "LRU"
   */
  evictPolicy?: EvictionPolicy;

  /**
   * Whether to collect statistics about cache operations.
   * @default true
   */
  recordStats?: boolean;
}

interface CacheCreator {
  epoch: number;
  client: CachingClient;
}

interface ClientSideCacheEntry {
  invalidate(): void;
  validate(): boolean;
}

/**
 * Generates a unique cache key from Redis command arguments
 *
 * @param redisArgs - Array of Redis command arguments
 * @returns A unique string key for caching
 */
function generateCacheKey(redisArgs: ReadonlyArray<RedisArgument>): string {
  const tmp = new Array(redisArgs.length * 2);

  for (let i = 0; i < redisArgs.length; i++) {
    tmp[i] = redisArgs[i].length;
    tmp[i + redisArgs.length] = redisArgs[i];
  }

  return tmp.join('_');
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

class ClientSideCacheEntryValue extends ClientSideCacheEntryBase {
  readonly #value: any;

  get value() {
    return this.#value;
  }

  constructor(ttl: number, value: any) {
    super(ttl);
    this.#value = value;
  }
}

class ClientSideCacheEntryPromise extends ClientSideCacheEntryBase {
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
  abstract trackingOn(): Array<RedisArgument>;
  abstract invalidate(key: RedisArgument | null): void;
  abstract clear(): void;
  abstract stats(): CacheStats;
  abstract onError(): void;
  abstract onClose(): void;
}

export class BasicClientSideCache extends ClientSideCacheProvider {
  #cacheKeyToEntryMap: Map<string, ClientSideCacheEntry>;
  #keyToCacheKeySetMap: Map<string, Set<string>>;
  readonly ttl: number;
  readonly maxEntries: number;
  readonly lru: boolean;
  #statsCounter: StatsCounter;


  recordEvictions(count: number): void {
    this.#statsCounter.recordEvictions(count);
  }

  recordHits(count: number): void {
    this.#statsCounter.recordHits(count);
  }

  recordMisses(count: number): void {
    this.#statsCounter.recordMisses(count);
  }

  constructor(config?: ClientSideCacheConfig) {
    super();

    this.#cacheKeyToEntryMap = new Map<string, ClientSideCacheEntry>();
    this.#keyToCacheKeySetMap = new Map<string, Set<string>>();
    this.ttl = config?.ttl ?? 0;
    this.maxEntries = config?.maxEntries ?? 0;
    this.lru = config?.evictPolicy !== "FIFO";

    const recordStats = config?.recordStats !== false;
    this.#statsCounter = recordStats ? DefaultStatsCounter.create() : disabledStatsCounter();
  }

  /* logic of how caching works:

  1. commands use a CommandParser
    it enables us to define/retrieve
      cacheKey - a unique key that corresponds to this command and its arguments
      redisKeys - an array of redis keys as strings that if the key is modified, will cause redis to invalidate this result when cached
  2. check if cacheKey is in our cache
    2b1. if its a value cacheEntry - return it
    2b2. if it's a promise cache entry - wait on promise and then go to 3c.
  3. if cacheEntry is not in cache
    3a. send the command save the promise into a a cacheEntry and then wait on result
    3b. transform reply (if required) based on transformReply
    3b. check the cacheEntry is still valid - in cache and hasn't been deleted)
    3c. if valid - overwrite with value entry
  4. return previously non cached result
  */
  override async handleCache(
    client: CachingClient,
    parser: BasicCommandParser,
    fn: CmdFunc,
    transformReply?: TransformReply,
    typeMapping?: TypeMapping
  ) {
    let reply: ReplyUnion;

    const cacheKey = generateCacheKey(parser.redisArgs);

    // "2"
    let cacheEntry = this.get(cacheKey);
    if (cacheEntry) {
      // If instanceof is "too slow", can add a "type" and then use an "as" cast to call proper getters.
      if (cacheEntry instanceof ClientSideCacheEntryValue) { // "2b1"
        this.#statsCounter.recordHits(1);

        return structuredClone(cacheEntry.value);
      } else if (cacheEntry instanceof ClientSideCacheEntryPromise) { // 2b2
        // This counts as a miss since the value hasn't been fully loaded yet.
        this.#statsCounter.recordMisses(1);
        reply = await cacheEntry.promise;
      } else {
        throw new Error("unknown cache entry type");
      }
    } else { // 3/3a
      this.#statsCounter.recordMisses(1);

      const startTime = performance.now();
      const promise = fn();

      cacheEntry = this.createPromiseEntry(client, promise);
      this.set(cacheKey, cacheEntry, parser.keys);

      try {
        reply = await promise;
        const loadTime = performance.now() - startTime;
        this.#statsCounter.recordLoadSuccess(loadTime);
      } catch (err) {
        const loadTime = performance.now() - startTime;
        this.#statsCounter.recordLoadFailure(loadTime);

        if (cacheEntry.validate()) {
          this.delete(cacheKey!);
        }

        throw err;
      }
    }

    // 3b
    let val;
    if (transformReply) {
      val = transformReply(reply, parser.preserve, typeMapping);
    } else {
      val = reply;
    }

    // 3c
    if (cacheEntry.validate()) { // revalidating promise entry (dont save value, if promise entry has been invalidated)
      // 3d
      cacheEntry = this.createValueEntry(client, val);
      this.set(cacheKey, cacheEntry, parser.keys);
      this.emit("cached-key", cacheKey);
    } else {
      //   cache entry for key got invalidated between execution and saving, so not saving
    }

    return structuredClone(val);
  }

  override trackingOn() {
    return ['CLIENT', 'TRACKING', 'ON'];
  }

  override invalidate(key: RedisArgument | null) {
    if (key === null) {
      this.clear(false);
      this.emit("invalidate", key);

      return;
    }

    const keySet = this.#keyToCacheKeySetMap.get(key.toString());
    if (keySet) {
      for (const cacheKey of keySet) {
        const entry = this.#cacheKeyToEntryMap.get(cacheKey);
        if (entry) {
          entry.invalidate();
        }
        this.#cacheKeyToEntryMap.delete(cacheKey);
      }
      this.#keyToCacheKeySetMap.delete(key.toString());
    }

    this.emit('invalidate', key);
  }

  override clear(resetStats = true) {
    const oldSize = this.#cacheKeyToEntryMap.size;
    this.#cacheKeyToEntryMap.clear();
    this.#keyToCacheKeySetMap.clear();

    if (resetStats) {
      if (!(this.#statsCounter instanceof DisabledStatsCounter)) {
        this.#statsCounter = DefaultStatsCounter.create();
      }
    } else {
      // If old entries were evicted due to clear, record them as evictions
      if (oldSize > 0) {
        this.#statsCounter.recordEvictions(oldSize);
      }
    }
  }

  get(cacheKey: string) {
    const val = this.#cacheKeyToEntryMap.get(cacheKey);

    if (val && !val.validate()) {
      this.delete(cacheKey);
      this.#statsCounter.recordEvictions(1);
      this.emit("cache-evict", cacheKey);

      return undefined;
    }

    if (val !== undefined && this.lru) {
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

    if (this.maxEntries > 0 && count >= this.maxEntries) {
      this.deleteOldest();
      this.#statsCounter.recordEvictions(1);
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

  override stats(): CacheStats {
    return this.#statsCounter.snapshot();
  }

  override onError(): void {
    this.clear();
  }

  override onClose() {
    this.clear();
  }

  /**
   * @internal
   */
  deleteOldest() {
    const it = this.#cacheKeyToEntryMap[Symbol.iterator]();
    const n = it.next();
    if (!n.done) {
      const key = n.value[0];
      const entry = this.#cacheKeyToEntryMap.get(key);
      if (entry) {
        entry.invalidate();
      }
      this.#cacheKeyToEntryMap.delete(key);
    }
  }

  /**
   * Get cache entries for debugging
   * @internal
   */
  entryEntries(): IterableIterator<[string, ClientSideCacheEntry]> {
    return this.#cacheKeyToEntryMap.entries();
  }

  /**
   * Get key set entries for debugging
   * @internal
   */
  keySetEntries(): IterableIterator<[string, Set<string>]> {
    return this.#keyToCacheKeySetMap.entries();
  }
}

export abstract class PooledClientSideCacheProvider extends BasicClientSideCache {
  #disabled = false;

  disable(): void {
    this.#disabled = true;
  }

  enable(): void {
    this.#disabled = false;
  }

  override get(cacheKey: string): ClientSideCacheEntry | undefined {
    if (this.#disabled) {
      return undefined;
    }

    return super.get(cacheKey);
  }

  override has(cacheKey: string): boolean {
    if (this.#disabled) {
      return false;
    }

    return super.has(cacheKey);
  }

  onPoolClose(): void {
    this.clear();
  }
}

export class BasicPooledClientSideCache extends PooledClientSideCacheProvider {
  override onError() {
    this.clear(false);
  }

  override onClose() {
    this.clear(false);
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

    return ret && this.#creator.client.isReady && this.#creator.client.socketEpoch == this.#creator.epoch
  }
}

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

  override onError() { }

  override onClose() { }
}
