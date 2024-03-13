import { RedisArgument, RespVersions } from "../..";
import { RedisVariadicArgument } from "../commands/generic-transformers";

export interface CommandParser {
  redisArgs: Array<RedisArgument>;
  respVersion: RespVersions;
  preserve: unknown;
  
  push: (arg: RedisArgument) => unknown;
  pushVariadic: (vals: RedisVariadicArgument) => unknown;
  pushKey: (key: RedisArgument) => unknown; // normal push of keys
  pushKeys: (keys: RedisVariadicArgument) => unknown; // push multiple keys at a time
  setCachable: () => unknown;
  setPreserve: (val: unknown) => unknown;
}

export abstract class AbstractCommandParser implements CommandParser {
  #redisArgs: Array<RedisArgument> = [];
  #respVersion: RespVersions;
  #preserve: unknown;

  constructor(respVersion: RespVersions = 2) {
    this.#respVersion = respVersion;
  }

  get redisArgs() {
    return this.#redisArgs;
  }

  get respVersion() {
    return this.#respVersion;
  }

  get preserve() {
    return this.#preserve;
  }

  push(arg: RedisArgument) {
    this.#redisArgs.push(arg);

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

  pushKey(key: RedisArgument) {
    this.#redisArgs.push(key);
  };

  pushKeys(keys: RedisVariadicArgument) {
    if (Array.isArray(keys)) {
      this.#redisArgs.push(...keys);
    } else {
      this.#redisArgs.push(keys);
    }
  }

  setPreserve(val: unknown) {
    this.#preserve = val;
  }

  setCachable() {};
}

/* Note: I do it this way, where BasicCommandParser extends Abstract without any changes,
   and CachedCommandParser extends Abstract with changes, to enable them to be easily 
   distinguishable at runtime.  If Cached extended Basic, then Cached would also be a Basic,
   thereby making them harder to distinguish.
*/
export class BasicCommandParser extends AbstractCommandParser {};

export interface ClusterCommandParser extends CommandParser {
  firstKey: RedisArgument | undefined;
}

export class BasicClusterCommandParser extends BasicCommandParser  implements ClusterCommandParser {
  firstKey: RedisArgument | undefined;

  override pushKey(key: RedisArgument): void {
    if (!this.firstKey) {
      this.firstKey = key;
    }
    super.pushKey(key);
  }
}