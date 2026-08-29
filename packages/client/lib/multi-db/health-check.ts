import type { RedisArgument, ReplyUnion } from '../RESP/types';

/**
 * Narrow handle a health check probes through — pins the probe to one
 * specific member and keeps the raw member client internal.
 */
export interface HealthCheckTarget {
  id: string;
  sendCommand(args: Array<RedisArgument>): Promise<ReplyUnion>;
}

/**
 * One probe against one member: resolve `true` if the member is healthy,
 * `false` if not. Scheduling, probe counts and the ALL/MAJORITY/ANY
 * aggregation policy are owned by the probe runner, not the check itself.
 */
export interface HealthCheck {
  probe(target: HealthCheckTarget): Promise<boolean>;
}
