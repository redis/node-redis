export const REQUEST_POLICIES_WITH_DEFAULTS = {
  ALL_NODES: "all_nodes",
  ALL_SHARDS: "all_shards",
  MULTI_SHARD: "multi_shard",
  SPECIAL: "special",
  DEFAULT_KEYLESS: "default-keyless",
  DEFAULT_KEYED: "default-keyed"
} as const;

export type RequestPolicyWithDefaults = typeof REQUEST_POLICIES_WITH_DEFAULTS[keyof typeof REQUEST_POLICIES_WITH_DEFAULTS];

export const RESPONSE_POLICIES_WITH_DEFAULTS = {
  ONE_SUCCEEDED: "one_succeeded",
  ALL_SUCCEEDED: "all_succeeded",
  AGG_LOGICAL_AND: "agg_logical_and",
  AGG_LOGICAL_OR: "agg_logical_or",
  AGG_MIN: "agg_min",
  AGG_MAX: "agg_max",
  AGG_SUM: "agg_sum",
  SPECIAL: "special",
  DEFAULT_KEYLESS: "default-keyless",
  DEFAULT_KEYED: "default-keyed"
} as const;

export type ResponsePolicyWithDefaults = typeof RESPONSE_POLICIES_WITH_DEFAULTS[keyof typeof RESPONSE_POLICIES_WITH_DEFAULTS];

export interface CommandPolicies {
  readonly request: RequestPolicyWithDefaults;
  readonly response: ResponsePolicyWithDefaults;
}