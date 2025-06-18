export const REQUEST_POLICIES_WITH_DEFAULTS = {
  /**
   * The client should execute the command on all nodes - masters and replicas alike.
   * This tip is in-use by commands that don't accept key name arguments.
   * The command operates atomically per shard.
   */
  ALL_NODES: "all_nodes",
  /**
   * The client should execute the command on all master shards (e.g., the DBSIZE command).
   * This tip is in-use by commands that don't accept key name arguments.
   * The command operates atomically per shard.
   */
  ALL_SHARDS: "all_shards",
  /**
   * The client should execute the command on several shards.
   * The client should split the inputs according to the hash slots of its input key name arguments.
   * For example, the command DEL {foo} {foo}1 bar should be split to DEL {foo} {foo}1 and DEL bar.
   * If the keys are hashed to more than a single slot,
   * the command must be split even if all the slots are managed by the same shard.
   * Examples for such commands include MSET, MGET and DEL.
   * However, note that SUNIONSTORE isn't considered as multi_shard because all of its keys must belong to the same hash slot.
   */
  MULTI_SHARD: "multi_shard",
  /**
   * Indicates a non-trivial form of the client's request policy, such as the SCAN command.
   */
  SPECIAL: "special",
  /**
   * The default behavior a client should implement for commands without the request_policy tip is as follows:
   * 
   * 1. The command doesn't accept key name arguments:
   * the client can execute the command on an arbitrary shard.
   */
  DEFAULT_KEYLESS: "default-keyless",
  /**
   * The default behavior a client should implement for commands without the request_policy tip is as follows:
   * 
   * 2. For commands that accept one or more key name arguments: 
   * the client should route the command to a single shard,
   * as determined by the hash slot of the input keys.
   */
  DEFAULT_KEYED: "default-keyed"
} as const;

export type RequestPolicyWithDefaults = typeof REQUEST_POLICIES_WITH_DEFAULTS[keyof typeof REQUEST_POLICIES_WITH_DEFAULTS];

export const RESPONSE_POLICIES_WITH_DEFAULTS = {
  /**
   * The client should return success if at least one shard didn't reply with an error.
   * The client should reply with the first non-error reply it obtains.
   * If all shards return an error, the client can reply with any one of these.
   * Example: SCRIPT KILL command that's sent to all shards.
   */
  ONE_SUCCEEDED: "one_succeeded",
  /**
   * The client should return successfully only if there are no error replies.
   * Even a single error reply should disqualify the aggregate and be returned.
   * Otherwise, the client should return one of the non-error replies.
   * Examples: CONFIG SET, SCRIPT FLUSH and SCRIPT LOAD commands.
   */
  ALL_SUCCEEDED: "all_succeeded",
  /**
   * The client should return the result of a logical AND operation on all replies.
   * Only applies to integer replies, usually from commands that return either 0 or 1.
   * Example: SCRIPT EXISTS command returns 1 only when all shards report that a given script SHA1 sum is in their cache.
   */
  AGG_LOGICAL_AND: "agg_logical_and",
  /**
   * The client should return the result of a logical OR operation on all replies.
   * Only applies to integer replies, usually from commands that return either 0 or 1.
   */
  AGG_LOGICAL_OR: "agg_logical_or",
  /**
   * The client should return the minimal value from the replies.
   * Only applies to numerical replies.
   * Example: WAIT command should return the minimal number of synchronized replicas from all shards.
   */
  AGG_MIN: "agg_min",
  /**
   * The client should return the maximal value from the replies.
   * Only applies to numerical replies.
   */
  AGG_MAX: "agg_max",
  /**
   * The client should return the sum of replies.
   * Only applies to numerical replies.
   * Example: DBSIZE command.
   */
  AGG_SUM: "agg_sum",
  /**
   * Indicates a non-trivial form of reply policy.
   * Example: INFO command with complex aggregation logic.
   */
  SPECIAL: "special",
  /**
   * The default behavior for commands without a response_policy tip that don't accept key name arguments:
   * the client can aggregate all replies within a single nested data structure.
   * Example: KEYS command replies should be packed in a single array in no particular order.
   */
  DEFAULT_KEYLESS: "default-keyless",
  /**
   * The default behavior for commands without a response_policy tip that accept one or more key name arguments:
   * the client needs to retain the same order of replies as the input key names.
   * Example: MGET's aggregated reply should maintain key order.
   */
  DEFAULT_KEYED: "default-keyed"
} as const;

export type ResponsePolicyWithDefaults = typeof RESPONSE_POLICIES_WITH_DEFAULTS[keyof typeof RESPONSE_POLICIES_WITH_DEFAULTS];

export interface CommandPolicies {
  readonly request: RequestPolicyWithDefaults;
  readonly response: ResponsePolicyWithDefaults;
  readonly subcommands?: Record<string, CommandPolicies>;
  readonly isKeyless: boolean;
}