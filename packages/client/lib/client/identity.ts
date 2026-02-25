import { randomBytes } from 'node:crypto';
import { RedisClusterClientOptions } from '../cluster';

/**
 * Maximum length for client identity IDs.
 * Keeps IDs reasonable for OpenTelemetry attributes and logging.
 * @internal
 */
const MAX_ID_LENGTH = 128;

/**
 * @internal
 */
export enum ClientRole {
  STANDALONE = 'standalone',
  CLUSTER = 'cluster',
  CLUSTER_NODE = 'clusterNode',
  POOL = 'pool',
  POOL_MEMBER = 'poolMember',
  SENTINEL = 'sentinel',
  SENTINEL_CLIENT = 'sentinelClient',
}

/**
 * Identity for all Redis clients.
 * Contains only the stable identity info (id, role, parentId).
 * Use dynamic methods to get current host/port/db to avoid drift.
 * @internal
 */
export interface ClientIdentity {
  readonly id: string;
  readonly role: ClientRole;
  readonly parentId?: string;
}

/**
 * Truncates a prefix string to fit within MAX_ID_LENGTH when combined with suffix.
 * Format when truncated: {truncated_prefix}...-{hash}
 * @internal
 */
const truncateId = (prefix: string, hash: string): string => {
  const suffix = `-${hash}`;
  const fullId = `${prefix}${suffix}`;

  if (fullId.length <= MAX_ID_LENGTH) {
    return fullId;
  }

  // Reserve space for '...' and suffix
  const ellipsis = '...';
  const maxPrefixLength = MAX_ID_LENGTH - ellipsis.length - suffix.length;
  const truncatedPrefix = prefix.substring(0, maxPrefixLength);
  return `${truncatedPrefix}${ellipsis}${suffix}`;
};

/**
 * Generates a client identity ID in the format: $host:$port/$db-$hash
 * Truncated to MAX_ID_LENGTH if necessary.
 * @internal
 */
export const generateClientId = (
  host?: string,
  port?: number,
  db?: number,
): string => {
  const hash = randomBytes(4).toString('hex');

  const prefix = `${host ?? 'unknown'}:${port ?? 'unknown'}/${db ?? 'unknown'}`;
  return truncateId(prefix, hash);
};

/**
 * Generates a cluster identity ID by concatenating all root nodes: $host1:$port1,$host2:$port2,...-$hash
 * Truncated to MAX_ID_LENGTH if necessary.
 * @internal
 */
export const generateClusterClientId = (
  nodes: Array<RedisClusterClientOptions>,
): string => {
  const hash = randomBytes(4).toString('hex');
  const prefix = nodes
    .map(
      (n) => `${n?.socket?.host ?? 'unknown'}:${n?.socket?.port ?? 'unknown'}`,
    )
    .join(',');
  return truncateId(prefix, hash);
};
