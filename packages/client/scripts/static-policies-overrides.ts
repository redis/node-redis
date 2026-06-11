/**
 * Curation applied on top of the raw COMMAND dump when regenerating
 * `static-policies-data.ts`, keeping the static data aligned with the HLD
 * "Command Routing Policy Table" (see ft-policies.spec.ts).
 *
 * Rationale: the server reports internal, debug, deprecated and cluster-admin
 * commands that the HLD deliberately omits from client routing. They are
 * excluded here so the static phase refuses to resolve them (they fall through
 * to the fallback resolver instead).
 */
import type { CommandPolicies } from '../lib/cluster/request-response-policies/policies-constants';

/** Entire modules to drop (internal / cluster-admin command namespaces). */
export const EXCLUDED_MODULES: ReadonlySet<string> = new Set(['_ft', 'search']);

/** Individual `module.command` entries to drop. */
export const EXCLUDED_COMMANDS: ReadonlySet<string> = new Set([
  // FT internal conditional variants
  'ft._aliasaddifnx',
  'ft._aliasdelifx',
  'ft._alterifnx',
  'ft._createifnx',
  'ft._dropifx',
  'ft._dropindexifx',
  // FT debug/introspection not in the HLD table
  'ft._list',
  'ft.config',
  // FT deprecated legacy (pre-2.0) commands
  'ft.add',
  'ft.del',
  'ft.get',
  'ft.mget',
  'ft.safeadd',
  'ft.synadd',
  // Not yet in the HLD routing table
  'ft.hybrid',
  // Cluster-admin
  'timeseries.clusterset'
]);

/**
 * Full-entry replacements, keyed by `module.command`.
 *
 * `ft.cursor` is pinned to plain default-keyless (its `special` request-policy
 * subcommands stripped) until the special-handler registry and cursor binding
 * state land — see the note in ft-policies.spec.ts.
 */
export const COMMAND_OVERRIDES: Readonly<Record<string, CommandPolicies>> = {
  'ft.cursor': {
    request: 'default-keyless',
    response: 'default-keyless',
    isKeyless: true
  }
};
