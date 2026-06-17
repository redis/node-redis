import { RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from '../commands/generic-transformers';

/**
 * Prepends `keyPrefix` to `key`.
 *
 * Returns `key` unchanged when `keyPrefix` is `undefined` (the no-prefix hot path).
 * Uses a plain string concatenation when both sides are strings, and falls back to
 * `Buffer.concat` when either side is a `Buffer`.
 */
export function prefixKey(keyPrefix: RedisArgument | undefined, key: RedisArgument): RedisArgument {
  if (keyPrefix === undefined) return key;

  if (typeof keyPrefix === 'string' && typeof key === 'string') {
    return keyPrefix + key;
  }

  return Buffer.concat([
    typeof keyPrefix === 'string' ? Buffer.from(keyPrefix) : keyPrefix,
    typeof key === 'string' ? Buffer.from(key) : key
  ]);
}

export interface CommandParser {
  redisArgs: ReadonlyArray<RedisArgument>;
  keys: ReadonlyArray<RedisArgument>;
  firstKey: RedisArgument | undefined;
  preserve: unknown;

  push: (...arg: Array<RedisArgument>) => unknown;
  pushVariadic: (vals: RedisVariadicArgument) => unknown;
  pushVariadicWithLength: (vals: RedisVariadicArgument) => unknown;
  pushVariadicNumber: (vals: number | Array<number>) => unknown;
  /**
   * Push a key, applying the configured `keyPrefix` (if any).
   * Pass `applyPrefix = false` to push a routing key that must NOT be prefixed
   * (e.g. a sharded Pub/Sub channel in `SPUBLISH`).
   */
  pushKey: (key: RedisArgument, applyPrefix?: boolean) => unknown; // normal push of keys
  pushKeys: (keys: RedisVariadicArgument) => unknown; // push multiple keys at a time
  pushKeysLength: (keys: RedisVariadicArgument) => unknown; // push multiple keys at a time
}

export class BasicCommandParser implements CommandParser {
  #redisArgs: Array<RedisArgument> = [];
  #keys: Array<RedisArgument> = [];
  readonly #keyPrefix: RedisArgument | undefined;
  preserve: unknown;

  /**
   * @param keyPrefix Optional prefix prepended to every key pushed via
   * `pushKey`/`pushKeys`/`pushKeysLength`. Empty values are treated as "no prefix".
   */
  constructor(keyPrefix?: RedisArgument) {
    this.#keyPrefix = keyPrefix === undefined || keyPrefix.length === 0 ? undefined : keyPrefix;
  }

  get redisArgs() {
    return this.#redisArgs;
  }

  get keys() {
    return this.#keys;
  }

  get firstKey() {
    return this.#keys[0];
  }

  get cacheKey() {
    const tmp = new Array(this.#redisArgs.length*2);

    for (let i = 0; i < this.#redisArgs.length; i++) {
      tmp[i] = this.#redisArgs[i].length;
      tmp[i+this.#redisArgs.length] = this.#redisArgs[i];
    }

    return tmp.join('_');
  }

  push(...arg: Array<RedisArgument>) {
    this.#redisArgs.push(...arg);
  };

  pushVariadic(vals: RedisVariadicArgument) {
    if (Array.isArray(vals)) {
      for (const val of vals) {
        this.push(val);
      }
    } else {
      this.push(vals);
    }
  }

  pushVariadicWithLength(vals: RedisVariadicArgument) {
    if (Array.isArray(vals)) {
      this.#redisArgs.push(vals.length.toString());
    } else {
      this.#redisArgs.push('1');
    }
    this.pushVariadic(vals);
  }

  pushVariadicNumber(vals: number | number[]) {
    if (Array.isArray(vals)) {
      for (const val of vals) {
        this.push(val.toString());
      }
    } else {
      this.push(vals.toString());
    }
  }

  /**
   * Registers a key as both a routing key (`keys`) and a wire argument (`redisArgs`),
   * prepending `keyPrefix` when `applyPrefix` is true.
   */
  #addKey(key: RedisArgument, applyPrefix: boolean) {
    const finalKey = applyPrefix ? prefixKey(this.#keyPrefix, key) : key;
    this.#keys.push(finalKey);
    this.#redisArgs.push(finalKey);
  }

  pushKey(key: RedisArgument, applyPrefix = true) {
    this.#addKey(key, applyPrefix);
  }

  pushKeysLength(keys: RedisVariadicArgument) {
    if (Array.isArray(keys)) {
      this.#redisArgs.push(keys.length.toString());
    } else {
      this.#redisArgs.push('1');
    }
    this.pushKeys(keys);
  }

  pushKeys(keys: RedisVariadicArgument) {
    if (Array.isArray(keys)) {
      for (const key of keys) {
        this.#addKey(key, true);
      }
    } else {
      this.#addKey(keys, true);
    }
  }
}
