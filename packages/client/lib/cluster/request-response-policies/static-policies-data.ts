import { CommandPolicies, REQUEST_POLICIES_WITH_DEFAULTS, RESPONSE_POLICIES_WITH_DEFAULTS } from './policies-constants';

export type CommandPolicyRecords = Record<string, CommandPolicies>;
// The response of the COMMAND command uses "." to separate the module name from the command name.
// For example, "ft.search" refers to the "search" command in the "ft" module. It is important to use the same naming convention here.
export type ModulePolicyRecords = Record<string, CommandPolicyRecords>;

export const POLICIES: ModulePolicyRecords = {
  ft: {
    create: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_NODES,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED
    },
    search: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL
    },
    aggregate: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL
    },
    sugadd: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED
    },
    sugget: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED
    },
    sugdel: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED
    },
    suglen: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED
    },
    spellcheck: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL
    },
    cursor: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.SPECIAL,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
    },
    dictadd: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED
    },
    dictdel: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED
    },
    dictdump: {
      request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
      response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
    }
  }
} as const;
