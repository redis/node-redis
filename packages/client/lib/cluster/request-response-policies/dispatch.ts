import { BasicCommandParser, type CommandParser } from '../../client/parser';
import type { RedisClientType } from '../../client';
import type {
  RedisArgument, RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping
} from '../../RESP/types';
import { RESP_TYPES } from '../../RESP/decoder';
import type { KeySpec } from '../../commands/generic-transformers';
import type RedisClusterSlots from '../cluster-slots';
import { splitMultiShardCommand, type SubCommand } from './multi-shard-splitter';
import {
  aggregateLogicalAnd,
  aggregateLogicalOr,
  aggregateMax,
  aggregateMerge,
  aggregateMin,
  aggregateSum
} from './generic-aggregators';
import {
  REQUEST_POLICIES_WITH_DEFAULTS,
  RESPONSE_POLICIES_WITH_DEFAULTS,
  type RequestPolicyWithDefaults,
  type ResponsePolicyWithDefaults
} from '../../command-metadata/policies-constants';
import { routeFtCursor } from './ft-cursor';
import { routeScan } from './scan-cursor';

// Routing runs *below* the typed command surface: routers never inspect the
// command's M/F/S/RESP/TM parameters, they just shuffle opaque clients from
// `slots` into the plan and on to `_execute`. So these types are deliberately
// not generic — they use the base constraint types. The engine re-narrows the
// client to its own instantiation at the `_execute` boundary.
type ClusterClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>;
type ClusterSlots = RedisClusterSlots<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>;

/**
 * One unit of work a request policy schedules. Pass-through policies set only
 * `client` (run the original command on that node). `multi_shard` sets `parser`
 * (a per-slot sub-command, routed by its own `firstKey`) and `groupIndices`
 * (where its replies belong in the reassembled result).
 */
export type RoutedCommand = {
  client?: ClusterClient;
  parser?: CommandParser;
  groupIndices?: Array<number>;
};

export type RequestRouter = (
  slots: ClusterSlots,
  parser: CommandParser,
  isReadonly: boolean | undefined,
  keySpecs: ReadonlyArray<KeySpec> | undefined
) => Promise<Array<RoutedCommand>>;

export type ResponseReducer<T> = (
  responsePromises: Promise<T>[],
  parser: CommandParser,
  /**
   * For `multi_shard` commands, `positionHints[p]` is the original 0-based
   * group ordinals carried by the p-th sub-command (plan order == promise
   * order). Reducers that preserve order (e.g. default-keyed MGET) use it to
   * scatter each sub-reply back into the caller's key order. `undefined`
   * entries mean "not split"; the whole array is absent for non-split commands.
   */
  positionHints?: Array<Array<number> | undefined>
) => Promise<T>;

// --- request routers ---

export const routeAllNodes: RequestRouter =
  async (slots) => (await slots.getAllClients()).map(client => ({ client }));

export const routeAllShards: RequestRouter =
  async (slots) => (await slots.getAllMasterClients()).map(client => ({ client }));

/**
 * Splits the command into one sub-command per hash slot (using the COMMAND key
 * specs as the reconstruction recipe) and returns a plan entry per slot. Each
 * entry carries its own sub-parser, so core `_execute` routes it by that
 * slot's `firstKey` and handles MOVED/ASK with the sub-command's own key.
 */
export const routeMultiShard: RequestRouter =
  async (_slots, parser, _isReadonly, keySpecs) => {
    const subCommands = splitMultiShardCommand(parser.redisArgs, keySpecs);
    return Array.from(subCommands.values(), sub => ({
      parser: buildSubParser(sub),
      groupIndices: sub.groupIndices
    }));
  };

/**
 * Rebuilds a `CommandParser` from a split sub-command, marking the keys at
 * their known positions so `firstKey` resolves to this slot's first key.
 */
function buildSubParser(sub: SubCommand): CommandParser {
  const parser = new BasicCommandParser();
  const keyPositions = new Set(sub.keyPositions);
  for (let i = 0; i < sub.args.length; i++) {
    const arg = sub.args[i] as RedisArgument;
    if (keyPositions.has(i)) {
      parser.pushKey(arg);
    } else {
      parser.push(arg);
    }
  }
  return parser;
}

// `nodeClient` connects lazily — with `minimizeConnections` a node may have
// no client until first use, and `.client!` would put `undefined` in the plan
// (breaking the post-reply hooks that attribute the reply to `plan[0].client`).
export const routeDefaultKeyless: RequestRouter =
  async (slots) => [{ client: await slots.nodeClient(slots.getRandomNode()) }];

export const routeDefaultKeyed: RequestRouter =
  async (slots, parser, isReadonly) =>
    [{ client: (await slots.getClientAndSlotNumber(parser.firstKey, isReadonly)).client }];

