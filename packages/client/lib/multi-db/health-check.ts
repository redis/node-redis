import type { RedisArgument, ReplyUnion } from '../RESP/types';

/**
 * Narrow handle a health check probes through — not the raw client, so checks
 * cannot bypass the failover layer.
 */
export interface HealthCheckTarget {
  id: string;
  sendCommand(args: Array<RedisArgument>): Promise<ReplyUnion>;
}

/**
 * One probe against one member. Scheduling, probe counts and the
 * ALL/MAJORITY/ANY aggregation policy are owned by the probe runner, not the
 * check itself (FR-004/FR-008).
 */
export interface HealthCheck {
  probe(target: HealthCheckTarget): Promise<boolean>;
}
