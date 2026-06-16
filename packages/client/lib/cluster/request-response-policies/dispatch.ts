import { BasicCommandParser, type CommandParser } from '../../client/parser';
import type { RedisClientType } from '../../client';
import type {
  RedisArgument, RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping
} from '../../RESP/types';
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
} from './policies-constants';

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

export const routeDefaultKeyless: RequestRouter =
  async (slots) => [{ client: slots.getRandomNode().client! }];

export const routeDefaultKeyed: RequestRouter =
  async (slots, parser, isReadonly) =>
    [{ client: (await slots.getClientAndSlotNumber(parser.firstKey, isReadonly)).client }];

export const routeSpecial: RequestRouter =
  async (_slots, parser) => {
    const { command, subcommand } = parser.commandIdentifier;
    const label = subcommand ? `${command} ${subcommand}` : command;
    throw new Error(`Special request policy not implemented for ${label}`);
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

export const reduceSpecial = async <T>(_promises: Promise<T>[], parser: CommandParser): Promise<T> => {
  const { command, subcommand } = parser.commandIdentifier;
  const label = subcommand ? `${command} ${subcommand}` : command;
  throw new Error(`Special response policy not implemented for ${label}`);
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