/**
 * Uppercased command key ("RANDOMKEY", "MEMORY STATS") used both to look up a
 * per-command special handler and to label warnings. `commandIdentifier`
 * preserves the caller's casing, so normalize before matching.
 */
function specialKey(parser: CommandParser): string {
  const { command, subcommand } = parser.commandIdentifier;
  const c = command.toUpperCase();
  return subcommand ? `${c} ${subcommand.toUpperCase()}` : c;
}

/**
 * Special-request routers. Looked up by `COMMAND SUBCOMMAND` first, then bare
 * `COMMAND` — SCAN registers bare because its second argument is a cursor,
 * which the naive `commandIdentifier` mistakes for a subcommand.
 */
export const SPECIAL_REQUEST_ROUTERS: Record<string, RequestRouter> = {
  'FT.CURSOR READ': routeFtCursor,
  'FT.CURSOR DEL': routeFtCursor,
  SCAN: routeScan
};

/**
 * Router for the `special` request policy. Commands with a dedicated handler
 * (e.g. FT.CURSOR sticky routing, cluster-wide SCAN) short-circuit into
 * `SPECIAL_REQUEST_ROUTERS` first. Everything else has non-trivial routing no
 * generic rule captures and no handler yet: route to a single (random) node
 * like a keyless command so it still works, but warn — the reply reflects
 * only that one node.
 */
export const routeSpecial: RequestRouter =
  async (slots, parser, isReadonly, keySpecs) => {
    const handler = SPECIAL_REQUEST_ROUTERS[specialKey(parser)]
      ?? SPECIAL_REQUEST_ROUTERS[parser.commandIdentifier.command.toUpperCase()];
    if (handler) return handler(slots, parser, isReadonly, keySpecs);

    console.warn(
      `node-redis: no cluster routing implemented for the "special" request policy of ` +
      `"${specialKey(parser)}"; routing to a single node. The reply may be incomplete.`
    );
    return [{ client: await slots.nodeClient(slots.getRandomNode()) }];
  };

// --- response reducers ---

export const reduceOneSucceeded = <T>(promises: Promise<T>[]): Promise<T> =>
  Promise.any(promises);

export const reduceAllSucceeded = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return responses[0];
};

export const reduceLogicalAnd = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateLogicalAnd(responses) as T;
};

export const reduceLogicalOr = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateLogicalOr(responses) as T;
};

export const reduceMin = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateMin(responses) as T;
};

export const reduceMax = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateMax(responses) as T;
};

export const reduceSum = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateSum(responses) as T;
};

/**
 * RANDOMKEY under `all_shards`: each master returns a random key from its own
 * keyspace (or nil when empty). Return one of the non-nil replies at random so
 * the result is a valid random key across the whole cluster and never a
 * false-nil when some shard is empty but others hold keys. All shards empty →
 * nil.
 */
export const reduceRandomKey = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  const keys = responses.filter(reply => reply != null);
  if (keys.length === 0) return responses[0];
  return keys[Math.floor(Math.random() * keys.length)];
};

/**
 * Per-command reducers for the `special` response policy, keyed like
 * `SPECIAL_REQUEST_ROUTERS` (`COMMAND SUBCOMMAND`, bare-command fallback). A
 * `special` response needs command-specific merging that no generic rule
 * captures; commands absent here hit `reduceSpecial`'s generic fallback. SCAN
 * (response also tipped `special`) needs no entry: its plan is single-node, so
 * the fallback passes the sole reply through and the cursor rewrite happens in
 * `finalizeScanCursor`.
 */
export const SPECIAL_RESPONSE_REDUCERS: Record<string, ResponseReducer<unknown>> = {
  RANDOMKEY: reduceRandomKey
};

/**
 * Entry point for the `special` response policy: dispatch to a per-command
 * reducer if one exists, else fall back to the default-keyless reduction (sole
 * reply as is, or a merge of a fan-out) so the command works instead of
 * throwing. Warn on the fallback because the merged shape is unlikely to be
 * what the command really wants.
 */
export const reduceSpecial = async <T>(promises: Promise<T>[], parser: CommandParser): Promise<T> => {
  const reducer = SPECIAL_RESPONSE_REDUCERS[specialKey(parser)]
    ?? SPECIAL_RESPONSE_REDUCERS[parser.commandIdentifier.command.toUpperCase()];
  if (reducer) return reducer(promises, parser) as Promise<T>;

  if (promises.length > 1) {
    console.warn(
      `node-redis: no cluster aggregation implemented for the "special" response policy of ` +
      `"${specialKey(parser)}"; merging replies from ${promises.length} nodes. The result shape may be wrong.`
    );
  }
  return reduceDefaultKeyless(promises);
};

