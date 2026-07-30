export type { Either, PolicyResult, PolicyResolver, ModuleMetadataRecords, CommandMetadataRecords } from './types';

export { StaticMetadataResolver } from './static-metadata-resolver';
export { DynamicPolicyResolverFactory, type CommandFetcher } from './dynamic-policy-resolver-factory';

export * from './policies-constants';
export { isReplicaSafe, isCacheable } from './predicates';
export { COMMAND_METADATA } from './command-metadata-data';

import { StaticMetadataResolver } from './static-metadata-resolver';
import { COMMAND_METADATA } from './command-metadata-data';

/**
 * Process-wide resolver over the generated static metadata table. The table is
 * static generated data, so a single shared instance serves every client
 * (standalone, cluster, sentinel, pool) — no constructor threading required.
 * A future per-connection dynamic resolver built from each server's own
 * `COMMAND` reply can chain to this one via the constructor's fallback.
 */
export const defaultCommandMetadata = new StaticMetadataResolver(COMMAND_METADATA);
