import { RedisClientOptions } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { CommandSignature, CommanderConfig, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import COMMANDS from '../commands';
import { PubSubType, PubSubTypeListeners } from '../client/pub-sub';
import RedisSentinel, { RedisSentinelClient } from '.';

export interface RedisNode {
  host: string;
  port: number;
}

export interface RedisSentinelOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = RespVersions,
  TYPE_MAPPING extends TypeMapping = TypeMapping
> extends SentinelCommander<M, F, S, RESP, TYPE_MAPPING> {
  /**
   * TODO
   */
  name: string;
  /**
   * TODO
   */
  useReplicas?: boolean;
  /**
   * TODO
   */
  sentinelRootNodes: Array<RedisNode>;
  /**
   * TODO
   */
  maxCommandRediscovers?: number;
  /**
   * TODO
   */
  nodeClientOptions?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  /**
   * TODO
   */
  sentinelClientOptions?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  /**
   * TODO
   */
  masterPoolSize?: number;
  /**
   * TODO
   */
  replicaPoolSize?: number;
  /**
   * TODO
   */
  debug?: boolean;
  /**
   * TODO
   */
  scanInterval?: number;
}

export type PubSubToResubscribe = Record<
  PubSubType.CHANNELS | PubSubType.PATTERNS,
  PubSubTypeListeners
>;

export interface SentinelCommander<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  // POLICIES extends CommandPolicies
> extends CommanderConfig<M, F, S, RESP> {
  commandOptions?: CommandOptions<TYPE_MAPPING>;
}

export type RedisSentinelClientOptions = Omit<
  RedisClientOptions,
  keyof SentinelCommander<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping/*, CommandPolicies*/>
>;

type WithCommands<
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], RESP, TYPE_MAPPING>;
};

type WithModules<
  M extends RedisModules,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof M]: {
    [C in keyof M[P]]: CommandSignature<M[P][C], RESP, TYPE_MAPPING>;
  };
};

type WithFunctions<
  F extends RedisFunctions,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [L in keyof F]: {
    [C in keyof F[L]]: CommandSignature<F[L][C], RESP, TYPE_MAPPING>;
  };
};

type WithScripts<
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof S]: CommandSignature<S[P], RESP, TYPE_MAPPING>;
};

export type RedisSentinelClientType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {},
> = (
  RedisSentinelClient<M, F, S, RESP, TYPE_MAPPING> &
  WithCommands<RESP, TYPE_MAPPING> &
  WithModules<M, RESP, TYPE_MAPPING> &
  WithFunctions<F, RESP, TYPE_MAPPING> &
  WithScripts<S, RESP, TYPE_MAPPING>
);

export type RedisSentinelType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {},
  // POLICIES extends CommandPolicies = {}
> = (
  RedisSentinel<M, F, S, RESP, TYPE_MAPPING> &
  WithCommands<RESP, TYPE_MAPPING> &
  WithModules<M, RESP, TYPE_MAPPING> &
  WithFunctions<F, RESP, TYPE_MAPPING> &
  WithScripts<S, RESP, TYPE_MAPPING>
);

export interface SentinelCommandOptions<
  TYPE_MAPPING extends TypeMapping = TypeMapping
> extends CommandOptions<TYPE_MAPPING> {}

export type ProxySentinel = RedisSentinel<any, any, any, any, any>;
export type ProxySentinelClient = RedisSentinelClient<any, any, any, any, any>;
export type NamespaceProxySentinel = { self: ProxySentinel };
export type NamespaceProxySentinelClient = { self: ProxySentinelClient };

export type NodeInfo = {
  ip: any,
  port: any,
  flags: any,
};

export type RedisSentinelEvent = NodeChangeEvent | SizeChangeEvent;
 
export type NodeChangeEvent = {
  type: "SENTINEL_CHANGE" | "MASTER_CHANGE" | "REPLICA_ADD" | "REPLICA_REMOVE";
  node: RedisNode;
}

export type SizeChangeEvent = {
  type: "SENTINE_LIST_CHANGE";
  size: Number;
}