export const reduceDefaultKeyless = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  // Merging is only meaningful for fan-out replies (e.g. KEYS under
  // all_shards); the single-target case must pass scalar replies through.
  if (responses.length === 1) return responses[0];
  return aggregateMerge(responses) as T;
};

export const reduceDefaultKeyed = async <T>(
  promises: Promise<T>[],
  _parser: CommandParser,
  positionHints?: Array<Array<number> | undefined>
): Promise<T> => {
  const responses = await Promise.all(promises);

  // Unsplit (single-target read, or a multi_shard command that landed on one
  // slot): pass the sole reply through unchanged.
  if (!positionHints?.some(hint => hint !== undefined)) {
    return responses[0];
  }

  // Split multi_shard (e.g. MGET across slots): each sub-reply is an array in
  // its own group order; scatter element i back to its original group ordinal
  // so the result matches the caller's key order regardless of slot/arrival.
  const result: Array<unknown> = [];
  responses.forEach((reply, p) => {
    const indices = positionHints[p];
    if (!indices) {
      throw new Error('default-keyed reducer: split reply missing position hints');
    }
    const elements = reply as Array<unknown>;
    indices.forEach((groupIndex, i) => {
      result[groupIndex] = elements[i];
    });
  });
  return result as T;
};

/**
 * Response policies whose reducers compute over raw numbers (scalars or
 * number arrays). Per-node replies for these plans are decoded *without* the
 * caller's type mapping — a `NUMBER: String` mapping would otherwise feed
 * strings into the numeric aggregators and throw — and the caller's mapping
 * is applied to the aggregated result instead (`remapAggregateReply`).
 */
export const NUMERIC_AGG_POLICIES: ReadonlySet<ResponsePolicyWithDefaults> = new Set([
  RESPONSE_POLICIES_WITH_DEFAULTS.AGG_SUM,
  RESPONSE_POLICIES_WITH_DEFAULTS.AGG_MIN,
  RESPONSE_POLICIES_WITH_DEFAULTS.AGG_MAX,
  RESPONSE_POLICIES_WITH_DEFAULTS.AGG_LOGICAL_AND,
  RESPONSE_POLICIES_WITH_DEFAULTS.AGG_LOGICAL_OR
]);

/**
 * Applies the caller's NUMBER type mapping to a numeric aggregate (scalar, or
 * an array for the element-wise reducers like SCRIPT EXISTS), so aggregated
 * fan-out replies keep the same shape a standalone client would return.
 * Aggregation itself runs in JS number space, so — unlike standalone decode —
 * a `NUMBER: String` mapping does not preserve integer precision above 2^53
 * (see cluster-policy-caveats.md).
 */
export function remapAggregateReply<T>(reply: T, typeMapping: TypeMapping | undefined): T {
  const map = typeMapping?.[RESP_TYPES.NUMBER];
  if (!map || map === Number) return reply;
  // NUMBER maps to NumberConstructor | StringConstructor; both are callable.
  const apply = map as (value: number) => unknown;
  return (Array.isArray(reply)
    ? reply.map(value => apply(value as number))
    : apply(reply as number)) as T;
}

// --- registries ---

export const REQUEST_ROUTERS = {
  [REQUEST_POLICIES_WITH_DEFAULTS.ALL_NODES]: routeAllNodes,
  [REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS]: routeAllShards,
  [REQUEST_POLICIES_WITH_DEFAULTS.MULTI_SHARD]: routeMultiShard,
  [REQUEST_POLICIES_WITH_DEFAULTS.SPECIAL]: routeSpecial,
  [REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS]: routeDefaultKeyless,
  [REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED]: routeDefaultKeyed
} as const satisfies Record<RequestPolicyWithDefaults, RequestRouter>;

export const RESPONSE_REDUCERS = {
  [RESPONSE_POLICIES_WITH_DEFAULTS.ONE_SUCCEEDED]: reduceOneSucceeded,
  [RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED]: reduceAllSucceeded,
  [RESPONSE_POLICIES_WITH_DEFAULTS.AGG_LOGICAL_AND]: reduceLogicalAnd,
  [RESPONSE_POLICIES_WITH_DEFAULTS.AGG_LOGICAL_OR]: reduceLogicalOr,
  [RESPONSE_POLICIES_WITH_DEFAULTS.AGG_MIN]: reduceMin,
  [RESPONSE_POLICIES_WITH_DEFAULTS.AGG_MAX]: reduceMax,
  [RESPONSE_POLICIES_WITH_DEFAULTS.AGG_SUM]: reduceSum,
  [RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL]: reduceSpecial,
  [RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS]: reduceDefaultKeyless,
  [RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED]: reduceDefaultKeyed
} as const satisfies Record<ResponsePolicyWithDefaults, ResponseReducer<unknown>>;
