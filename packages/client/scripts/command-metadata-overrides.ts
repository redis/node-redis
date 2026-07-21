/**
 * Curation applied on top of the raw COMMAND dump when regenerating
 * `command-metadata-data.ts`, keeping the static data aligned with the HLD
 * "Command Routing Policy Table" (see ft-policies.spec.ts).
 *
 * Rationale: the server reports internal, debug, deprecated and cluster-admin
 * commands that the HLD deliberately omits from client routing. They are
 * excluded here so the static phase refuses to resolve them (they fall through
 * to the fallback resolver instead).
 *
 * Scope: this file curates TABLE SHAPE only — which entries exist and their
 * routing policies (request/response/isKeyless). Per-command value intent
 * (`IS_READ_ONLY`, `CACHEABLE`) does NOT belong here: it lives in the command
 * definitions and wins over the table via the override-first predicates
 * (`isReplicaSafe` / `isCacheable` in `lib/command-metadata/predicates.ts`).
 */
import type { CommandMetadata } from '../lib/command-metadata/policies-constants';

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
 * Partial-entry overrides, keyed by `module.command`, merged onto the
 * generated entry (override keys win; unspecified keys keep the server value).
 * `subcommands` is deep-merged per subcommand, so an override touching one
 * subcommand keeps its siblings' server-derived policies.
 *
 * `ft.cursor` is pinned to the HLD `special` request policy (sticky cursor):
 * FT.CURSOR READ/DEL must reach the node that served the FT.AGGREGATE that
 * minted the cursor. The client-side sticky machinery lives in
 * `lib/cluster/request-response-policies/ft-cursor.ts` (router + capture) and
 * the cursor binding map on `cluster-slots.ts`. The response stays
 * `default-keyless` (single-node pass-through). Pinned as an override so the
 * static table is deterministic regardless of what a given server reports for
 * the container command's subcommands.
 *
 * `KEYLESS` reverts: the server tips these commands `special` (request and/or
 * response), but there is no meaningful client-side interpretation for them
 * (the HLD gives a recipe only for FT.CURSOR; SCAN and RANDOMKEY have obvious
 * client semantics and are implemented — see
 * `lib/cluster/request-response-policies/scan-cursor.ts` and
 * `reduceRandomKey` in `dispatch.ts` — so they keep their server-reported
 * policies). Without an interpretation they are pinned back to master's
 * behavior — `default-keyless` routes to a single random node and passes the
 * sole reply through. `memory purge`/`usage`, `latency reset` and
 * `hotkeys help` are untouched: the per-subcommand deep-merge keeps their
 * server-derived policies.
 */
const KEYLESS = { request: 'default-keyless', response: 'default-keyless', isKeyless: true } as const;

export const COMMAND_OVERRIDES: Readonly<Record<string, Partial<CommandMetadata>>> = {
  // MSETEX is pinned back to master's single-node routing (server tips it
  // multi_shard). Splitting breaks its documented atomic contract twice over:
  // NX/XX is all-or-nothing across ALL keys, but each shard would evaluate the
  // condition against its own subset (partial writes), and the 0/1 per-shard
  // replies cannot be aggregated honestly. The server itself excludes the
  // conditional sibling MSETNX from multi_shard for the same reason. Pinned
  // default-keyed: single-slot calls keep full server-side atomicity,
  // cross-slot calls get the server's own CROSSSLOT error (use hash tags).
  // keySpecs explicitly unset — only the multi_shard splitter consumes them,
  // and the shallow merge would otherwise keep the server-derived specs.
  'std.msetex': { request: 'default-keyed', response: 'default-keyed', keySpecs: undefined },
  'ft.cursor': {
    request: 'special',
    response: 'default-keyless',
    isKeyless: true,
    subcommands: {
      read: { request: 'special', response: 'default-keyless', isKeyless: true },
      del: { request: 'special', response: 'default-keyless', isKeyless: true }
    }
  },
  'std.info': KEYLESS,
  'std.memory': { subcommands: { doctor: KEYLESS, 'malloc-stats': KEYLESS, stats: KEYLESS } },
  'std.latency': { subcommands: { doctor: KEYLESS, graph: KEYLESS, histogram: KEYLESS, history: KEYLESS, latest: KEYLESS } },
  'std.function': { subcommands: { stats: KEYLESS } },
  'std.hotkeys': { subcommands: { get: KEYLESS, reset: KEYLESS, start: KEYLESS, stop: KEYLESS } }
};
